import { unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';
import { debug, error, info, setFailed, warning } from '@actions/core';
import { exec } from '@actions/exec';
import type { ExecOptions } from '@actions/exec/lib/interfaces.js';
import { context } from '@actions/github';
import * as glob from '@actions/glob';
import {
	downloadToFile,
	getOptionalString,
	getSupportedEnvironmentInfo,
	parsePathAndFormat,
	verifyChecksum,
	verifySignature,
} from './utils.js';

/**
 * Main arguments/options for the action to run.
 */
export interface ActionArguments {
	/** Download URL for the Code Climate test reporter binary. @default https://codeclimate.com/downloads/test-reporter/test-reporter-latest-{platform}-{architecture} */
	downloadUrl?: string;
	/** Filesystem path where the Code Climate binary should be downloaded to. @default ./{current-directory}/cc-reporter */
	executable?: string;
	/** Command to execute to generate coverage report. */
	coverageCommand?: string;
	/** Working directory to change to before running the test reporter. @default Current directory */
	workingDirectory?: string;
	/** Turn on debugging mode for the Code Climate test reporter. @default false */
	codeClimateDebug?: string;
	/** Coverage locations. @see https://github.com/paambaati/codeclimate-action/?tab=readme-ov-file#inputs */
	coverageLocationsParam?: string;
	/** Coverage prefix. @see https://docs.codeclimate.com/docs/configuring-test-coverage#list-of-subcommands */
	coveragePrefix?: string;
	/** Verifies the downloaded binary with a Code Climate-provided SHA 256 checksum and GPG sinature. @default true */
	verifyDownload?: string;
	/** Verifies if the current OS and CPU architecture is supported by CodeClimate test reporter. */
	verifyEnvironment?: string;
}

const CURRENT_ENVIRONMENT = getSupportedEnvironmentInfo();
const PLATFORM = CURRENT_ENVIRONMENT.platform;
// REFER: https://docs.codeclimate.com/docs/configuring-test-coverage#locations-of-pre-built-binaries
/** Canonical download URL for the official CodeClimate reporter. */
export const DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${
	PLATFORM === 'win32' ? 'windows' : PLATFORM
}-${CURRENT_ENVIRONMENT.architecture === 'arm64' ? 'arm64' : 'amd64'}`;
/** Local file name of the CodeClimate reporter. */
export const EXECUTABLE = './cc-reporter';
export const CODECLIMATE_GPG_PUBLIC_KEY_ID =
	'9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85' as const;
const CODECLIMATE_GPG_PUBLIC_KEY_URL =
	`https://keys.openpgp.org/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}` as const;
const DEFAULT_COVERAGE_COMMAND = '';
const DEFAULT_WORKING_DIRECTORY = '';
const DEFAULT_CODECLIMATE_DEBUG = 'false';
const DEFAULT_COVERAGE_LOCATIONS = '';
const DEFAULT_VERIFY_DOWNLOAD = 'true';
const DEFAULT_VERIFY_ENVIRONMENT = 'true';

const SUPPORTED_GITHUB_EVENTS = [
	// Regular PRs.
	'pull_request',
	// PRs that were triggered on remote forks.
	'pull_request_target',
];

/** Central data structure that holds a list of all downloaded file artifacts. */
export const FILE_ARTIFACTS = new Set<string>();

/**
 * Downloads a given URL to a given filename and then records it in the global artifacts data structure.
 *
 * @param url Fully qualified URL to download.
 * @param file Local file path to save the downloaded content.
 * @param mode (Optional) File mode.
 */
export async function downloadAndRecord(
	url: string,
	file: string,
	mode?: number,
): Promise<void> {
	await downloadToFile(url, file, mode);
	FILE_ARTIFACTS.add(file);
}

export function prepareEnv() {
	const actionEnv = { ...process.env } as Record<
		'GITHUB_SHA' | 'GITHUB_REF' | 'GITHUB_EVENT_NAME' | 'GITHUB_HEAD_REF',
		string
	>;
	const env = { ...process.env } as typeof actionEnv &
		Record<'GIT_COMMIT_SHA' | 'GIT_BRANCH', string>;

	if (actionEnv.GITHUB_SHA !== undefined)
		env.GIT_COMMIT_SHA = actionEnv.GITHUB_SHA;
	if (actionEnv.GITHUB_REF !== undefined) env.GIT_BRANCH = actionEnv.GITHUB_REF;

	if (env.GIT_BRANCH)
		env.GIT_BRANCH = env.GIT_BRANCH.replace(/^refs\/heads\//, ''); // Remove 'refs/heads/' prefix (See https://github.com/paambaati/codeclimate-action/issues/42)

	if (
		actionEnv.GITHUB_EVENT_NAME &&
		SUPPORTED_GITHUB_EVENTS.includes(actionEnv.GITHUB_EVENT_NAME)
	) {
		env.GIT_BRANCH = actionEnv.GITHUB_HEAD_REF || env.GIT_BRANCH; // Report correct branch for PRs (See https://github.com/paambaati/codeclimate-action/issues/86)
		// biome-ignore lint/complexity/useLiteralKeys: This is so Biome and TypeScript strict mode don't fight.
		env.GIT_COMMIT_SHA = context.payload.pull_request?.['head']?.sha; // Report correct SHA for the head branch (See https://github.com/paambaati/codeclimate-action/issues/140)
	}

	return env;
}

/**
 * Verifies SHA256 checksum and the GPG signature for the downloaded Reporter executable.
 *
 * @param downloadUrl (Optional) Canonical download URL for the CodeClimate reporter.
 * @param executablePath (Optional) Local file name of the reporter executable.
 * @param algorithm (Optional) Algorithm to verify checksum @default 'sha256'.
 */
export async function verifyChecksumAndSignature(
	downloadUrl: string = DOWNLOAD_URL,
	executablePath: string = EXECUTABLE,
	algorithm = 'sha256',
): Promise<void> {
	const checksumUrl = `${downloadUrl}.${algorithm}`;
	const checksumFilePath = `${executablePath}.${algorithm}`;
	const signatureUrl = `${downloadUrl}.${algorithm}.sig`;
	const signatureFilePath = `${executablePath}.${algorithm}.sig`;
	const ccPublicKeyFilePath = 'public-key.asc';

	try {
		debug('ℹ️ Verifying CC Reporter checksum...');
		await downloadAndRecord(checksumUrl, checksumFilePath);
		const checksumVerified = await verifyChecksum(
			executablePath,
			checksumFilePath,
			algorithm,
		);
		if (!checksumVerified)
			throw new Error('CC Reporter checksum does not match!');
		debug('✅ CC Reported checksum verification completed...');
	} catch (err) {
		error((err as Error).message);
		setFailed('🚨 CC Reporter checksum verfication failed!');
		throw err;
	}

	try {
		debug('ℹ️ Verifying CC Reporter GPG signature...');
		await downloadAndRecord(signatureUrl, signatureFilePath);
		await downloadAndRecord(
			CODECLIMATE_GPG_PUBLIC_KEY_URL,
			ccPublicKeyFilePath,
		);
		const signatureVerified = await verifySignature(
			checksumFilePath,
			signatureFilePath,
			ccPublicKeyFilePath,
		);
		if (!signatureVerified)
			throw new Error('CC Reporter GPG signature is invalid!');
		debug('✅ CC Reported GPG signature verification completed...');
	} catch (err) {
		error((err as Error).message);
		setFailed('🚨 CC Reporter GPG signature verfication failed!');
		throw err;
	}
}

async function getLocationLines(
	coverageLocationPatternsParam: string,
): Promise<Array<string>> {
	const coverageLocationPatternsLines = coverageLocationPatternsParam
		.split(/\r?\n/)
		.filter((pat) => pat)
		.map((pat) => pat.trim());

	const patternsAndFormats =
		coverageLocationPatternsLines.map(parsePathAndFormat);

	const pathsWithFormat = await Promise.all(
		patternsAndFormats.map(async ({ format, pattern }) => {
			const globber = await glob.create(pattern);
			const paths = await globber.glob();
			const pathsWithFormat = paths.map(
				(singlePath) => `${singlePath}:${format}`,
			);
			return pathsWithFormat;
		}),
	);

	const coverageLocationLines = ([] as Array<string>).concat(
		...pathsWithFormat,
	);

	return coverageLocationLines;
}

export async function run({
	downloadUrl = DOWNLOAD_URL,
	executable = EXECUTABLE,
	coverageCommand = DEFAULT_COVERAGE_COMMAND,
	workingDirectory = DEFAULT_WORKING_DIRECTORY,
	codeClimateDebug = DEFAULT_CODECLIMATE_DEBUG,
	coverageLocationsParam = DEFAULT_COVERAGE_LOCATIONS,
	coveragePrefix,
	verifyDownload = DEFAULT_VERIFY_DOWNLOAD,
	verifyEnvironment = DEFAULT_VERIFY_ENVIRONMENT,
}: ActionArguments = {}): Promise<void> {
	let lastExitCode = 1;
	if (verifyEnvironment === 'true') {
		debug('ℹ️ Verifying environment...');
		const { supported, platform, architecture } = getSupportedEnvironmentInfo();
		if (!supported) {
			const errorMessage = `Unsupported platform and architecture! CodeClimate Test Reporter currently is not available for ${architecture} on ${platform} OS`;
			error(errorMessage);
			setFailed('🚨 Environment verification failed!');
			throw new Error(errorMessage);
		}
		lastExitCode = 0;
		debug('✅ Environment verification completed...');
	}

	if (workingDirectory) {
		debug(`ℹ️ Changing working directory to ${workingDirectory}`);
		try {
			chdir(workingDirectory);
			lastExitCode = 0;
			debug('✅ Changing working directory completed...');
		} catch (err) {
			error((err as Error).message);
			setFailed('🚨 Changing working directory failed!');
			throw err;
		}
	}

	try {
		debug(`ℹ️ Downloading CC Reporter from ${downloadUrl} ...`);
		await downloadAndRecord(downloadUrl, executable);
		debug('✅ CC Reporter downloaded...');
	} catch (err) {
		error((err as Error).message);
		setFailed('🚨 CC Reporter download failed!');
		warning(`Could not download ${downloadUrl}`);
		warning(
			'Please check if your platform is supported — see https://docs.codeclimate.com/docs/configuring-test-coverage#section-locations-of-pre-built-binaries',
		);
		throw err;
	}

	if (verifyDownload === 'true') {
		await verifyChecksumAndSignature(downloadUrl, executable);
	}

	const execOpts: ExecOptions = {
		env: prepareEnv(),
	};
	try {
		lastExitCode = await exec(executable, ['before-build'], execOpts);
		if (lastExitCode !== 0) {
			throw new Error(`Coverage after-build exited with code ${lastExitCode}`);
		}
		debug('✅ CC Reporter before-build checkin completed...');
	} catch (err) {
		error((err as Error).message);
		setFailed('🚨 CC Reporter before-build checkin failed!');
		throw err;
	}

	if (coverageCommand) {
		try {
			lastExitCode = await exec(coverageCommand, undefined, execOpts);
			if (lastExitCode !== 0) {
				throw new Error(`Coverage run exited with code ${lastExitCode}`);
			}
			debug('✅ Coverage run completed...');
		} catch (err) {
			error((err as Error).message);
			setFailed('🚨 Coverage run failed!');
			throw err;
		}
	} else {
		info(`ℹ️ 'coverageCommand' not set, so skipping building coverage report!`);
	}

	const coverageLocations = await getLocationLines(coverageLocationsParam);
	if (coverageLocations.length > 0) {
		debug(
			`Parsing ${
				coverageLocations.length
			} coverage location(s) — ${coverageLocations} (${typeof coverageLocations})`,
		);
		// Run format-coverage on each location.
		const parts: Array<string> = [];
		for (const i in coverageLocations) {
			const { format: type, pattern: location } = parsePathAndFormat(
				coverageLocations[i] as string,
			);
			if (!type) {
				const err = new Error(`Invalid formatter type ${type}`);
				debug(
					`⚠️ Could not find coverage formatter type! Found ${
						coverageLocations[i]
					} (${typeof coverageLocations[i]})`,
				);
				error(err.message);
				setFailed(
					'🚨 Coverage formatter type not set! Each coverage location should be of the format <file_path>:<coverage_format>',
				);
				throw err;
			}
			const commands = [
				'format-coverage',
				location,
				'-t',
				type,
				'-o',
				`codeclimate.${i}.json`,
			];
			if (codeClimateDebug === 'true') commands.push('--debug');
			if (coveragePrefix) {
				commands.push('--prefix', coveragePrefix);
			}

			parts.push(`codeclimate.${i}.json`);

			try {
				lastExitCode = await exec(executable, commands, execOpts);
				if (lastExitCode !== 0) {
					throw new Error(
						`Coverage formatter exited with code ${lastExitCode}`,
					);
				}
			} catch (err) {
				error((err as Error).message);
				setFailed('🚨 CC Reporter coverage formatting failed!');
				throw err;
			}
		}

		// Run sum coverage.
		const sumCommands = [
			'sum-coverage',
			...parts,
			'-p',
			`${coverageLocations.length}`,
			'-o',
			'coverage.total.json',
		];
		if (codeClimateDebug === 'true') sumCommands.push('--debug');

		try {
			lastExitCode = await exec(executable, sumCommands, execOpts);
			if (lastExitCode !== 0) {
				throw new Error(
					`Coverage sum process exited with code ${lastExitCode}`,
				);
			}
		} catch (err) {
			error((err as Error).message);
			setFailed('🚨 CC Reporter coverage sum failed!');
			throw err;
		}

		// Upload to Code Climate.
		const uploadCommands = ['upload-coverage', '-i', 'coverage.total.json'];
		if (codeClimateDebug === 'true') uploadCommands.push('--debug');
		try {
			lastExitCode = await exec(executable, uploadCommands, execOpts);
			if (lastExitCode !== 0) {
				throw new Error(`Coverage upload exited with code ${lastExitCode}`);
			}
			debug('✅ CC Reporter upload coverage completed!');
			return;
		} catch (err) {
			error((err as Error).message);
			setFailed('🚨 CC Reporter coverage upload failed!');
			throw err;
		}
	}

	try {
		const commands = ['after-build', '--exit-code', lastExitCode.toString()];
		if (codeClimateDebug === 'true') commands.push('--debug');
		if (coveragePrefix) {
			commands.push('--prefix', coveragePrefix);
		}

		lastExitCode = await exec(executable, commands, execOpts);
		if (lastExitCode !== 0) {
			throw new Error(`Coverage after-build exited with code ${lastExitCode}`);
		}
		debug('✅ CC Reporter after-build checkin completed!');
		return;
	} catch (err) {
		error((err as Error).message);
		setFailed('🚨 CC Reporter after-build checkin failed!');
		throw err;
	}
}

/* c8 ignore start */
const pathToThisFile = resolve(fileURLToPath(import.meta.url));
const pathPassedToNode = resolve(process.argv[1] as string);
const isThisFileBeingRunViaCLI = pathToThisFile.includes(pathPassedToNode);
if (isThisFileBeingRunViaCLI) {
	const coverageCommand = getOptionalString(
		'coverageCommand',
		DEFAULT_COVERAGE_COMMAND,
	);
	const workingDirectory = getOptionalString(
		'workingDirectory',
		DEFAULT_WORKING_DIRECTORY,
	);
	const codeClimateDebug = getOptionalString(
		'debug',
		DEFAULT_CODECLIMATE_DEBUG,
	);
	const coverageLocations = getOptionalString(
		'coverageLocations',
		DEFAULT_COVERAGE_LOCATIONS,
	);
	const coveragePrefix = getOptionalString('prefix');
	const verifyDownload = getOptionalString(
		'verifyDownload',
		DEFAULT_VERIFY_DOWNLOAD,
	);
	const verifyEnvironment = getOptionalString(
		'verifyEnvironment',
		DEFAULT_VERIFY_ENVIRONMENT,
	);

	try {
		run({
			downloadUrl: DOWNLOAD_URL,
			executable: EXECUTABLE,
			coverageCommand,
			workingDirectory,
			codeClimateDebug,
			coverageLocationsParam: coverageLocations,
			coveragePrefix,
			verifyDownload,
			verifyEnvironment,
		});
	} finally {
		// Finally clean up all artifacts that we downloaded.
		for (const artifact of FILE_ARTIFACTS) {
			try {
				unlinkSync(artifact);
			} catch {}
		}
	}
}
/* c8 ignore stop */
