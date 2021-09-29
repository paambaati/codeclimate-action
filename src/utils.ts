import { createHash, timingSafeEqual } from 'crypto';
import { readFile, createWriteStream } from 'fs';
import { promisify } from 'util';
import { getInput } from '@actions/core';
import fetch from 'node-fetch';
import { readKey, readSignature, createMessage, verify } from 'openpgp';

const readFileAsync = promisify(readFile);
type ReadFileAsyncOptions = Omit<Parameters<typeof readFileAsync>[1], 'string'>;

/**
 * Parses GitHub Action input and returns the optional value as a string.
 *
 * @param name Input name (declared in `action.yml`).
 * @param defaultValue Default value as optional fallback.
 * @returns Parsed input value.
 */
export const getOptionalString = (name: string, defaultValue = '') =>
  getInput(name, { required: false }) || defaultValue;

/**
 * Naively checks if 2 given JSON objects are identical.
 *
 * @param obj1 First JSON.
 * @param obj2 Second JSON.
 * @returns `true` if same, `false` if not.
 */
export const areObjectsEqual = (
  obj1: object | [],
  obj2: object | []
): boolean => JSON.stringify(obj1) === JSON.stringify(obj2);

/**
 * Downloads the given URL as a file to the given file location.
 *
 * @param url URL to download.
 * @param file File path to save the download to.
 * @param mode (Optional) File mode.
 */
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

/**
 * Returns file contents as a `Buffer`.
 *
 * @param filePath File path to read.
 * @param options (Optional) File read options. @see https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#fs_filehandle_readfile_options
 * @returns File contents as `Buffer`.
 */
export async function getFileContents(
  filePath: string,
  options?: ReadFileAsyncOptions
): Promise<Buffer> {
  return await readFileAsync(filePath, options);
}

/**
 * Returns file contents as a string. Useful for reading ASCII-encoded files.
 *
 * @param filePath File path to read.
 * @param options (Optional) File read options. @see https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#fs_filehandle_readfile_options
 * @returns File contents as string.
 */
export async function getFileContentsAsString(
  filePath: string,
  options?: ReadFileAsyncOptions
): Promise<string> {
  return (await getFileContents(filePath, options)).toString('utf8');
}

/**
 * Returns given file's checksum by calculating the hash for the given algorithm.
 *
 * @param filePath File to generate checksum for.
 * @param algorithm Hashing algorithm. @default `sha256`
 * @returns Checksum of file as string.
 */
export async function getFileChecksum(
  filePath: string,
  algorithm: string = 'sha256'
): Promise<string> {
  const fileContents = await getFileContents(filePath);
  return createHash(algorithm).update(fileContents).digest('hex');
}

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
export async function verifyChecksum(
  originalFile: string,
  checksumFile: string,
  algorithm: string = 'sha256'
): Promise<boolean> {
  const binaryChecksum = await getFileChecksum(originalFile, algorithm);
  const declaredChecksumFileContents = await getFileContents(checksumFile);
  const declaredChecksum = declaredChecksumFileContents
    .toString()
    .trim()
    .split(' ')[0];
  try {
    return timingSafeEqual(
      Buffer.from(binaryChecksum),
      Buffer.from(declaredChecksum)
    );
  } catch {
    // Fail on other errors that can definitely cause the comparison to fail, including
    // mismatched Buffer byte lengths.
    return false;
  }
}

/**
 * Verifies the GPG signature of the given file.
 *
 * @param messageFilePath The message file that was signed.
 * @param signatureFilePath GPG signature file.
 * @param publicKeyFilePath GPG public key file.
 * @returns Returns `true` if signatures match, `false` if they don't.
 */
export async function verifySignature(
  messageFilePath: string,
  signatureFilePath: string,
  publicKeyFilePath: string
): Promise<boolean> {
  const messageText = await getFileContentsAsString(messageFilePath);
  const signatureBuffer = await getFileContents(signatureFilePath);
  const publicKeyText = await getFileContentsAsString(publicKeyFilePath);

  const publicKey = await readKey({
    armoredKey: publicKeyText,
  });

  const signature = await readSignature({
    binarySignature: signatureBuffer,
  });
  const message = await createMessage({ text: messageText });
  const verificationResult = await verify({
    message,
    signature,
    verificationKeys: publicKey,
  });
  const { verified } = verificationResult.signatures[0];
  try {
    await verified;
    return true;
  } catch {
    return false;
  }
}
