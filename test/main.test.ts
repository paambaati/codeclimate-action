import test from 'tape';
import nock from 'nock';
import toReadableStream from 'to-readable-stream';
import { default as hookStd } from 'hook-std';
import * as glob from '@actions/glob';
import sinon from 'sinon';
import { default as os, tmpdir, EOL } from 'node:os';
import { join as joinPath, extname } from 'node:path';
import {
  writeFileSync,
  unlinkSync,
  readFile,
  realpath as realpathCallback,
} from 'node:fs';
import { readdir } from 'node:fs/promises';
import { exec as pExec } from 'node:child_process';
import { promisify } from 'util';
import { CODECLIMATE_GPG_PUBLIC_KEY_ID, run } from '../src/main';
import * as utils from '../src/utils';

/**
 * Dev Notes
 *
 * 1. `stdHook.unhook()` is called at the end of both `try` and `catch`
 * instead of once in `finally` specifically because the hook is still
 * capturing stdout/stderr, and so if there's some error, it can still
 * be printed on the screen. If the unhook method is moved to `finally`,
 * it will capture, i.e. swallow and not print, error traces.
 * */

const realpath = promisify(realpathCallback);
const readFileAsync = promisify(readFile);

const PLATFORM = os.platform();
const EXE_EXT = PLATFORM === 'win32' ? 'bat' : ('sh' as const);
const DEFAULT_WORKDIR = process.cwd();
const EXE_PATH_PREFIX =
  PLATFORM === 'win32'
    ? 'C:\\WINDOWS\\system32\\cmd.exe /D /S /C'
    : ('' as const);
let ECHO_CMD = PLATFORM === 'win32' ? `${EXE_PATH_PREFIX} echo` : '/bin/echo';

const sandbox = sinon.createSandbox();

test('🛠 setup', (t) => {
  t.plan(0);
  nock.disableNetConnect();
  if (!nock.isActive()) nock.activate();
  // Try to detect and set `echo` only on *nix systems.
  if (PLATFORM !== 'win32') {
    pExec('which echo', (err, stdout, stderr) => {
      if (err || stderr) t.fail(err?.message || stderr);
      ECHO_CMD = stdout.trim(); // Finds system default `echo`.
      t.end();
    });
  } else {
    t.end();
  }
});

test('🧪 run() should run the CC reporter (happy path).', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}`;
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256.sig`;
      const signature = await readFileAsync(signatureFile);
      return toReadableStream(signature);
    });

  nock('https://keys.openpgp.org')
    .get(`/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`)
    .reply(200, async () => {
      const publicKeyFile = `./test/fixtures/9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85.asc`;
      const publicKey = await readFileAsync(publicKeyFile);
      return toReadableStream(publicKey);
    });

  // We now allow `verifyChecksum()` to return `true` as well
  // because a) we don't want to bother crafting checksums for
  // fixtures and b) checksums differ across platforms and they
  // are a pain to create and get to work correctly.
  sandbox.stub(utils, 'verifyChecksum').resolves(true);
  // We always allow `verifySignature()` to return `true`
  // because we don't have access to the private key (obviously)
  // and so cannot create correct signatures for fixtures anyways.
  sandbox.stub(utils, 'verifySignature').resolves(true);

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      `${ECHO_CMD} 'coverage ok'`
    );
    stdHook.unhook();
  } catch (err) {
    stdHook.unhook();
    t.fail(err);
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    [
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
      `::debug::✅ CC Reporter downloaded...`,
      `::debug::ℹ️ Verifying CC Reporter checksum...`,
      `::debug::✅ CC Reported checksum verification completed...`,
      `::debug::ℹ️ Verifying CC Reporter GPG signature...`,
      `::debug::✅ CC Reported GPG signature verification completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
      `before-build`,
      `::debug::✅ CC Reporter before-build checkin completed...`,
      `[command]${ECHO_CMD} 'coverage ok'`,
      `'coverage ok'`,
      `::debug::✅ Coverage run completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} after-build --exit-code 0"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
      `after-build --exit-code 0`,
      `::debug::✅ CC Reporter after-build checkin completed!`,
      ``,
    ].join(EOL),
    'should execute all steps in happy path.'
  );
  unlinkSync(filePath);
  unlinkSync(`${filePath}.sha256`);
  unlinkSync(`${filePath}.sha256.sig`);
  unlinkSync('public-key.asc');
  nock.cleanAll();
  t.end();
});

