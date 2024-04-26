"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePathAndFormat = exports.verifySignature = exports.verifyChecksum = exports.getFileChecksum = exports.getFileContentsAsString = exports.getFileContents = exports.downloadToFile = exports.areObjectsEqual = exports.getOptionalString = void 0;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_util_1 = require("node:util");
const core_1 = require("@actions/core");
const node_fetch_1 = __importDefault(require("node-fetch"));
const openpgp_1 = require("openpgp");
const readFileAsync = (0, node_util_1.promisify)(node_fs_1.readFile);
/**
 * Parses GitHub Action input and returns the optional value as a string.
 *
 * @param name Input name (declared in `action.yml`).
 * @param defaultValue Default value as optional fallback.
 * @returns Parsed input value.
 */
const getOptionalString = (name, defaultValue = '') => (0, core_1.getInput)(name, { required: false }) || defaultValue;
exports.getOptionalString = getOptionalString;
/**
 * Naively checks if 2 given JSON objects are identical.
 *
 * @param obj1 First JSON.
 * @param obj2 Second JSON.
 * @returns `true` if same, `false` if not.
 */
const areObjectsEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);
exports.areObjectsEqual = areObjectsEqual;
/**
 * Downloads the given URL as a file to the given file location.
 *
 * @param url URL to download.
 * @param file File path to save the download to.
 * @param mode (Optional) File mode.
 */
function downloadToFile(url, file, mode = 0o755) {
    return new Promise((resolve, reject) => {
        try {
            (0, node_fetch_1.default)(url, {
                redirect: 'follow',
                follow: 5,
                timeout: 2 * 60 * 1000, // Timeout in 2 minutes.
            })
                .then((response) => {
                if (response.status < 200 || response.status > 299) {
                    throw new Error(`Download of '${url}' failed with response status code ${response.status}`);
                }
                const writer = (0, node_fs_1.createWriteStream)(file, { mode });
                response.body.pipe(writer);
                writer.on('close', () => {
                    return resolve();
                });
            })
                .catch((err) => {
                return reject(err);
            });
        }
        catch (err) {
            return reject(err);
        }
    });
}
exports.downloadToFile = downloadToFile;
/**
 * Returns file contents as a `Buffer`.
 *
 * @param filePath File path to read.
 * @param options (Optional) File read options. @see https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#fs_filehandle_readfile_options
 * @returns File contents as `Buffer`.
 */
async function getFileContents(filePath, options) {
    return await readFileAsync(filePath, options);
}
exports.getFileContents = getFileContents;
/**
 * Returns file contents as a string. Useful for reading ASCII-encoded files.
 *
 * @param filePath File path to read.
 * @param options (Optional) File read options. @see https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#fs_filehandle_readfile_options
 * @returns File contents as string.
 */
async function getFileContentsAsString(filePath, options) {
    return (await getFileContents(filePath, options)).toString('utf8');
}
exports.getFileContentsAsString = getFileContentsAsString;
/**
 * Returns given file's checksum by calculating the hash for the given algorithm.
 *
 * @param filePath File to generate checksum for.
 * @param algorithm Hashing algorithm. @default `sha256`
 * @returns Checksum of file as string.
 */
async function getFileChecksum(filePath, algorithm = 'sha256') {
    const fileContents = await getFileContents(filePath);
    return (0, node_crypto_1.createHash)(algorithm).update(fileContents).digest('hex');
}
exports.getFileChecksum = getFileChecksum;
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
async function verifyChecksum(originalFile, checksumFile, algorithm = 'sha256') {
    const binaryChecksum = await getFileChecksum(originalFile, algorithm);
    const declaredChecksumFileContents = await getFileContents(checksumFile);
    const declaredChecksum = declaredChecksumFileContents
        .toString()
        .trim()
        .split(/\s+/)[0];
    try {
        return (0, node_crypto_1.timingSafeEqual)(Buffer.from(binaryChecksum), Buffer.from(declaredChecksum));
    }
    catch {
        // Fail on other errors that can definitely cause the comparison to fail, including
        // mismatched Buffer byte lengths.
        return false;
    }
}
exports.verifyChecksum = verifyChecksum;
/**
 * Verifies the GPG signature of the given file.
 *
 * @param messageFilePath The message file that was signed.
 * @param signatureFilePath GPG signature file.
 * @param publicKeyFilePath GPG public key file.
 * @returns Returns `true` if signatures match, `false` if they don't.
 */
async function verifySignature(messageFilePath, signatureFilePath, publicKeyFilePath) {
    const messageText = await getFileContentsAsString(messageFilePath);
    const signatureBuffer = await getFileContents(signatureFilePath);
    const publicKeyText = await getFileContentsAsString(publicKeyFilePath);
    const publicKey = await (0, openpgp_1.readKey)({
        armoredKey: publicKeyText,
    });
    const signature = await (0, openpgp_1.readSignature)({
        binarySignature: signatureBuffer,
    });
    const message = await (0, openpgp_1.createMessage)({ text: messageText });
    const verificationResult = await (0, openpgp_1.verify)({
        message,
        signature,
        verificationKeys: publicKey,
    });
    const { verified } = verificationResult.signatures[0];
    try {
        await verified;
        return true;
    }
    catch {
        return false;
    }
}
exports.verifySignature = verifySignature;
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
function parsePathAndFormat(coverageConfigLine) {
    let lineParts = coverageConfigLine.split(':');
    // On Windows, if the glob received an absolute path, the path will
    // include the Drive letter and the path – for example, `C:\Users\gp\projects\cc\*.lcov:lcov`
    // which leads to 2 colons. So we handle this special case.
    if ((0, node_os_1.platform)() === 'win32' &&
        (coverageConfigLine.match(/:/g) || []).length > 1) {
        lineParts = [lineParts.slice(0, -1).join(':'), lineParts.slice(-1)[0]];
    }
    const format = lineParts.slice(-1)[0];
    const pattern = lineParts.slice(0, -1)[0];
    return { format, pattern };
}
exports.parsePathAndFormat = parsePathAndFormat;
