// src/main.ts
import { unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { chdir } from "node:process";
import { fileURLToPath } from "node:url";
import { debug, error, info, setFailed, warning } from "@actions/core";
import { exec } from "@actions/exec";
import { context } from "@actions/github";
import * as glob from "@actions/glob";

// src/utils.ts
import { createHash, timingSafeEqual } from "node:crypto";
import { createWriteStream, readFile } from "node:fs";
import { platform } from "node:os";
import { promisify } from "node:util";
import { getInput } from "@actions/core";
import arch from "arch";
import fetch from "node-fetch";
import {
  createMessage,
  readKey,
  readSignature,
  verify
} from "openpgp";
var readFileAsync = promisify(readFile);
var UNSUPPORTED_ENVIRONMENTS = [
  {
    platform: "darwin",
    architecture: "arm64"
  }
];
var getOptionalString = (name, defaultValue = "") => getInput(name, { required: false }) || defaultValue;
function downloadToFile(url, file, mode = 493) {
  return new Promise((resolve2, reject) => {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => {
        controller.abort();
      },
      // Timeout in 2 minutes.
      2 * 60 * 1e3
    );
    try {
      fetch(url, {
        redirect: "follow",
        follow: 5,
        signal: controller.signal
      }).then((response) => {
        if (response.status < 200 || response.status > 299) {
          throw new Error(
            `Download of '${url}' failed with response status code ${response.status}`
          );
        }
        const writer = createWriteStream(file, { mode });
        response.body?.pipe(writer);
        writer.on("close", () => {
          return resolve2();
        });
      }).catch((err) => {
        return reject(err);
      });
    } catch (err) {
      return reject(err);
    } finally {
      clearTimeout(timeout);
    }
  });
}
async function getFileContents(filePath, options) {
  return await readFileAsync(filePath, options);
}
async function getFileContentsAsString(filePath, options) {
  return (await getFileContents(filePath, options)).toString("utf8");
}
async function getFileChecksum(filePath, algorithm = "sha256") {
  const fileContents = await getFileContents(filePath);
  return createHash(algorithm).update(fileContents).digest("hex");
}
async function verifyChecksum(originalFile, checksumFile, algorithm = "sha256") {
  const binaryChecksum = await getFileChecksum(originalFile, algorithm);
  const declaredChecksumFileContents = await getFileContents(checksumFile);
  const declaredChecksum = declaredChecksumFileContents.toString().trim().split(/\s+/)[0] || "";
  try {
    return timingSafeEqual(
      Buffer.from(binaryChecksum),
      Buffer.from(declaredChecksum)
    );
  } catch {
    return false;
  }
}
async function verifySignature(messageFilePath, signatureFilePath, publicKeyFilePath) {
  const messageText = await getFileContentsAsString(messageFilePath);
  const signatureBuffer = await getFileContents(signatureFilePath);
  const publicKeyText = await getFileContentsAsString(publicKeyFilePath);
  const publicKey = await readKey({
    armoredKey: publicKeyText
  });
  const signature = await readSignature({
    binarySignature: signatureBuffer
  });
  const message = await createMessage({ text: messageText });
  const verificationResult = await verify({
    message,
    signature,
    verificationKeys: publicKey
  });
  const { verified } = verificationResult.signatures[0];
  try {
    await verified;
    return true;
  } catch {
    return false;
  }
}
function parsePathAndFormat(coverageConfigLine) {
  let lineParts = coverageConfigLine.split(":");
  if (platform() === "win32" && (coverageConfigLine.match(/:/g) || []).length > 1) {
    lineParts = [
      lineParts.slice(0, -1).join(":"),
      lineParts.slice(-1)[0]
    ];
  }
  const format = lineParts.slice(-1)[0];
  const pattern = lineParts.slice(0, -1)[0];
  return { format, pattern };
}
function getSupportedEnvironmentInfo() {
  const currentEnvironment = {
    platform: platform(),
    architecture: arch()
  };
  return {
    supported: !UNSUPPORTED_ENVIRONMENTS.some((e) => {
      return e.architecture === currentEnvironment.architecture && e.platform === currentEnvironment.platform;
    }),
    platform: currentEnvironment.platform,
    architecture: currentEnvironment.architecture
  };
}