test('🧪 run() should run the CC reporter without verification if configured.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}`;
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      `${ECHO_CMD} 'coverage ok'`,
      undefined,
      undefined,
      undefined,
      undefined,
      'false'
    );
    stdHook.unhook();
  } catch (err) {
    stdHook.unhook();
    t.fail(err);
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    [
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
      `::debug::✅ CC Reporter downloaded...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
      `before-build`,
      `::debug::✅ CC Reporter before-build checkin completed...`,
      `[command]${ECHO_CMD} 'coverage ok'`,
      `'coverage ok'`,
      `::debug::✅ Coverage run completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} after-build --exit-code 0"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
      `after-build --exit-code 0`,
      `::debug::✅ CC Reporter after-build checkin completed!`,
      ``,
    ].join(EOL),
    'should execute all steps (except verification).'
  );
  unlinkSync(filePath);
  nock.cleanAll();
  t.end();
});

test('🧪 run() should run the CC reporter without a coverage command.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}`;
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256.sig`;
      const signature = await readFileAsync(signatureFile);
      return toReadableStream(signature);
    });

  nock('https://keys.openpgp.org')
    .get(`/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`)
    .reply(200, async () => {
      const publicKeyFile = `./test/fixtures/9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85.asc`;
      const publicKey = await readFileAsync(publicKeyFile);
      return toReadableStream(publicKey);
    });

  sandbox.stub(utils, 'verifyChecksum').resolves(true);
  sandbox.stub(utils, 'verifySignature').resolves(true);

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  try {
    await run('http://localhost.test/dummy-cc-reporter', filePath, '');
    stdHook.unhook();
  } catch (err) {
    stdHook.unhook();
    t.fail(err);
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    [
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
      `::debug::✅ CC Reporter downloaded...`,
      `::debug::ℹ️ Verifying CC Reporter checksum...`,
      `::debug::✅ CC Reported checksum verification completed...`,
      `::debug::ℹ️ Verifying CC Reporter GPG signature...`,
      `::debug::✅ CC Reported GPG signature verification completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
      `before-build`,
      `::debug::✅ CC Reporter before-build checkin completed...`,
      `ℹ️ 'coverageCommand' not set, so skipping building coverage report!`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} after-build --exit-code 0"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
      `after-build --exit-code 0`,
      `::debug::✅ CC Reporter after-build checkin completed!`,
      ``,
    ].join(EOL),
    'should execute all steps (except running the coverage command).'
  );
  unlinkSync(filePath);
  unlinkSync(`${filePath}.sha256`);
  unlinkSync(`${filePath}.sha256.sig`);
  unlinkSync('public-key.asc');
  nock.cleanAll();
  t.end();
});

