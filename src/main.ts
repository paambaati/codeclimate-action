import { platform } from 'os';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { debug, error, setFailed, getInput } from '@actions/core';
import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';

const DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${platform()}-amd64`;
const EXECUTABLE = './cc-reporter';
const DEFAULT_COVERAGE_COMMAND = 'yarn coverage';

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
    env.GIT_BRANCH = process.env.GITHUB_REF.replace(/^refs\/head\//, ''); // Remove 'refs/head/' prefix (See https://github.com/paambaati/codeclimate-action/issues/42)

  return env;
}

export function run(
  downloadUrl: string = DOWNLOAD_URL,
  executable: string = EXECUTABLE,
  coverageCommand: string = DEFAULT_COVERAGE_COMMAND
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
    try {
      await exec(
        executable,
        ['after-build', '--exit-code', lastExitCode.toString()],
        execOpts
      );
      debug('✅ CC Reporter after-build checkin completed!');
      return resolve();
    } catch (err) {
      error(err);
      setFailed('🚨 CC Reporter before-build checkin failed!');
      return reject(err);
    }
  });
}

if (!module.parent) {
  let coverageCommand = getInput('coverageCommand', { required: false });
  if (!coverageCommand.length) coverageCommand = DEFAULT_COVERAGE_COMMAND;
  run(DOWNLOAD_URL, EXECUTABLE, coverageCommand);
}
