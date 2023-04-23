"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.verifyChecksumAndSignature = exports.downloadAndRecord = exports.FILE_ARTIFACTS = exports.CODECLIMATE_GPG_PUBLIC_KEY_ID = exports.EXECUTABLE = exports.DOWNLOAD_URL = void 0;
const os_1 = require("os");
const process_1 = require("process");
const fs_1 = require("fs");
const core_1 = require("@actions/core");
const exec_1 = require("@actions/exec");
const github_1 = require("@actions/github");
const glob = __importStar(require("@actions/glob"));
const utils_1 = require("./utils");
// REFER: https://docs.codeclimate.com/docs/configuring-test-coverage#locations-of-pre-built-binaries
/** Canonical download URL for the official CodeClimate reporter. */
exports.DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${(0, os_1.platform)()}-${(0, os_1.arch)() === 'arm64' ? 'arm64' : 'amd64'}`;
/** Local file name of the CodeClimate reporter. */
exports.EXECUTABLE = './cc-reporter';
exports.CODECLIMATE_GPG_PUBLIC_KEY_ID = '9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85';
const CODECLIMATE_GPG_PUBLIC_KEY_URL = `https://keys.openpgp.org/vks/v1/by-fingerprint/${exports.CODECLIMATE_GPG_PUBLIC_KEY_ID}`;
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
/** Central data structure that holds a list of all downloaded file artifacts. */
exports.FILE_ARTIFACTS = new Set();
/**
 * Downloads a given URL to a given filename and then records it in the global artifacts data structure.
 *
 * @param url Fully qualified URL to download.
 * @param file Local file path to save the downloaded content.
 * @param mode (Optional) File mode.
 */