test('🧪 run() should convert patterns to locations.', async (t) => {
  t.plan(3);
  t.teardown(() => sandbox.restore());
  const globSpy = sandbox
    .stub()
    .resolves([
      joinPath(DEFAULT_WORKDIR, './file-a.lcov'),
      joinPath(DEFAULT_WORKDIR, './file-b.lcov'),
    ]);
  sandbox.stub(glob, 'create').resolves({
    glob: globSpy,
    getSearchPaths: sandbox.spy(),
    globGenerator: sandbox.spy(),
  });
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}`;
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256.sig`;
      const signature = await readFileAsync(signatureFile);
      return toReadableStream(signature);
    });

  nock('https://keys.openpgp.org')
    .get(`/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`)
    .reply(200, async () => {
      const publicKeyFile = `./test/fixtures/9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85.asc`;
      const publicKey = await readFileAsync(publicKeyFile);
      return toReadableStream(publicKey);
    });

  sandbox.stub(utils, 'verifyChecksum').resolves(true);
  sandbox.stub(utils, 'verifySignature').resolves(true);

  const filePattern =
    PLATFORM === 'win32'
      ? `${DEFAULT_WORKDIR}\\*.lcov:lcov`
      : `${DEFAULT_WORKDIR}/*.lcov:lcov`;
  const fileA = 'file-a.lcov' as const;
  const fileB = 'file-b.lcov' as const;

  writeFileSync(fileA, 'file a content');
  writeFileSync(fileB, 'file b content');

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      '',
      '',
      'false',
      filePattern
    );
    stdHook.unhook();
  } catch (err) {
    stdHook.unhook();
    t.fail(err);
  } finally {
    nock.cleanAll();
  }

  t.equal(
    (glob.create as unknown as sinon.SinonSpy).firstCall.firstArg,
    PLATFORM === 'win32'
      ? `${DEFAULT_WORKDIR}\\*.lcov`
      : `${DEFAULT_WORKDIR}/*.lcov`,
    'should create a globber with given pattern.'
  );
  t.true(
    globSpy.calledOnceWithExactly(),
    'should get the paths of the files from the newly created globber instance.'
  );
  t.equal(
    capturedOutput,
    [
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
      `::debug::✅ CC Reporter downloaded...`,
      `::debug::ℹ️ Verifying CC Reporter checksum...`,
      `::debug::✅ CC Reported checksum verification completed...`,
      `::debug::ℹ️ Verifying CC Reporter GPG signature...`,
      `::debug::✅ CC Reported GPG signature verification completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
      `before-build`,
      `::debug::✅ CC Reporter before-build checkin completed...`,
      `ℹ️ 'coverageCommand' not set, so skipping building coverage report!`,
      PLATFORM === 'win32'
        ? `::debug::Parsing 2 coverage location(s) — ${DEFAULT_WORKDIR}\\file-a.lcov:lcov,${DEFAULT_WORKDIR}\\file-b.lcov:lcov (object)`
        : `::debug::Parsing 2 coverage location(s) — ${DEFAULT_WORKDIR}/file-a.lcov:lcov,${DEFAULT_WORKDIR}/file-b.lcov:lcov (object)`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} format-coverage ${DEFAULT_WORKDIR}\\file-a.lcov -t lcov -o codeclimate.0.json"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} format-coverage ${DEFAULT_WORKDIR}/file-a.lcov -t lcov -o codeclimate.0.json`,
      PLATFORM === 'win32'
        ? `format-coverage ${DEFAULT_WORKDIR}\\file-a.lcov -t lcov -o codeclimate.0.json`
        : `format-coverage ${DEFAULT_WORKDIR}/file-a.lcov -t lcov -o codeclimate.0.json`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} format-coverage ${DEFAULT_WORKDIR}\\file-b.lcov -t lcov -o codeclimate.1.json"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} format-coverage ${DEFAULT_WORKDIR}/file-b.lcov -t lcov -o codeclimate.1.json`,
      PLATFORM === 'win32'
        ? `format-coverage ${DEFAULT_WORKDIR}\\file-b.lcov -t lcov -o codeclimate.1.json`
        : `format-coverage ${DEFAULT_WORKDIR}/file-b.lcov -t lcov -o codeclimate.1.json`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} sum-coverage codeclimate.0.json codeclimate.1.json -p 2 -o coverage.total.json"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} sum-coverage codeclimate.0.json codeclimate.1.json -p 2 -o coverage.total.json`,
      `sum-coverage codeclimate.0.json codeclimate.1.json -p 2 -o coverage.total.json`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} upload-coverage -i coverage.total.json"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} upload-coverage -i coverage.total.json`,
      `upload-coverage -i coverage.total.json`,
      `::debug::✅ CC Reporter upload coverage completed!`,
      ``,
    ].join(EOL),
    'should execute all steps (including uploading globbed coverage files).'
  );
  unlinkSync(filePath);
  unlinkSync(`${filePath}.sha256`);
  unlinkSync(`${filePath}.sha256.sig`);
  unlinkSync('public-key.asc');
  unlinkSync(fileA);
  unlinkSync(fileB);
  nock.cleanAll();
  t.end();
});