// src/main.ts
var CURRENT_ENVIRONMENT = getSupportedEnvironmentInfo();
var PLATFORM = CURRENT_ENVIRONMENT.platform;
var DOWNLOAD_URL = `https://codeclimate.com/downloads/test-reporter/test-reporter-latest-${PLATFORM === "win32" ? "windows" : PLATFORM}-${CURRENT_ENVIRONMENT.architecture === "arm64" ? "arm64" : "amd64"}`;
var EXECUTABLE = "./cc-reporter";
var CODECLIMATE_GPG_PUBLIC_KEY_ID = "9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85";
var CODECLIMATE_GPG_PUBLIC_KEY_URL = `https://keys.openpgp.org/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`;
var DEFAULT_COVERAGE_COMMAND = "";
var DEFAULT_WORKING_DIRECTORY = "";
var DEFAULT_CODECLIMATE_DEBUG = "false";
var DEFAULT_COVERAGE_LOCATIONS = "";
var DEFAULT_VERIFY_DOWNLOAD = "true";
var DEFAULT_VERIFY_ENVIRONMENT = "true";
var SUPPORTED_GITHUB_EVENTS = [
  // Regular PRs.
  "pull_request",
  // PRs that were triggered on remote forks.
  "pull_request_target"
];
var FILE_ARTIFACTS = /* @__PURE__ */ new Set();
async function downloadAndRecord(url, file, mode) {
  await downloadToFile(url, file, mode);
  FILE_ARTIFACTS.add(file);
}
function prepareEnv() {
  const actionEnv = { ...process.env };
  const env = { ...process.env };
  if (actionEnv.GITHUB_SHA !== void 0)
    env.GIT_COMMIT_SHA = actionEnv.GITHUB_SHA;
  if (actionEnv.GITHUB_REF !== void 0) env.GIT_BRANCH = actionEnv.GITHUB_REF;
  if (env.GIT_BRANCH)
    env.GIT_BRANCH = env.GIT_BRANCH.replace(/^refs\/heads\//, "");
  if (actionEnv.GITHUB_EVENT_NAME && SUPPORTED_GITHUB_EVENTS.includes(actionEnv.GITHUB_EVENT_NAME)) {
    env.GIT_BRANCH = actionEnv.GITHUB_HEAD_REF || env.GIT_BRANCH;
    env.GIT_COMMIT_SHA = context.payload.pull_request?.["head"]?.sha;
  }
  return env;
}
async function verifyChecksumAndSignature(downloadUrl = DOWNLOAD_URL, executablePath = EXECUTABLE, algorithm = "sha256") {
  const checksumUrl = `${downloadUrl}.${algorithm}`;
  const checksumFilePath = `${executablePath}.${algorithm}`;
  const signatureUrl = `${downloadUrl}.${algorithm}.sig`;
  const signatureFilePath = `${executablePath}.${algorithm}.sig`;
  const ccPublicKeyFilePath = "public-key.asc";
  try {
    debug("\u2139\uFE0F Verifying CC Reporter checksum...");
    await downloadAndRecord(checksumUrl, checksumFilePath);
    const checksumVerified = await verifyChecksum(
      executablePath,
      checksumFilePath,
      algorithm
    );
    if (!checksumVerified)
      throw new Error("CC Reporter checksum does not match!");
    debug("\u2705 CC Reported checksum verification completed...");
  } catch (err) {
    error(err.message);
    setFailed("\u{1F6A8} CC Reporter checksum verfication failed!");
    throw err;
  }
  try {
    debug("\u2139\uFE0F Verifying CC Reporter GPG signature...");
    await downloadAndRecord(signatureUrl, signatureFilePath);
    await downloadAndRecord(
      CODECLIMATE_GPG_PUBLIC_KEY_URL,
      ccPublicKeyFilePath
    );
    const signatureVerified = await verifySignature(
      checksumFilePath,
      signatureFilePath,
      ccPublicKeyFilePath
    );
    if (!signatureVerified)
      throw new Error("CC Reporter GPG signature is invalid!");
    debug("\u2705 CC Reported GPG signature verification completed...");
  } catch (err) {
    error(err.message);
    setFailed("\u{1F6A8} CC Reporter GPG signature verfication failed!");
    throw err;
  }
}
async function getLocationLines(coverageLocationPatternsParam) {
  const coverageLocationPatternsLines = coverageLocationPatternsParam.split(/\r?\n/).filter((pat) => pat).map((pat) => pat.trim());
  const patternsAndFormats = coverageLocationPatternsLines.map(parsePathAndFormat);
  const pathsWithFormat = await Promise.all(
    patternsAndFormats.map(async ({ format, pattern }) => {
      const globber = await glob.create(pattern);
      const paths = await globber.glob();
      const pathsWithFormat2 = paths.map(
        (singlePath) => `${singlePath}:${format}`
      );
      return pathsWithFormat2;
    })
  );
  const coverageLocationLines = [].concat(
    ...pathsWithFormat
  );
  return coverageLocationLines;
}
async function run({
  downloadUrl = DOWNLOAD_URL,
  executable = EXECUTABLE,
  coverageCommand = DEFAULT_COVERAGE_COMMAND,
  workingDirectory = DEFAULT_WORKING_DIRECTORY,
  codeClimateDebug = DEFAULT_CODECLIMATE_DEBUG,
  coverageLocationsParam = DEFAULT_COVERAGE_LOCATIONS,
  coveragePrefix,
  verifyDownload = DEFAULT_VERIFY_DOWNLOAD,
  verifyEnvironment = DEFAULT_VERIFY_ENVIRONMENT
} = {}) {
  let lastExitCode = 1;
  if (verifyEnvironment === "true") {
    debug("\u2139\uFE0F Verifying environment...");
    const { supported, platform: platform2, architecture } = getSupportedEnvironmentInfo();
    if (!supported) {
      const errorMessage = `Unsupported platform and architecture! CodeClimate Test Reporter currently is not available for ${architecture} on ${platform2} OS`;
      error(errorMessage);
      setFailed("\u{1F6A8} Environment verification failed!");
      throw new Error(errorMessage);
    }
    lastExitCode = 0;
    debug("\u2705 Environment verification completed...");
  }
  if (workingDirectory) {
    debug(`\u2139\uFE0F Changing working directory to ${workingDirectory}`);
    try {
      chdir(workingDirectory);
      lastExitCode = 0;
      debug("\u2705 Changing working directory completed...");
    } catch (err) {
      error(err.message);
      setFailed("\u{1F6A8} Changing working directory failed!");
      throw err;
    }
  }
  try {
    debug(`\u2139\uFE0F Downloading CC Reporter from ${downloadUrl} ...`);
    await downloadAndRecord(downloadUrl, executable);
    debug("\u2705 CC Reporter downloaded...");
  } catch (err) {
    error(err.message);
    setFailed("\u{1F6A8} CC Reporter download failed!");
    warning(`Could not download ${downloadUrl}`);
    warning(
      "Please check if your platform is supported \u2014 see https://docs.codeclimate.com/docs/configuring-test-coverage#section-locations-of-pre-built-binaries"
    );
    throw err;
  }
  if (verifyDownload === "true") {
    await verifyChecksumAndSignature(downloadUrl, executable);
  }
  const execOpts = {
    env: prepareEnv()
  };
  try {
    lastExitCode = await exec(executable, ["before-build"], execOpts);
    if (lastExitCode !== 0) {
      throw new Error(`Coverage after-build exited with code ${lastExitCode}`);
    }
    debug("\u2705 CC Reporter before-build checkin completed...");
  } catch (err) {
    error(err.message);
    setFailed("\u{1F6A8} CC Reporter before-build checkin failed!");
    throw err;
  }
  if (coverageCommand) {
    try {
      lastExitCode = await exec(coverageCommand, void 0, execOpts);
      if (lastExitCode !== 0) {
        throw new Error(`Coverage run exited with code ${lastExitCode}`);
      }
      debug("\u2705 Coverage run completed...");
    } catch (err) {
      error(err.message);
      setFailed("\u{1F6A8} Coverage run failed!");
      throw err;
    }
  } else {
    info(`\u2139\uFE0F 'coverageCommand' not set, so skipping building coverage report!`);
  }
  const coverageLocations = await getLocationLines(coverageLocationsParam);
  if (coverageLocations.length > 0) {
    debug(
      `Parsing ${coverageLocations.length} coverage location(s) \u2014 ${coverageLocations} (${typeof coverageLocations})`
    );
    const parts = [];
    for (const i in coverageLocations) {
      const { format: type, pattern: location } = parsePathAndFormat(
        coverageLocations[i]
      );
      if (!type) {
        const err = new Error(`Invalid formatter type ${type}`);
        debug(
          `\u26A0\uFE0F Could not find coverage formatter type! Found ${coverageLocations[i]} (${typeof coverageLocations[i]})`
        );
        error(err.message);
        setFailed(
          "\u{1F6A8} Coverage formatter type not set! Each coverage location should be of the format <file_path>:<coverage_format>"
        );
        throw err;
      }
      const commands = [
        "format-coverage",
        location,
        "-t",
        type,
        "-o",
        `codeclimate.${i}.json`
      ];
      if (codeClimateDebug === "true") commands.push("--debug");
      if (coveragePrefix) {
        commands.push("--prefix", coveragePrefix);
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
        setFailed("\u{1F6A8} CC Reporter coverage formatting failed!");
        throw err;
      }
    }
    const sumCommands = [
      "sum-coverage",
      ...parts,
      "-p",
      `${coverageLocations.length}`,
      "-o",
      "coverage.total.json"
    ];
    if (codeClimateDebug === "true") sumCommands.push("--debug");
    try {
      lastExitCode = await exec(executable, sumCommands, execOpts);
      if (lastExitCode !== 0) {
        throw new Error(
          `Coverage sum process exited with code ${lastExitCode}`
        );
      }
    } catch (err) {
      error(err.message);
      setFailed("\u{1F6A8} CC Reporter coverage sum failed!");
      throw err;
    }
    const uploadCommands = ["upload-coverage", "-i", "coverage.total.json"];
    if (codeClimateDebug === "true") uploadCommands.push("--debug");
    try {
      lastExitCode = await exec(executable, uploadCommands, execOpts);
      if (lastExitCode !== 0) {
        throw new Error(`Coverage upload exited with code ${lastExitCode}`);
      }
      debug("\u2705 CC Reporter upload coverage completed!");
      return;
    } catch (err) {
      error(err.message);
      setFailed("\u{1F6A8} CC Reporter coverage upload failed!");
      throw err;
    }
  }
  try {
    const commands = ["after-build", "--exit-code", lastExitCode.toString()];
    if (codeClimateDebug === "true") commands.push("--debug");
    if (coveragePrefix) {
      commands.push("--prefix", coveragePrefix);
    }
    lastExitCode = await exec(executable, commands, execOpts);
    if (lastExitCode !== 0) {
      throw new Error(`Coverage after-build exited with code ${lastExitCode}`);
    }
    debug("\u2705 CC Reporter after-build checkin completed!");
    return;
  } catch (err) {
    error(err.message);
    setFailed("\u{1F6A8} CC Reporter after-build checkin failed!");
    throw err;
  }
}
var pathToThisFile = resolve(fileURLToPath(import.meta.url));
var pathPassedToNode = resolve(process.argv[1]);
var isThisFileBeingRunViaCLI = pathToThisFile.includes(pathPassedToNode);
if (isThisFileBeingRunViaCLI) {
  const coverageCommand = getOptionalString(
    "coverageCommand",
    DEFAULT_COVERAGE_COMMAND
  );
  const workingDirectory = getOptionalString(
    "workingDirectory",
    DEFAULT_WORKING_DIRECTORY
  );
  const codeClimateDebug = getOptionalString(
    "debug",
    DEFAULT_CODECLIMATE_DEBUG
  );
  const coverageLocations = getOptionalString(
    "coverageLocations",
    DEFAULT_COVERAGE_LOCATIONS
  );
  const coveragePrefix = getOptionalString("prefix");
  const verifyDownload = getOptionalString(
    "verifyDownload",
    DEFAULT_VERIFY_DOWNLOAD
  );
  const verifyEnvironment = getOptionalString(
    "verifyEnvironment",
    DEFAULT_VERIFY_ENVIRONMENT
  );
  try {
    run({
      downloadUrl: DOWNLOAD_URL,
      executable: EXECUTABLE,
      coverageCommand,
      workingDirectory,
      codeClimateDebug,
      coverageLocationsParam: coverageLocations,
      coveragePrefix,
      verifyDownload,
      verifyEnvironment
    });
  } finally {
    for (const artifact of FILE_ARTIFACTS) {
      try {
        unlinkSync(artifact);
      } catch {
      }
    }
  }
}
export {
  CODECLIMATE_GPG_PUBLIC_KEY_ID,
  DOWNLOAD_URL,
  EXECUTABLE,
  FILE_ARTIFACTS,
  downloadAndRecord,
  prepareEnv,
  run,
  verifyChecksumAndSignature
};
