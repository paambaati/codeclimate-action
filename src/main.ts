import { platform } from 'os';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { debug, error, setFailed, getInput, warning } from '@actions/core';
import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';

const DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${platform()}-amd64`;
const EXECUTABLE = './cc-reporter';
const DEFAULT_COVERAGE_COMMAND = 'yarn coverage';
const DEFAULT_CODECLIMATE_DEBUG = 'false';
const DEFAULT_COVERAGE_LOCATIONS = [];

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
  }

  return env;
}

export function run(
  downloadUrl: string = DOWNLOAD_URL,
  executable: string = EXECUTABLE,
  coverageCommand: string = DEFAULT_COVERAGE_COMMAND,
  codeClimateDebug: string = DEFAULT_CODECLIMATE_DEBUG,
  coverageLocations: Array<String> = DEFAULT_COVERAGE_LOCATIONS,
  coveragePrefix: string | undefined = undefined
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let lastExitCode = 1;
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
      env: prepareEnv()
    };
    try {
      lastExitCode = await exec(executable, ['before-build'], execOpts);
      debug('✅ CC Reporter before-build checkin completed...');
    } catch (err) {
      error(err);
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
      error(err);
      setFailed('🚨 Coverage run failed!');
      return reject(err);
    }

    if (coverageLocations.length > 0) {
      // Run format-coverage on each location.
      const parts: Array<string> = [];
      for (const i in coverageLocations) {
        const [location, type] = coverageLocations[i].split(':');
        const commands = [
          'format-coverage',
          location,
          '-t',
          type,
          '-o',
          `codeclimate.${i}.json`
        ];
        if (codeClimateDebug === 'true') commands.push('--debug');

        parts.push(`codeclimate.${i}.json`);

        try {
          lastExitCode = await exec(executable, commands, execOpts);
        } catch (err) {
          error(err);
          setFailed('🚨 CC Reporter after-build checkin failed!');
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
        `coverage.total.json`
      ];
      if (codeClimateDebug === 'true') sumCommands.push('--debug');

      try {
        lastExitCode = await exec(executable, sumCommands, execOpts);
      } catch (err) {
        error(err);
        setFailed('🚨 CC Reporter after-build checkin failed!');
        return reject(err);
      }

      // Upload to Code Climate.
      const uploadCommands = ['upload-coverage', '-i', `coverage.total.json`];
      if (codeClimateDebug === 'true') uploadCommands.push('--debug');
      try {
        lastExitCode = await exec(executable, uploadCommands, execOpts);
        debug('✅ CC Reporter after-build checkin completed!');
        return resolve();
      } catch (err) {
        error(err);
        setFailed('🚨 CC Reporter after-build checkin failed!');
        return reject(err);
      }
    }

    try {
      const commands = ['after-build', '--exit-code', lastExitCode.toString()];
      if (codeClimateDebug === 'true') commands.push('--debug');
      if (typeof coveragePrefix === 'string')
        commands.push('--prefix', coveragePrefix);
      await exec(executable, commands, execOpts);
      debug('✅ CC Reporter after-build checkin completed!');
      return resolve();
    } catch (err) {
      error(err);
      setFailed('🚨 CC Reporter after-build checkin failed!');
      return reject(err);
    }
  });
}

if (!module.parent) {
  let coverageCommand = getInput('coverageCommand', { required: false });
  if (!coverageCommand.length) coverageCommand = DEFAULT_COVERAGE_COMMAND;
  let codeClimateDebug = getInput('debug', { required: false });
  if (!coverageCommand.length) codeClimateDebug = DEFAULT_CODECLIMATE_DEBUG;
  const coverageLocationsText = getInput('coverageLocations', {
    required: false
  });
  const coverageLocations = coverageLocationsText.length
    ? coverageLocationsText.split(' ')
    : DEFAULT_COVERAGE_LOCATIONS;
  const coveragePrefix = getInput('prefix', { required: false });
  run(
    DOWNLOAD_URL,
    EXECUTABLE,
    coverageCommand,
    codeClimateDebug,
    coverageLocations,
    coveragePrefix
  );
}