test('🧪 run() should correctly switch the working directory if given.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = joinPath(
        __dirname,
        `./fixtures/dummy-cc-reporter.${EXE_EXT}`
      );
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = joinPath(
        __dirname,
        `./fixtures/dummy-cc-reporter.${EXE_EXT}.sha256`
      );
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = joinPath(
        __dirname,
        `./fixtures/dummy-cc-reporter.${EXE_EXT}.sha256.sig`
      );
      const signature = await readFileAsync(signatureFile);
      return toReadableStream(signature);
    });

  nock('https://keys.openpgp.org')
    .get(`/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`)
    .reply(200, async () => {
      const publicKeyFile = joinPath(
        __dirname,
        `./fixtures/9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85.asc`
      );
      const publicKey = await readFileAsync(publicKeyFile);
      return toReadableStream(publicKey);
    });

  sandbox.stub(utils, 'verifyChecksum').resolves(true);
  sandbox.stub(utils, 'verifySignature').resolves(true);

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  const CUSTOM_WORKDIR = await realpath(tmpdir());
  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      `${ECHO_CMD} 'coverage ok'`,
      CUSTOM_WORKDIR
    );
    stdHook.unhook();
  } catch (err) {
    stdHook.unhook();
    t.fail(err);
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    [
      `::debug::Changing working directory to ${CUSTOM_WORKDIR}`,
      `::debug::✅ Changing working directory completed...`,
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
      `::debug::✅ CC Reporter downloaded...`,
      `::debug::ℹ️ Verifying CC Reporter checksum...`,
      `::debug::✅ CC Reported checksum verification completed...`,
      `::debug::ℹ️ Verifying CC Reporter GPG signature...`,
      `::debug::✅ CC Reported GPG signature verification completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} ""${CUSTOM_WORKDIR}\\test.${EXE_EXT}" before-build"`
        : `[command]${CUSTOM_WORKDIR}/test.${EXE_EXT} before-build`,
      `before-build`,
      `::debug::✅ CC Reporter before-build checkin completed...`,
      `[command]${ECHO_CMD} 'coverage ok'`,
      `'coverage ok'`,
      `::debug::✅ Coverage run completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${CUSTOM_WORKDIR}\\test.${EXE_EXT}" after-build --exit-code 0"`
        : `[command]${CUSTOM_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
      `after-build --exit-code 0`,
      `::debug::✅ CC Reporter after-build checkin completed!`,
      ``,
    ].join(EOL),
    'should execute all steps when custom working directory is given.'
  );
  unlinkSync(filePath);
  nock.cleanAll();
  process.chdir(DEFAULT_WORKDIR);
  t.end();
});

test('🧪 run() should throw an error if the checksum verification fails.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = `./test/fixtures/dummy-cc-reporter-before-build-error.${EXE_EXT}`;
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get(`/dummy-cc-reporter.sha256`)
    .reply(200, () => {
      const dummyChecksum = 'lolno';
      return toReadableStream(dummyChecksum);
    });

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      `${ECHO_CMD} 'coverage ok'`
    );
    t.fail('should have thrown an error');
    stdHook.unhook();
  } catch (err) {
    stdHook.unhook();
    // do nothing else, we expect this run command to fail.
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    [
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
      `::debug::✅ CC Reporter downloaded...`,
      `::debug::ℹ️ Verifying CC Reporter checksum...`,
      `::error::CC Reporter checksum does not match!`,
      `::error::🚨 CC Reporter checksum verfication failed!`,
      ``,
    ].join(EOL),
    'should correctly throw the error if the checksum verification fails.'
  );
  unlinkSync(filePath);
  unlinkSync(`${filePath}.sha256`);
  nock.cleanAll();
  t.end();
});

test('🧪 run() should throw an error if the GPG signature verification fails.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = `./test/fixtures/dummy-cc-reporter-before-build-error.${EXE_EXT}`;
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter-before-build-error.${EXE_EXT}.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256.sig`;
      const signature = await readFileAsync(signatureFile);
      return toReadableStream(signature);
    });

  nock('https://keys.openpgp.org')
    .get(`/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`)
    .reply(200, async () => {
      const publicKeyFile = `./test/fixtures/9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85.asc`;
      const publicKey = await readFileAsync(publicKeyFile);
      return toReadableStream(publicKey);
    });

  sandbox.stub(utils, 'verifyChecksum').resolves(true);
  sandbox.stub(utils, 'verifySignature').resolves(false);

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      `echo 'coverage ok'`
    );
    stdHook.unhook();
  } catch (err) {
    stdHook.unhook();
    // do nothing else, we expect this run command to fail.
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    [
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
      `::debug::✅ CC Reporter downloaded...`,
      `::debug::ℹ️ Verifying CC Reporter checksum...`,
      `::debug::✅ CC Reported checksum verification completed...`,
      `::debug::ℹ️ Verifying CC Reporter GPG signature...`,
      `::error::CC Reporter GPG signature is invalid!`,
      `::error::🚨 CC Reporter GPG signature verfication failed!`,
      ``,
    ].join(EOL),
    'should correctly throw the error if the GPG signature verification fails.'
  );
  unlinkSync(filePath);
  unlinkSync(`${filePath}.sha256`);
  unlinkSync(`${filePath}.sha256.sig`);
  unlinkSync('public-key.asc');
  nock.cleanAll();
  t.end();
});

