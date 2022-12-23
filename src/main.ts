import { platform } from 'node:os';
import { chdir } from 'node:process';
import { unlinkSync } from 'node:fs';
import { debug, error, setFailed, warning, info } from '@actions/core';
import { exec } from '@actions/exec';
import { context } from '@actions/github';
import * as glob from '@actions/glob';
import {
  downloadToFile,
  getOptionalString,
  verifyChecksum,
  verifySignature,
} from './utils';
import type { ExecOptions } from '@actions/exec/lib/interfaces';

const DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${platform()}-amd64`;
const EXECUTABLE = './cc-reporter';
export const CODECLIMATE_GPG_PUBLIC_KEY_ID =
  '9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85' as const;
const CODECLIMATE_GPG_PUBLIC_KEY_URL =
  `https://keys.openpgp.org/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}` as const;
const DEFAULT_COVERAGE_COMMAND = '';
const DEFAULT_WORKING_DIRECTORY = '';
const DEFAULT_CODECLIMATE_DEBUG = 'false';
const DEFAULT_COVERAGE_LOCATIONS = '';
const DEFAULT_VERIFY_DOWNLOAD = 'true';

const SUPPORTED_GITHUB_EVENTS = [
  // Regular PRs.
  'pull_request',
  // PRs that were triggered on remote forks.
  'pull_request_target',
];

const fileArtifacts = new Set<string>();

async function downloadAndRecord(
  url: string,
  file: string,
  mode?: number
): Promise<void> {
  await downloadToFile(url, file, mode);
  fileArtifacts.add(file);
}

