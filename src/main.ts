import { platform } from 'os';
import { createWriteStream } from 'fs';
import { stream } from 'got';
import { debug, error, setFailed, getInput } from '@actions/core';
import { exec } from '@actions/exec';

const DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${platform()}-amd64`;
const EXECUTABLE = './cc-reporter';
const DEFAULT_COVERAGE_COMMAND = 'yarn coverage';

export function downloadToFile(url: string, file: string, mode: number = 0o755): Promise<void> {
    return new Promise((resolve, reject) => {
        const downloader = stream(url, { timeout: 2 * 60 * 1000 }); // Timeout in 2 minutes.
        downloader.on('error', err => {
            downloader.destroy();
            return reject(err);
        });
        const writer = downloader.pipe(createWriteStream(file, { mode }));
        writer.on('close', () => {
            return resolve();
        });
    });
}

export function run(downloadUrl: string = DOWNLOAD_URL, executable: string = EXECUTABLE, coverageCommand: string = DEFAULT_COVERAGE_COMMAND): Promise<void> {
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
        try {
            lastExitCode = await exec(executable, ['before-build']);
            debug('✅ CC Reporter before-build checkin completed...');
        } catch (err) {
            error(err);
            setFailed('🚨 CC Reporter before-build checkin failed!');
            return reject(err);
        }
        try {
            lastExitCode = await exec(coverageCommand);
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
            await exec(executable, ['after-build', '--exit-code', lastExitCode.toString()]);
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