test('🧪 run() should throw an error if the before-build step throws an error.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = `./test/fixtures/dummy-cc-reporter-before-build-error.${EXE_EXT}`;
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter-before-build-error.${EXE_EXT}.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256.sig`;
      const signature = await readFileAsync(signatureFile);
      return toReadableStream(signature);
    });

  nock('https://keys.openpgp.org')
    .get(`/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`)
    .reply(200, async () => {
      const publicKeyFile = `./test/fixtures/9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85.asc`;
      const publicKey = await readFileAsync(publicKeyFile);
      return toReadableStream(publicKey);
    });

  sandbox.stub(utils, 'verifyChecksum').resolves(true);
  sandbox.stub(utils, 'verifySignature').resolves(true);

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      `${ECHO_CMD} 'coverage ok'`
    );
    stdHook.unhook();
  } catch (err) {
    stdHook.unhook();
    // do nothing else, we expect this run command to fail.
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    [
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
      `::debug::✅ CC Reporter downloaded...`,
      `::debug::ℹ️ Verifying CC Reporter checksum...`,
      `::debug::✅ CC Reported checksum verification completed...`,
      `::debug::ℹ️ Verifying CC Reporter GPG signature...`,
      `::debug::✅ CC Reported GPG signature verification completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
      PLATFORM === 'win32'
        ? `::error::The process '${DEFAULT_WORKDIR}\\test.${EXE_EXT}' failed with exit code 69`
        : `::error::The process '${DEFAULT_WORKDIR}/test.${EXE_EXT}' failed with exit code 69`,
      `::error::🚨 CC Reporter before-build checkin failed!`,
      ``,
    ].join(EOL),
    'should correctly throw the error if the before-build step throws an error.'
  );
  unlinkSync(filePath);
  unlinkSync(`${filePath}.sha256`);
  unlinkSync(`${filePath}.sha256.sig`);
  unlinkSync('public-key.asc');
  nock.cleanAll();
  t.end();
});

