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
exports.verifySignature = exports.verifyChecksum = exports.getFileChecksum = exports.getFileContentsAsString = exports.getFileContents = exports.downloadToFile = exports.areObjectsEqual = exports.getOptionalString = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const util_1 = require("util");
const core_1 = require("@actions/core");
const node_fetch_1 = __importDefault(require("node-fetch"));
const openpgp_1 = require("openpgp");
const readFileAsync = (0, util_1.promisify)(fs_1.readFile);
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
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, node_fetch_1.default)(url, { timeout: 2 * 60 * 1000 }); // Timeout in 2 minutes.
            const writer = (0, fs_1.createWriteStream)(file, { mode });
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
/**
 * Returns file contents as a `Buffer`.
 *
 * @param filePath File path to read.
 * @param options (Optional) File read options. @see https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#fs_filehandle_readfile_options
 * @returns File contents as `Buffer`.
 */
function getFileContents(filePath, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield readFileAsync(filePath, options);
    });
}
exports.getFileContents = getFileContents;
/**
 * Returns file contents as a string. Useful for reading ASCII-encoded files.
 *
 * @param filePath File path to read.
 * @param options (Optional) File read options. @see https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#fs_filehandle_readfile_options
 * @returns File contents as string.
 */
function getFileContentsAsString(filePath, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield getFileContents(filePath, options)).toString('utf8');
    });
}
exports.getFileContentsAsString = getFileContentsAsString;
/**
 * Returns given file's checksum by calculating the hash for the given algorithm.
 *
 * @param filePath File to generate checksum for.
 * @param algorithm Hashing algorithm. @default `sha256`
 * @returns Checksum of file as string.
 */
function getFileChecksum(filePath, algorithm = 'sha256') {
    return __awaiter(this, void 0, void 0, function* () {
        const fileContents = yield getFileContents(filePath);
        return (0, crypto_1.createHash)(algorithm).update(fileContents).digest('hex');
    });
}
exports.getFileChecksum = getFileChecksum;
/**
 * Verifies that the file and its checksum file actually match. It generates
 * the checksum and compares it with the checksum in the accompanying checksum file.
 *
 * Note that the checksum file is of the format `<checksum> <filename>`.
 *
 * @param originalFile Original file for which the checksum was generated.
 * @param checksumFile Checksum file.
 * @param algorithm (Optional) Hashing algorithm. @default `sha256`
 * @returns Returns `true` if checksums match, `false` if they don't.
 */
function verifyChecksum(originalFile, checksumFile, algorithm = 'sha256') {
    return __awaiter(this, void 0, void 0, function* () {
        const binaryChecksum = yield getFileChecksum(originalFile, algorithm);
        const declaredChecksumFileContents = yield getFileContents(checksumFile);
        const declaredChecksum = declaredChecksumFileContents
            .toString()
            .trim()
            .split(' ')[0];
        try {
            return (0, crypto_1.timingSafeEqual)(Buffer.from(binaryChecksum), Buffer.from(declaredChecksum));
        }
        catch (_a) {
            // Fail on other errors that can definitely cause the comparison to fail, including
            // mismatched Buffer byte lengths.
            return false;
        }
    });
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
function verifySignature(messageFilePath, signatureFilePath, publicKeyFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageText = yield getFileContentsAsString(messageFilePath);
        const signatureBuffer = yield getFileContents(signatureFilePath);
        const publicKeyText = yield getFileContentsAsString(publicKeyFilePath);
        const publicKey = yield (0, openpgp_1.readKey)({
            armoredKey: publicKeyText,
        });
        const signature = yield (0, openpgp_1.readSignature)({
            binarySignature: signatureBuffer,
        });
        const message = yield (0, openpgp_1.createMessage)({ text: messageText });
        const verificationResult = yield (0, openpgp_1.verify)({
            message,
            signature,
            verificationKeys: publicKey,
        });
        const { verified } = verificationResult.signatures[0];
        try {
            yield verified;
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
exports.verifySignature = verifySignature;
