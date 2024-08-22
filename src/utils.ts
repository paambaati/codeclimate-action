import { createHash, timingSafeEqual } from 'node:crypto';
import { createWriteStream, readFile } from 'node:fs';
import { arch as nodeArch, platform } from 'node:os';
import { config, platform as nodePlatform, release } from 'node:process';
import { promisify } from 'node:util';
import { getInput } from '@actions/core';
import arch from 'arch';
import fetch from 'node-fetch';
import {
	type VerificationResult,
	createMessage,
	readKey,
	readSignature,
	verify,
} from 'openpgp';

const readFileAsync = promisify(readFile);
type ReadFileAsyncOptions = Omit<Parameters<typeof readFileAsync>[1], 'string'>;

/** List of environments not supported by the CodeClimate test reporter. */
// REFER: https://github.com/codeclimate/test-reporter#download
export const UNSUPPORTED_ENVIRONMENTS: Array<{
	platform: ReturnType<typeof platform>;
	architecture: ReturnType<typeof arch>;
}> = [
	{
		platform: 'darwin',
		architecture: 'arm64',
	},
];

/**
 * Parses GitHub Action input and returns the optional value as a string.
 *
 * @param name Input name (declared in `action.yml`).
 * @param defaultValue Default value as optional fallback.
 * @returns Parsed input value.
 */
export const getOptionalString = (name: string, defaultValue = '') =>
	getInput(name, { required: false }) || defaultValue;

/**
 * Naively checks if 2 given JSON objects are identical.
 *
 * @param obj1 First JSON.
 * @param obj2 Second JSON.
 * @returns `true` if same, `false` if not.
 */
export const areObjectsEqual = (
	obj1: object | [],
	obj2: object | [],
): boolean => JSON.stringify(obj1) === JSON.stringify(obj2);

/**
 * Downloads the given URL as a file to the given file location.
 *
 * @param url URL to download.
 * @param file File path to save the download to.
 * @param mode (Optional) File mode.
 */
export function downloadToFile(
	url: string,
	file: string,
	mode = 0o755,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const controller = new AbortController();
		const timeout = setTimeout(
			() => {
				controller.abort();
			},
			// Timeout in 2 minutes.
			2 * 60 * 1000,
		);
		try {
			fetch(url, {
				redirect: 'follow',
				follow: 5,
				signal: controller.signal,
			})
				.then((response) => {
					if (response.status < 200 || response.status > 299) {
						throw new Error(
							`Download of '${url}' failed with response status code ${response.status}`,
						);
					}
					const writer = createWriteStream(file, { mode });
					response.body?.pipe(writer);
					writer.on('close', () => {
						return resolve();
					});
				})
				.catch((err) => {
					return reject(err);
				});
		} catch (err) {
			return reject(err);
		} finally {
			clearTimeout(timeout);
		}
	});
}

/**
 * Returns file contents as a `Buffer`.
 *
 * @param filePath File path to read.
 * @param options (Optional) File read options. @see https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#fs_filehandle_readfile_options
 * @returns File contents as `Buffer`.
 */
export async function getFileContents(
	filePath: string,
	options?: ReadFileAsyncOptions,
): Promise<Buffer> {
	return await readFileAsync(filePath, options);
}

/**
 * Returns file contents as a string. Useful for reading ASCII-encoded files.
 *
 * @param filePath File path to read.
 * @param options (Optional) File read options. @see https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#fs_filehandle_readfile_options
 * @returns File contents as string.
 */
export async function getFileContentsAsString(
	filePath: string,
	options?: ReadFileAsyncOptions,
): Promise<string> {
	return (await getFileContents(filePath, options)).toString('utf8');
}

/**
 * Returns given file's checksum by calculating the hash for the given algorithm.
 *
 * @param filePath File to generate checksum for.
 * @param algorithm Hashing algorithm. @default `sha256`
 * @returns Checksum of file as string.
 */
export async function getFileChecksum(
	filePath: string,
	algorithm = 'sha256',
): Promise<string> {
	const fileContents = await getFileContents(filePath);
	return createHash(algorithm).update(fileContents).digest('hex');
}

/**
 * Verifies that the file and its checksum file actually match. It generates
 * the checksum and compares it with the checksum in the accompanying checksum file.
 *
 * Note that the checksum file is of the format `<checksum> <filename>`.
 *
 * @param originalFile Original file for which the checksum was generated.
 * @param checksumFile Checksum file. Note that the checksum file has to be of the format <filename> <checksum>
 * @param algorithm (Optional) Hashing algorithm. @default `sha256`
 * @returns Returns `true` if checksums match, `false` if they don't.
 */