test('🧪 run() should throw an error if the after-build step throws an error.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = `./test/fixtures/dummy-cc-reporter-after-build-error.${EXE_EXT}`;
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter-after-build-error.${EXE_EXT}.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256.sig`;
      const signature = await readFileAsync(signatureFile);
      return toReadableStream(signature);
    });

  nock('https://keys.openpgp.org')
    .get(`/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`)
    .reply(200, async () => {
      const publicKeyFile = `./test/fixtures/9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85.asc`;
      const publicKey = await readFileAsync(publicKeyFile);
      return toReadableStream(publicKey);
    });

  sandbox.stub(utils, 'verifyChecksum').resolves(true);
  sandbox.stub(utils, 'verifySignature').resolves(true);

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      `${ECHO_CMD} 'coverage ok'`
    );
    stdHook.unhook();
  } catch (err) {
    stdHook.unhook();
    // do nothing else, we expect this run command to fail.
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    [
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
      `::debug::✅ CC Reporter downloaded...`,
      `::debug::ℹ️ Verifying CC Reporter checksum...`,
      `::debug::✅ CC Reported checksum verification completed...`,
      `::debug::ℹ️ Verifying CC Reporter GPG signature...`,
      `::debug::✅ CC Reported GPG signature verification completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
      `::debug::✅ CC Reporter before-build checkin completed...`,
      `[command]${ECHO_CMD} 'coverage ok'`,
      `'coverage ok'`,
      `::debug::✅ Coverage run completed...`,
      PLATFORM === 'win32'
        ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} after-build --exit-code 0"`
        : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
      PLATFORM === 'win32'
        ? `::error::The process '${DEFAULT_WORKDIR}\\test.${EXE_EXT}' failed with exit code 69`
        : `::error::The process '${DEFAULT_WORKDIR}/test.${EXE_EXT}' failed with exit code 69`,
      `::error::🚨 CC Reporter after-build checkin failed!`,
      ``,
    ].join(EOL),
    'should correctly throw the error if the after-build step throws an error.'
  );
  unlinkSync(filePath);
  unlinkSync(`${filePath}.sha256`);
  unlinkSync(`${filePath}.sha256.sig`);
  unlinkSync('public-key.asc');
  nock.cleanAll();
  t.end();
});

test('🧪 run() should exit cleanly when the coverage command fails.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const COVERAGE_COMMAND = 'wololololo'; // Random command that doesn't exist (and so should fail).
  const filePath = `./test.${EXE_EXT}`;
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}`;
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256.sig`;
      const signature = await readFileAsync(signatureFile);
      return toReadableStream(signature);
    });

  nock('https://keys.openpgp.org')
    .get(`/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`)
    .reply(200, async () => {
      const publicKeyFile = `./test/fixtures/9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85.asc`;
      const publicKey = await readFileAsync(publicKeyFile);
      return toReadableStream(publicKey);
    });

  sandbox.stub(utils, 'verifyChecksum').resolves(true);
  sandbox.stub(utils, 'verifySignature').resolves(true);

  let capturedOutput = '';
  const stdHook = hookStd((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      COVERAGE_COMMAND
    );
    stdHook.unhook();
    t.fail('Should throw an error.');
  } catch (err) {
    stdHook.unhook();
    t.equal(
      capturedOutput,
      [
        `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...`,
        `::debug::✅ CC Reporter downloaded...`,
        `::debug::ℹ️ Verifying CC Reporter checksum...`,
        `::debug::✅ CC Reported checksum verification completed...`,
        `::debug::ℹ️ Verifying CC Reporter GPG signature...`,
        `::debug::✅ CC Reported GPG signature verification completed...`,
        PLATFORM === 'win32'
          ? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
          : `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
        `before-build`,
        `::debug::✅ CC Reporter before-build checkin completed...`,
        PLATFORM === 'win32'
          ? `::error::Unable to locate executable file: ${COVERAGE_COMMAND}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`
          : `::error::Unable to locate executable file: ${COVERAGE_COMMAND}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`,
        `::error::🚨 Coverage run failed!`,
        ``,
      ].join(EOL),
      'should fail correctly on wrong/invalid coverage command.'
    );
  } finally {
    unlinkSync(filePath);
    unlinkSync(`${filePath}.sha256`);
    unlinkSync(`${filePath}.sha256.sig`);
    unlinkSync('public-key.asc');
    nock.cleanAll();
    t.end();
  }
});

test('💣 teardown', (t) => {
  nock.restore();
  nock.cleanAll();
  nock.enableNetConnect();
  sandbox.restore();
  if (process.exitCode === 1) process.exitCode = 0; // This is required because @actions/core `setFailed` sets the exit code to 0 when we're testing errors.
  t.end();
});
