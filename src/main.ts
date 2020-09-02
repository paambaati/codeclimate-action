import { platform } from 'os';
import { createWriteStream } from 'fs';
import { chdir } from 'process';
import fetch from 'node-fetch';
import { debug, error, setFailed, warning, info } from '@actions/core';
import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { context } from '@actions/github';

import { getOptionalString } from './utils';

const DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${platform()}-amd64`;
const EXECUTABLE = './cc-reporter';
const DEFAULT_COVERAGE_COMMAND = 'yarn coverage';
const DEFAULT_WORKING_DIRECTORY = '';
const DEFAULT_CODECLIMATE_DEBUG = 'false';
const DEFAULT_COVERAGE_LOCATIONS = '';

export function downloadToFile(
  url: string,
  file: string,
  mode: number = 0o755
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url, { timeout: 2 * 60 * 1000 }); // Timeout in 2 minutes.
      const writer = createWriteStream(file, { mode });
      response.body.pipe(writer);
      writer.on('close', () => {
        return resolve();
      });
    } catch (err) {
      return reject(err);
    }
  });
}

function prepareEnv() {
  const env = process.env as { [key: string]: string };

  if (process.env.GITHUB_SHA !== undefined)
    env.GIT_COMMIT_SHA = process.env.GITHUB_SHA;
  if (process.env.GITHUB_REF !== undefined)
    env.GIT_BRANCH = process.env.GITHUB_REF;

  if (env.GIT_BRANCH)
    env.GIT_BRANCH = env.GIT_BRANCH.replace(/^refs\/heads\//, ''); // Remove 'refs/heads/' prefix (See https://github.com/paambaati/codeclimate-action/issues/42)

  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    env.GIT_BRANCH = process.env.GITHUB_HEAD_REF || env.GIT_BRANCH; // Report correct branch for PRs (See https://github.com/paambaati/codeclimate-action/issues/86)
    env.GIT_COMMIT_SHA = context.payload.pull_request?.['head']?.['sha']; // Report correct SHA for the head branch (See https://github.com/paambaati/codeclimate-action/issues/140)
  }

  return env;
}

export function run(
  downloadUrl: string = DOWNLOAD_URL,
  executable: string = EXECUTABLE,
  coverageCommand: string = DEFAULT_COVERAGE_COMMAND,
  workingDirectory: string = DEFAULT_WORKING_DIRECTORY,
  codeClimateDebug: string = DEFAULT_CODECLIMATE_DEBUG,
  coverageLocationsParam: string = DEFAULT_COVERAGE_LOCATIONS,
  coveragePrefix?: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let lastExitCode = 1;
    if (workingDirectory) {
      debug(`Changing working directory to: ${workingDirectory}`);
      try {
        await chdir(workingDirectory);
        lastExitCode = 0;
        debug('✅ Changing working directory completed...');
      } catch (err) {
        error(err.message);
        setFailed('🚨 Changing working directory failed!');
        return reject(err);
      }
    }
    try {
      debug(`ℹ️ Downloading CC Reporter from ${downloadUrl} ...`);
      await downloadToFile(downloadUrl, executable);
      debug('✅ CC Reporter downloaded...');
    } catch (err) {
      error(err.message);
      setFailed('🚨 CC Reporter download failed!');
      warning(`Could not download ${downloadUrl}`);
      warning(
        `Please check if your platform is supported — see https://docs.codeclimate.com/docs/configuring-test-coverage#section-locations-of-pre-built-binaries`
      );
      return reject(err);
    }
    const execOpts: ExecOptions = {
      env: prepareEnv(),
    };
    try {
      lastExitCode = await exec(executable, ['before-build'], execOpts);
      debug('✅ CC Reporter before-build checkin completed...');
    } catch (err) {
      error(err.message);
      setFailed('🚨 CC Reporter before-build checkin failed!');
      return reject(err);
    }
    try {
      lastExitCode = await exec(coverageCommand, undefined, execOpts);
      if (lastExitCode !== 0) {
        throw new Error(`Coverage run exited with code ${lastExitCode}`);
      }
      debug('✅ Coverage run completed...');
    } catch (err) {
      error(err.message);
      setFailed('🚨 Coverage run failed!');
      return reject(err);
    }

    const coverageLocations = coverageLocationsParam
      .split(/\r?\n/)
      .filter((pat) => pat)
      .map((pat) => pat.trim());
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
          error(err.message);
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
        error(err.message);
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
        error(err.message);
        setFailed('🚨 CC Reporter coverage upload failed!');
        return reject(err);
      }
    }

    try {
      const commands = ['after-build', '--exit-code', lastExitCode.toString()];
      if (codeClimateDebug === 'true') commands.push('--debug');
      await exec(executable, commands, execOpts);
      debug('✅ CC Reporter after-build checkin completed!');
      return resolve();
    } catch (err) {
      error(err.message);
      setFailed('🚨 CC Reporter after-build checkin failed!');
      return reject(err);
    }
  });
}

if (!module.parent) {
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

  run(
    DOWNLOAD_URL,
    EXECUTABLE,
    coverageCommand,
    workingDirectory,
    codeClimateDebug,
    coverageLocations,
    coveragePrefix
  );
}