export async function verifyChecksum(
	originalFile: string,
	checksumFile: string,
	algorithm = 'sha256',
): Promise<boolean> {
	const binaryChecksum = await getFileChecksum(originalFile, algorithm);
	const declaredChecksumFileContents = await getFileContents(checksumFile);
	const declaredChecksum =
		declaredChecksumFileContents.toString().trim().split(/\s+/)[0] || '';
	try {
		return timingSafeEqual(
			Buffer.from(binaryChecksum),
			Buffer.from(declaredChecksum),
		);
	} catch {
		// Fail on other errors that can definitely cause the comparison to fail, including
		// mismatched Buffer byte lengths.
		return false;
	}
}

/**
 * Verifies the GPG signature of the given file.
 *
 * @param messageFilePath The message file that was signed.
 * @param signatureFilePath GPG signature file.
 * @param publicKeyFilePath GPG public key file.
 * @returns Returns `true` if signatures match, `false` if they don't.
 */
export async function verifySignature(
	messageFilePath: string,
	signatureFilePath: string,
	publicKeyFilePath: string,
): Promise<boolean> {
	const messageText = await getFileContentsAsString(messageFilePath);
	const signatureBuffer = await getFileContents(signatureFilePath);
	const publicKeyText = await getFileContentsAsString(publicKeyFilePath);

	const publicKey = await readKey({
		armoredKey: publicKeyText,
	});

	const signature = await readSignature({
		binarySignature: signatureBuffer,
	});
	const message = await createMessage({ text: messageText });
	const verificationResult = await verify({
		message,
		signature,
		verificationKeys: publicKey,
	});
	const { verified } = verificationResult.signatures[0] as VerificationResult;
	try {
		await verified;
		return true;
	} catch {
		return false;
	}
}

/**
 * Parses a given coverage config line that looks like this –
 *
 * ```
 * /Users/gp/projects/cc/*.lcov:lcov
 * ```
 *
 * or –
 *
 * ```
 * D:\Users\gp\projects\cc\*.lcov:lcov
 * ```
 *
 * into –
 *
 * ```json
 * { "format": "lcov", "pattern": "/Users/gp/projects/cc/*.lcov" }
 * ```
 *
 * or –
 *
 * ```json
 * { "format": "lcov", "pattern": "D:\Users\gp\projects\cc\*.lcov" }
 * ```
 * @param coverageConfigLine
 * @returns
 */
export function parsePathAndFormat(coverageConfigLine: string): {
	format: string;
	pattern: string;
} {
	let lineParts = coverageConfigLine.split(':');
	// On Windows, if the glob received an absolute path, the path will
	// include the Drive letter and the path – for example, `C:\Users\gp\projects\cc\*.lcov:lcov`
	// which leads to 2 colons. So we handle this special case.
	if (
		platform() === 'win32' &&
		(coverageConfigLine.match(/:/g) || []).length > 1
	) {
		lineParts = [
			lineParts.slice(0, -1).join(':'),
			lineParts.slice(-1)[0] as string,
		];
	}
	const format = lineParts.slice(-1)[0] as string;
	const pattern = lineParts.slice(0, -1)[0] as string;
	return { format, pattern };
}

/**
 * Reads information about the current operating system and the CPU architecture
 * and tells if the CodeClimate test reporter supports it.
 */
export function getSupportedEnvironmentInfo() {
	const currentEnvironment = {
		platform: platform(),
		architecture: arch(),
	};

	return {
		/** Returns `true` if the CodeClimate test reporter is actually supported on this environment. */
		supported: !UNSUPPORTED_ENVIRONMENTS.some((e) => {
			return (
				e.architecture === currentEnvironment.architecture &&
				e.platform === currentEnvironment.platform
			);
		}),
		/** The platform that the action is running on. */
		platform: currentEnvironment.platform,
		/** The CPU architecture that the action is running on. */
		architecture: currentEnvironment.architecture,
		/** The platform that the current Node.js binary was compiled for. */
		nodePlatform: nodePlatform,
		/** The CPU architecture that the current Node.js binary was compiled for. */
		nodeArchitecture: nodeArch,
		/** The CPU architecture of the host machine that compiled the current Node.js binary. */
		nodeHostArchitecture: config.variables.host_arch,
		/** Metadata related to the Node.js binary's release, including URLs for the source tarball and headers-only tarball. */
		nodeRelease: release,
	};
}

/* c8 ignore start */
/**
 * Detects if the logic is being currently executed inside a `tap` test.
 */
export function amICurrentlyBeingTestedByTap() {
	// REFER: https://node-tap.org/environment/#environment-variables-used-by-tap
	return Object.prototype.hasOwnProperty.call(process.env, 'TAP_CHILD_ID');
}
/* c8 ignore stop */