function downloadAndRecord(url, file, mode) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, utils_1.downloadToFile)(url, file, mode);
        exports.FILE_ARTIFACTS.add(file);
    });
}
exports.downloadAndRecord = downloadAndRecord;
function prepareEnv() {
    var _a, _b;
    const env = process.env;
    if (process.env.GITHUB_SHA !== undefined)
        env.GIT_COMMIT_SHA = process.env.GITHUB_SHA;
    if (process.env.GITHUB_REF !== undefined)
        env.GIT_BRANCH = process.env.GITHUB_REF;
    if (env.GIT_BRANCH)
        env.GIT_BRANCH = env.GIT_BRANCH.replace(/^refs\/heads\//, ''); // Remove 'refs/heads/' prefix (See https://github.com/paambaati/codeclimate-action/issues/42)
    if (process.env.GITHUB_EVENT_NAME &&
        SUPPORTED_GITHUB_EVENTS.includes(process.env.GITHUB_EVENT_NAME)) {
        env.GIT_BRANCH = process.env.GITHUB_HEAD_REF || env.GIT_BRANCH; // Report correct branch for PRs (See https://github.com/paambaati/codeclimate-action/issues/86)
        env.GIT_COMMIT_SHA = (_b = (_a = github_1.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a['head']) === null || _b === void 0 ? void 0 : _b['sha']; // Report correct SHA for the head branch (See https://github.com/paambaati/codeclimate-action/issues/140)
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
function verifyChecksumAndSignature(downloadUrl = exports.DOWNLOAD_URL, executablePath = exports.EXECUTABLE, algorithm = 'sha256') {
    return __awaiter(this, void 0, void 0, function* () {
        const checksumUrl = `${downloadUrl}.${algorithm}`;
        const checksumFilePath = `${executablePath}.${algorithm}`;
        const signatureUrl = `${downloadUrl}.${algorithm}.sig`;
        const signatureFilePath = `${executablePath}.${algorithm}.sig`;
        const ccPublicKeyFilePath = 'public-key.asc';
        try {
            (0, core_1.debug)(`ℹ️ Verifying CC Reporter checksum...`);
            yield downloadAndRecord(checksumUrl, checksumFilePath);
            const checksumVerified = yield (0, utils_1.verifyChecksum)(executablePath, checksumFilePath, algorithm);
            if (!checksumVerified)
                throw new Error('CC Reporter checksum does not match!');
            (0, core_1.debug)('✅ CC Reported checksum verification completed...');
        }
        catch (err) {
            (0, core_1.error)(err.message);
            (0, core_1.setFailed)('🚨 CC Reporter checksum verfication failed!');
            throw err;
        }
        try {
            (0, core_1.debug)(`ℹ️ Verifying CC Reporter GPG signature...`);
            yield downloadAndRecord(signatureUrl, signatureFilePath);
            yield downloadAndRecord(CODECLIMATE_GPG_PUBLIC_KEY_URL, ccPublicKeyFilePath);
            const signatureVerified = yield (0, utils_1.verifySignature)(checksumFilePath, signatureFilePath, ccPublicKeyFilePath);
            if (!signatureVerified)
                throw new Error('CC Reporter GPG signature is invalid!');
            (0, core_1.debug)('✅ CC Reported GPG signature verification completed...');
        }
        catch (err) {
            (0, core_1.error)(err.message);
            (0, core_1.setFailed)('🚨 CC Reporter GPG signature verfication failed!');
            throw err;
        }
    });
}
exports.verifyChecksumAndSignature = verifyChecksumAndSignature;
function getLocationLines(coverageLocationPatternsParam) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const pathsWithFormat = yield Promise.all(patternsAndFormats.map(({ format, pattern }) => __awaiter(this, void 0, void 0, function* () {
            const globber = yield glob.create(pattern);
            const paths = yield globber.glob();
            const pathsWithFormat = paths.map((singlePath) => `${singlePath}:${format}`);
            return pathsWithFormat;
        })));
        const coverageLocationLines = [].concat(...pathsWithFormat);
        return coverageLocationLines;
    });
}
function run(downloadUrl = exports.DOWNLOAD_URL, executable = exports.EXECUTABLE, coverageCommand = DEFAULT_COVERAGE_COMMAND, workingDirectory = DEFAULT_WORKING_DIRECTORY, codeClimateDebug = DEFAULT_CODECLIMATE_DEBUG, coverageLocationsParam = DEFAULT_COVERAGE_LOCATIONS, coveragePrefix, verifyDownload = DEFAULT_VERIFY_DOWNLOAD) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        if ((0, os_1.platform)() === 'win32') {
            const err = new Error('CC Reporter is not supported on Windows!');
            (0, core_1.error)(err.message);
            (0, core_1.setFailed)('🚨 CodeClimate Reporter will not run on Windows!');
            return reject(err);
        }
        let lastExitCode = 1;
        if (workingDirectory) {
            (0, core_1.debug)(`Changing working directory to ${workingDirectory}`);
            try {
                (0, process_1.chdir)(workingDirectory);
                lastExitCode = 0;
                (0, core_1.debug)('✅ Changing working directory completed...');
            }
            catch (err) {
                (0, core_1.error)(err.message);
                (0, core_1.setFailed)('🚨 Changing working directory failed!');
                return reject(err);
            }
        }
        try {
            (0, core_1.debug)(`ℹ️ Downloading CC Reporter from ${downloadUrl} ...`);
            yield downloadAndRecord(downloadUrl, executable);
            (0, core_1.debug)('✅ CC Reporter downloaded...');
        }
        catch (err) {
            (0, core_1.error)(err.message);
            (0, core_1.setFailed)('🚨 CC Reporter download failed!');
            (0, core_1.warning)(`Could not download ${downloadUrl}`);
            (0, core_1.warning)(`Please check if your platform is supported — see https://docs.codeclimate.com/docs/configuring-test-coverage#section-locations-of-pre-built-binaries`);
            return reject(err);
        }
        if (verifyDownload === 'true') {
            try {
                yield verifyChecksumAndSignature(downloadUrl, executable);
            }
            catch (err) {
                return reject(err);
            }
        }
        const execOpts = {
            env: prepareEnv(),
        };
        try {
            lastExitCode = yield (0, exec_1.exec)(executable, ['before-build'], execOpts);
            if (lastExitCode !== 0) {
                throw new Error(`Coverage after-build exited with code ${lastExitCode}`);
            }
            (0, core_1.debug)('✅ CC Reporter before-build checkin completed...');
        }
        catch (err) {
            (0, core_1.error)(err.message);
            (0, core_1.setFailed)('🚨 CC Reporter before-build checkin failed!');
            return reject(err);
        }
        if (coverageCommand) {
            try {
                lastExitCode = yield (0, exec_1.exec)(coverageCommand, undefined, execOpts);
                if (lastExitCode !== 0) {
                    throw new Error(`Coverage run exited with code ${lastExitCode}`);
                }
                (0, core_1.debug)('✅ Coverage run completed...');
            }
            catch (err) {
                (0, core_1.error)(err.message);
                (0, core_1.setFailed)('🚨 Coverage run failed!');
                return reject(err);
            }
        }
        else {
            (0, core_1.info)(`ℹ️ 'coverageCommand' not set, so skipping building coverage report!`);
        }
        const coverageLocations = yield getLocationLines(coverageLocationsParam);
        if (coverageLocations.length > 0) {
            (0, core_1.debug)(`Parsing ${coverageLocations.length} coverage location(s) — ${coverageLocations} (${typeof coverageLocations})`);
            // Run format-coverage on each location.
            const parts = [];
            for (const i in coverageLocations) {
                const [location, type] = coverageLocations[i].split(':');
                if (!type) {
                    const err = new Error(`Invalid formatter type ${type}`);
                    (0, core_1.debug)(`⚠️ Could not find coverage formatter type! Found ${coverageLocations[i]} (${typeof coverageLocations[i]})`);
                    (0, core_1.error)(err.message);
                    (0, core_1.setFailed)('🚨 Coverage formatter type not set! Each coverage location should be of the format <file_path>:<coverage_format>');
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
                    lastExitCode = yield (0, exec_1.exec)(executable, commands, execOpts);
                    if (lastExitCode !== 0) {
                        throw new Error(`Coverage formatter exited with code ${lastExitCode}`);
                    }
                }
                catch (err) {
                    (0, core_1.error)(err.message);
                    (0, core_1.setFailed)('🚨 CC Reporter coverage formatting failed!');
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
                lastExitCode = yield (0, exec_1.exec)(executable, sumCommands, execOpts);
                if (lastExitCode !== 0) {
                    throw new Error(`Coverage sum process exited with code ${lastExitCode}`);
                }
            }
            catch (err) {
                (0, core_1.error)(err.message);
                (0, core_1.setFailed)('🚨 CC Reporter coverage sum failed!');
                return reject(err);
            }
            // Upload to Code Climate.
            const uploadCommands = ['upload-coverage', '-i', `coverage.total.json`];
            if (codeClimateDebug === 'true')
                uploadCommands.push('--debug');
            try {
                lastExitCode = yield (0, exec_1.exec)(executable, uploadCommands, execOpts);
                if (lastExitCode !== 0) {
                    throw new Error(`Coverage upload exited with code ${lastExitCode}`);
                }
                (0, core_1.debug)('✅ CC Reporter upload coverage completed!');
                return resolve();
            }
            catch (err) {
                (0, core_1.error)(err.message);
                (0, core_1.setFailed)('🚨 CC Reporter coverage upload failed!');
                return reject(err);
            }
        }
        try {
            const commands = ['after-build', '--exit-code', lastExitCode.toString()];
            if (codeClimateDebug === 'true')
                commands.push('--debug');
            if (coveragePrefix) {
                commands.push('--prefix', coveragePrefix);
            }
            lastExitCode = yield (0, exec_1.exec)(executable, commands, execOpts);
            if (lastExitCode !== 0) {
                throw new Error(`Coverage after-build exited with code ${lastExitCode}`);
            }
            (0, core_1.debug)('✅ CC Reporter after-build checkin completed!');
            return resolve();
        }
        catch (err) {
            (0, core_1.error)(err.message);
            (0, core_1.setFailed)('🚨 CC Reporter after-build checkin failed!');
            return reject(err);
        }
    }));
}
exports.run = run;
/* istanbul ignore next */
if (require.main === module) {
    const coverageCommand = (0, utils_1.getOptionalString)('coverageCommand', DEFAULT_COVERAGE_COMMAND);
    const workingDirectory = (0, utils_1.getOptionalString)('workingDirectory', DEFAULT_WORKING_DIRECTORY);
    const codeClimateDebug = (0, utils_1.getOptionalString)('debug', DEFAULT_CODECLIMATE_DEBUG);
    const coverageLocations = (0, utils_1.getOptionalString)('coverageLocations', DEFAULT_COVERAGE_LOCATIONS);
    const coveragePrefix = (0, utils_1.getOptionalString)('prefix');
    const verifyDownload = (0, utils_1.getOptionalString)('verifyDownload', DEFAULT_VERIFY_DOWNLOAD);
    try {
        run(exports.DOWNLOAD_URL, exports.EXECUTABLE, coverageCommand, workingDirectory, codeClimateDebug, coverageLocations, coveragePrefix, verifyDownload);
    }
    catch (err) {
        throw err;
    }
    finally {
        // Finally clean up all artifacts that we downloaded.
        for (const artifact of exports.FILE_ARTIFACTS) {
            try {
                (0, fs_1.unlinkSync)(artifact);
            }
            catch (_a) { }
        }
    }
}