function prepareEnv() {
  const env = process.env as { [key: string]: string };

  if (process.env.GITHUB_SHA !== undefined)
    env.GIT_COMMIT_SHA = process.env.GITHUB_SHA;
  if (process.env.GITHUB_REF !== undefined)
    env.GIT_BRANCH = process.env.GITHUB_REF;

  if (env.GIT_BRANCH)
    env.GIT_BRANCH = env.GIT_BRANCH.replace(/^refs\/heads\//, ''); // Remove 'refs/heads/' prefix (See https://github.com/paambaati/codeclimate-action/issues/42)

  if (
    process.env.GITHUB_EVENT_NAME &&
    SUPPORTED_GITHUB_EVENTS.includes(process.env.GITHUB_EVENT_NAME)
  ) {
    env.GIT_BRANCH = process.env.GITHUB_HEAD_REF || env.GIT_BRANCH; // Report correct branch for PRs (See https://github.com/paambaati/codeclimate-action/issues/86)
    env.GIT_COMMIT_SHA = context.payload.pull_request?.['head']?.['sha']; // Report correct SHA for the head branch (See https://github.com/paambaati/codeclimate-action/issues/140)
  }

  return env;
}

async function getLocationLines(
  coverageLocationPatternsParam: string
): Promise<Array<string>> {
  const coverageLocationPatternsLines = coverageLocationPatternsParam
    .split(/\r?\n/)
    .filter((pat) => pat)
    .map((pat) => pat.trim());

  const patternsAndFormats = coverageLocationPatternsLines.map((line) => {
    const lineParts = line.split(':');
    const format = lineParts.slice(-1)[0];
    const pattern = lineParts.slice(0, -1)[0];
    return { format, pattern };
  });

  const pathsWithFormat = await Promise.all(
    patternsAndFormats.map(async ({ format, pattern }) => {
      const globber = await glob.create(pattern);
      const paths = await globber.glob();
      const pathsWithFormat = paths.map(
        (singlePath) => `${singlePath}:${format}`
      );
      return pathsWithFormat;
    })
  );

  const coverageLocationLines = ([] as Array<string>).concat(
    ...pathsWithFormat
  );

  return coverageLocationLines;
}

export function run(
  downloadUrl: string = DOWNLOAD_URL,
  executable: string = EXECUTABLE,
  coverageCommand: string = DEFAULT_COVERAGE_COMMAND,
  workingDirectory: string = DEFAULT_WORKING_DIRECTORY,
  codeClimateDebug: string = DEFAULT_CODECLIMATE_DEBUG,
  coverageLocationsParam: string = DEFAULT_COVERAGE_LOCATIONS,
  coveragePrefix?: string,
  verifyDownload: string = DEFAULT_VERIFY_DOWNLOAD
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (platform() === 'win32') {
      const err = new Error('CC Reporter is not supported on Windows!');
      error(err.message);
      setFailed('🚨 CodeClimate Reporter will not run on Windows!');
      return reject(err);
    }

    let lastExitCode = 1;
    if (workingDirectory) {
      debug(`Changing working directory to ${workingDirectory}`);
      try {
        chdir(workingDirectory);
        lastExitCode = 0;
        debug('✅ Changing working directory completed...');
      } catch (err) {
        error((err as Error).message);
        setFailed('🚨 Changing working directory failed!');
        return reject(err);
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
        `Please check if your platform is supported — see https://docs.codeclimate.com/docs/configuring-test-coverage#section-locations-of-pre-built-binaries`
      );
      return reject(err);
    }

    if (verifyDownload === 'true') {
      const checksumUrl = `${downloadUrl}.sha256`;
      const checksumFilePath = `${executable}.sha256`;
      const signatureUrl = `${downloadUrl}.sha256.sig`;
      const signatureFilePath = `${executable}.sha256.sig`;
      const ccPublicKeyFilePath = 'public-key.asc';

      try {
        debug(`ℹ️ Verifying CC Reporter checksum...`);
        await downloadAndRecord(checksumUrl, checksumFilePath);
        const checksumVerified = await verifyChecksum(
          executable,
          checksumFilePath,
          'sha256'
        );
        if (!checksumVerified)
          throw new Error('CC Reporter checksum does not match!');
        debug('✅ CC Reported checksum verification completed...');
      } catch (err) {
        error((err as Error).message);
        setFailed('🚨 CC Reporter checksum verfication failed!');
        return reject(err);
      }

      try {
        debug(`ℹ️ Verifying CC Reporter GPG signature...`);
        await downloadAndRecord(signatureUrl, signatureFilePath);
        await downloadAndRecord(
          CODECLIMATE_GPG_PUBLIC_KEY_URL,
          ccPublicKeyFilePath
        );
        const signatureVerified = await verifySignature(
          checksumFilePath,
          signatureFilePath,
          ccPublicKeyFilePath
        );
        if (!signatureVerified)
          throw new Error('CC Reporter GPG signature is invalid!');
        debug('✅ CC Reported GPG signature verification completed...');
      } catch (err) {
        error((err as Error).message);
        setFailed('🚨 CC Reporter GPG signature verfication failed!');
        return reject(err);
      }
    }

    const execOpts: ExecOptions = {
      env: prepareEnv(),
    };
    try {
      lastExitCode = await exec(executable, ['before-build'], execOpts);
      if (lastExitCode !== 0) {
        throw new Error(
          `Coverage after-build exited with code ${lastExitCode}`
        );
      }
      debug('✅ CC Reporter before-build checkin completed...');
    } catch (err) {
      error((err as Error).message);
      setFailed('🚨 CC Reporter before-build checkin failed!');
      return reject(err);
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
        return reject(err);
      }
    } else {
      info(
        `ℹ️ 'coverageCommand' not set, so skipping building coverage report!`
      );
    }

    const coverageLocations = await getLocationLines(coverageLocationsParam);
    if (coverageLocations.length > 0) {
      debug(
        `Parsing ${
          coverageLocations.length
        } coverage location(s) — ${coverageLocations} (${typeof coverageLocations})`
      );
      // Run format-coverage on each location.
      const parts: Array<string> = [];
      for (const i in coverageLocations) {
        const [location, type] = coverageLocations[i].split(':');
        if (!type) {
          const err = new Error(`Invalid formatter type ${type}`);
          debug(
            `⚠️ Could not find coverage formatter type! Found ${
              coverageLocations[i]
            } (${typeof coverageLocations[i]})`
          );
          error(err.message);
          setFailed(
            '🚨 Coverage formatter type not set! Each coverage location should be of the format <file_path>:<coverage_format>'
          );
          return reject(err);
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
              `Coverage formatter exited with code ${lastExitCode}`
            );
          }
        } catch (err) {
          error((err as Error).message);
          setFailed('🚨 CC Reporter coverage formatting failed!');
          return reject(err);
        }
      }

      // Run sum coverage.
      const sumCommands = [
        'sum-coverage',
        ...parts,
        '-p',
        `${coverageLocations.length}`,
        '-o',
        `coverage.total.json`,
      ];
      if (codeClimateDebug === 'true') sumCommands.push('--debug');

      try {
        lastExitCode = await exec(executable, sumCommands, execOpts);
        if (lastExitCode !== 0) {
          throw new Error(
            `Coverage sum process exited with code ${lastExitCode}`
          );
        }
      } catch (err) {
        error((err as Error).message);
        setFailed('🚨 CC Reporter coverage sum failed!');
        return reject(err);
      }

      // Upload to Code Climate.
      const uploadCommands = ['upload-coverage', '-i', `coverage.total.json`];
      if (codeClimateDebug === 'true') uploadCommands.push('--debug');
      try {
        lastExitCode = await exec(executable, uploadCommands, execOpts);
        if (lastExitCode !== 0) {
          throw new Error(`Coverage upload exited with code ${lastExitCode}`);
        }
        debug('✅ CC Reporter upload coverage completed!');
        return resolve();
      } catch (err) {
        error((err as Error).message);
        setFailed('🚨 CC Reporter coverage upload failed!');
        return reject(err);
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
        throw new Error(
          `Coverage after-build exited with code ${lastExitCode}`
        );
      }
      debug('✅ CC Reporter after-build checkin completed!');
      return resolve();
    } catch (err) {
      error((err as Error).message);
      setFailed('🚨 CC Reporter after-build checkin failed!');
      return reject(err);
    }
  });
}

/* istanbul ignore next */
if (require.main === module) {
  const coverageCommand = getOptionalString(
    'coverageCommand',
    DEFAULT_COVERAGE_COMMAND
  );
  const workingDirectory = getOptionalString(
    'workingDirectory',
    DEFAULT_WORKING_DIRECTORY
  );
  const codeClimateDebug = getOptionalString(
    'debug',
    DEFAULT_CODECLIMATE_DEBUG
  );
  const coverageLocations = getOptionalString(
    'coverageLocations',
    DEFAULT_COVERAGE_LOCATIONS
  );
  const coveragePrefix = getOptionalString('prefix');
  const verifyDownload = getOptionalString(
    'verifyDownload',
    DEFAULT_VERIFY_DOWNLOAD
  );
  try {
    run(
      DOWNLOAD_URL,
      EXECUTABLE,
      coverageCommand,
      workingDirectory,
      codeClimateDebug,
      coverageLocations,
      coveragePrefix,
      verifyDownload
    );
  } catch (err) {
    throw err;
  } finally {
    // Finally clean up all artifacts that we downloaded.
    for (const artifact of fileArtifacts) {
      try {
        unlinkSync(artifact);
      } catch {}
    }
  }
}
