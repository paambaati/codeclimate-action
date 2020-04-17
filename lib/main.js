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
const github_1 = require("@actions/github");
const DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${os_1.platform()}-amd64`;
const EXECUTABLE = './cc-reporter';
const DEFAULT_COVERAGE_COMMAND = 'yarn coverage';
const DEFAULT_CODECLIMATE_DEBUG = 'false';
const DEFAULT_COVERAGE_LOCATIONS = [];
const getOptionalString = (name, def = '') => core_1.getInput(name, { required: false }) || def;
const getOptionalArray = (name, def = []) => {
    const input = core_1.getInput(name, { required: false });
    return !input.length ? def : input.split(' ');
};
const flattenArray = (arr) => [].concat(...arr);
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
    var _a, _b;
    const env = process.env;
    if (process.env.GITHUB_SHA !== undefined)
        env.GIT_COMMIT_SHA = process.env.GITHUB_SHA;
    if (process.env.GITHUB_REF !== undefined)
        env.GIT_BRANCH = process.env.GITHUB_REF;
    if (env.GIT_BRANCH)
        env.GIT_BRANCH = env.GIT_BRANCH.replace(/^refs\/heads\//, ''); // Remove 'refs/heads/' prefix (See https://github.com/paambaati/codeclimate-action/issues/42)
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
        env.GIT_BRANCH = process.env.GITHUB_HEAD_REF || env.GIT_BRANCH; // Report correct branch for PRs (See https://github.com/paambaati/codeclimate-action/issues/86)
        env.GIT_COMMIT_SHA = (_b = (_a = github_1.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a['head']) === null || _b === void 0 ? void 0 : _b['sha']; // Report correct SHA for the head branch (See https://github.com/paambaati/codeclimate-action/issues/140)
    }
    return env;
}
function run(downloadUrl = DOWNLOAD_URL, executable = EXECUTABLE, coverageCommand = DEFAULT_COVERAGE_COMMAND, codeClimateDebug = DEFAULT_CODECLIMATE_DEBUG, coverageLocations = DEFAULT_COVERAGE_LOCATIONS, coveragePrefix) {
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
            core_1.warning(`Could not download ${downloadUrl}`);
            core_1.warning(`Please check if your platform is supported — see https://docs.codeclimate.com/docs/configuring-test-coverage#section-locations-of-pre-built-binaries`);
            return reject(err);
        }
        const execOpts = {
            env: prepareEnv(),
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
            core_1.error(err.message);
            core_1.setFailed('🚨 Coverage run failed!');
            return reject(err);
        }
        if (Array.isArray(coverageLocations) &&
            flattenArray(coverageLocations).length > 0) {
            core_1.debug(`Parsing ${coverageLocations.length} coverage location(s) — ${coverageLocations} (${typeof coverageLocations})`);
            // Run format-coverage on each location.
            const parts = [];
            for (const i in coverageLocations) {
                const [location, type] = coverageLocations[i].split(':');
                if (!type) {
                    const err = new Error(`Invalid formatter type ${type}`);
                    core_1.debug(`⚠️ Could not find coverage formatter type! Found ${coverageLocations[i]} (${typeof coverageLocations[i]})`);
                    core_1.error(err.message);
                    core_1.setFailed('🚨 Coverage formatter type not set! Each coverage location should be of the format <file_path>:<coverage_format>');
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
                if (codeClimateDebug === 'true')
                    commands.push('--debug');
                if (coveragePrefix) {
                    commands.push('--prefix', coveragePrefix);
                }
                parts.push(`codeclimate.${i}.json`);
                try {
                    lastExitCode = yield exec_1.exec(executable, commands, execOpts);
                    if (lastExitCode !== 0) {
                        throw new Error(`Coverage formatter exited with code ${lastExitCode}`);
                    }
                }
                catch (err) {
                    core_1.error(err);
                    core_1.setFailed('🚨 CC Reporter coverage formatting failed!');
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
            if (codeClimateDebug === 'true')
                sumCommands.push('--debug');
            try {
                lastExitCode = yield exec_1.exec(executable, sumCommands, execOpts);
                if (lastExitCode !== 0) {
                    throw new Error(`Coverage sum process exited with code ${lastExitCode}`);
                }
            }
            catch (err) {
                core_1.error(err);
                core_1.setFailed('🚨 CC Reporter coverage sum failed!');
                return reject(err);
            }
            // Upload to Code Climate.
            const uploadCommands = ['upload-coverage', '-i', `coverage.total.json`];
            if (codeClimateDebug === 'true')
                uploadCommands.push('--debug');
            try {
                lastExitCode = yield exec_1.exec(executable, uploadCommands, execOpts);
                if (lastExitCode !== 0) {
                    throw new Error(`Coverage upload exited with code ${lastExitCode}`);
                }
                core_1.debug('✅ CC Reporter upload coverage completed!');
                return resolve();
            }
            catch (err) {
                core_1.error(err);
                core_1.setFailed('🚨 CC Reporter coverage upload failed!');
                return reject(err);
            }
        }
        try {
            const commands = ['after-build', '--exit-code', lastExitCode.toString()];
            if (codeClimateDebug === 'true')
                commands.push('--debug');
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
    const coverageCommand = getOptionalString('coverageCommand', DEFAULT_COVERAGE_COMMAND);
    const codeClimateDebug = getOptionalString('debug', DEFAULT_CODECLIMATE_DEBUG);
    const coverageLocations = getOptionalArray('coverageLocations', DEFAULT_COVERAGE_LOCATIONS);
    const coveragePrefix = getOptionalString('prefix');
    run(DOWNLOAD_URL, EXECUTABLE, coverageCommand, codeClimateDebug, coverageLocations, coveragePrefix);
}
