"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const fs_1 = require("fs");
const node_fetch_1 = __importDefault(require("node-fetch"));
const core_1 = require("@actions/core");
const exec_1 = require("@actions/exec");
const DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${os_1.platform()}-amd64`;
const EXECUTABLE = './cc-reporter';
const DEFAULT_COVERAGE_COMMAND = 'yarn coverage';
const DEFAULT_CODECLIMATE_DEBUG = 'false';
const DEFAULT_COVERAGE_LOCATIONS = [];
function downloadToFile(url, file, mode = 0o755) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield node_fetch_1.default(url, { timeout: 2 * 60 * 1000 }); // Timeout in 2 minutes.
            const writer = fs_1.createWriteStream(file, { mode });
            response.body.pipe(writer);
            writer.on('close', () => {
                return resolve();
            });
        }
        catch (err) {
            return reject(err);
        }
    }));
}
exports.downloadToFile = downloadToFile;
function prepareEnv() {
    const env = process.env;
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
function run(downloadUrl = DOWNLOAD_URL, executable = EXECUTABLE, coverageCommand = DEFAULT_COVERAGE_COMMAND, codeClimateDebug = DEFAULT_CODECLIMATE_DEBUG, coverageLocations = DEFAULT_COVERAGE_LOCATIONS, coveragePrefix = undefined) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let lastExitCode = 1;
        try {
            core_1.debug(`ℹ️ Downloading CC Reporter from ${downloadUrl} ...`);
            yield downloadToFile(downloadUrl, executable);
            core_1.debug('✅ CC Reporter downloaded...');
        }
        catch (err) {
            core_1.error(err.message);
            core_1.setFailed('🚨 CC Reporter download failed!');
            return reject(err);
        }
        const execOpts = {
            env: prepareEnv()
        };
        try {
            lastExitCode = yield exec_1.exec(executable, ['before-build'], execOpts);
            core_1.debug('✅ CC Reporter before-build checkin completed...');
        }
        catch (err) {
            core_1.error(err);
            core_1.setFailed('🚨 CC Reporter before-build checkin failed!');
            return reject(err);
        }
        try {
            lastExitCode = yield exec_1.exec(coverageCommand, undefined, execOpts);
            if (lastExitCode !== 0) {
                throw new Error(`Coverage run exited with code ${lastExitCode}`);
            }
            core_1.debug('✅ Coverage run completed...');
        }
        catch (err) {
            core_1.error(err);
            core_1.setFailed('🚨 Coverage run failed!');
            return reject(err);
        }
        if (coverageLocations.length > 0) {
            // Run format-coverage on each location.
            const parts = [];
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
                if (codeClimateDebug === 'true')
                    commands.push('--debug');
                parts.push(`codeclimate.${i}.json`);
                try {
                    lastExitCode = yield exec_1.exec(executable, commands, execOpts);
                }
                catch (err) {
                    core_1.error(err);
                    core_1.setFailed('🚨 CC Reporter after-build checkin failed!');
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
            if (codeClimateDebug === 'true')
                sumCommands.push('--debug');
            try {
                lastExitCode = yield exec_1.exec(executable, sumCommands, execOpts);
            }
            catch (err) {
                core_1.error(err);
                core_1.setFailed('🚨 CC Reporter after-build checkin failed!');
                return reject(err);
            }
            // Upload to Code Climate.
            const uploadCommands = ['upload-coverage', '-i', `coverage.total.json`];
            if (codeClimateDebug === 'true')
                uploadCommands.push('--debug');
            try {
                lastExitCode = yield exec_1.exec(executable, uploadCommands, execOpts);
                core_1.debug('✅ CC Reporter after-build checkin completed!');
                return resolve();
            }
            catch (err) {
                core_1.error(err);
                core_1.setFailed('🚨 CC Reporter after-build checkin failed!');
                return reject(err);
            }
        }
        try {
            const commands = ['after-build', '--exit-code', lastExitCode.toString()];
            if (codeClimateDebug === 'true')
                commands.push('--debug');
            if (typeof coveragePrefix === 'string')
                commands.push('--prefix', coveragePrefix);
            yield exec_1.exec(executable, commands, execOpts);
            core_1.debug('✅ CC Reporter after-build checkin completed!');
            return resolve();
        }
        catch (err) {
            core_1.error(err);
            core_1.setFailed('🚨 CC Reporter after-build checkin failed!');
            return reject(err);
        }
    }));
}
exports.run = run;
if (!module.parent) {
    let coverageCommand = core_1.getInput('coverageCommand', { required: false });
    if (!coverageCommand.length)
        coverageCommand = DEFAULT_COVERAGE_COMMAND;
    let codeClimateDebug = core_1.getInput('debug', { required: false });
    if (!coverageCommand.length)
        codeClimateDebug = DEFAULT_CODECLIMATE_DEBUG;
    const coverageLocationsText = core_1.getInput('coverageLocations', {
        required: false
    });
    const coverageLocations = coverageLocationsText.length
        ? coverageLocationsText.split(' ')
        : DEFAULT_COVERAGE_LOCATIONS;
    const coveragePrefix = core_1.getInput('prefix', { required: false });
    run(DOWNLOAD_URL, EXECUTABLE, coverageCommand, codeClimateDebug, coverageLocations, coveragePrefix);
}
