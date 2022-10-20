import test from 'tape';
import nock from 'nock';
import toReadableStream from 'to-readable-stream';
import { default as hookStd } from 'hook-std';
import * as glob from '@actions/glob';
import sinon from 'sinon';
import { default as os, tmpdir } from 'os';
import { join as joinPath } from 'path';
import {
  writeFileSync,
  unlinkSync,
  readFile,
  realpath as realpathCallback,
} from 'fs';
import { exec as pExec } from 'child_process';
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

const DEFAULT_WORKDIR = process.cwd();
let DEFAULT_ECHO = '/bin/echo';

const sandbox = sinon.createSandbox();

test('🛠 setup', (t) => {
  nock.disableNetConnect();
  if (!nock.isActive()) nock.activate();
  pExec('which echo', (err, stdout, stderr) => {
    if (err || stderr) t.fail(err?.message || stderr);
    DEFAULT_ECHO = stdout.trim(); // Finds system default `echo`.
    t.end();
  });
});

test('🧪 run() should run the CC reporter (happy path).', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = './test/fixtures/dummy-cc-reporter.sh';
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.sha256.sig`;
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

  sandbox.stub(utils, 'verifySignature').resolves(true);

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
    t.fail(err);
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    // prettier-ignore
    `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
::debug::ℹ️ Verifying CC Reporter checksum...
::debug::✅ CC Reported checksum verification completed...
::debug::ℹ️ Verifying CC Reporter GPG signature...
::debug::✅ CC Reported GPG signature verification completed...
[command]${DEFAULT_WORKDIR}/test.sh before-build\nbefore-build
::debug::✅ CC Reporter before-build checkin completed...
[command]${DEFAULT_ECHO} \'coverage ok\'
\'coverage ok\'
::debug::✅ Coverage run completed...
[command]${DEFAULT_WORKDIR}/test.sh after-build --exit-code 0
after-build --exit-code 0
::debug::✅ CC Reporter after-build checkin completed!
`,
    'should execute all steps.'
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
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = './test/fixtures/dummy-cc-reporter.sh';
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
      `echo 'coverage ok'`,
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
    // prettier-ignore
    `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
[command]${DEFAULT_WORKDIR}/test.sh before-build\nbefore-build
::debug::✅ CC Reporter before-build checkin completed...
[command]${DEFAULT_ECHO} \'coverage ok\'
\'coverage ok\'
::debug::✅ Coverage run completed...
[command]${DEFAULT_WORKDIR}/test.sh after-build --exit-code 0
after-build --exit-code 0
::debug::✅ CC Reporter after-build checkin completed!
`,
    'should execute all steps (except verification).'
  );
  unlinkSync(filePath);
  nock.cleanAll();
  t.end();
});

test('🧪 run() should run the CC reporter without a coverage command.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = './test/fixtures/dummy-cc-reporter.sh';
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.sha256.sig`;
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
    // prettier-ignore
    `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
::debug::ℹ️ Verifying CC Reporter checksum...
::debug::✅ CC Reported checksum verification completed...
::debug::ℹ️ Verifying CC Reporter GPG signature...
::debug::✅ CC Reported GPG signature verification completed...
[command]${DEFAULT_WORKDIR}/test.sh before-build\nbefore-build
::debug::✅ CC Reporter before-build checkin completed...
ℹ️ 'coverageCommand' not set, so skipping building coverage report!
[command]${DEFAULT_WORKDIR}/test.sh after-build --exit-code 0
after-build --exit-code 0
::debug::✅ CC Reporter after-build checkin completed!
`,
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
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = './test/fixtures/dummy-cc-reporter.sh';
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.sha256.sig`;
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

  sandbox.stub(utils, 'verifySignature').resolves(true);

  const filePattern = `${DEFAULT_WORKDIR}/*.lcov:lcov`;
  const fileA = 'file-a.lcov';
  const fileB = 'file-b.lcov';

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

  t.deepEquals(
    (glob.create as unknown as sinon.SinonSpy).firstCall.firstArg,
    `${DEFAULT_WORKDIR}/*.lcov`,
    'should create a globber with given pattern.'
  );
  t.true(
    globSpy.calledOnceWithExactly(),
    'should get the paths of the files from the newly created globber instance.'
  );
  t.equal(
    capturedOutput,
    // prettier-ignore
    `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
::debug::ℹ️ Verifying CC Reporter checksum...
::debug::✅ CC Reported checksum verification completed...
::debug::ℹ️ Verifying CC Reporter GPG signature...
::debug::✅ CC Reported GPG signature verification completed...
[command]${DEFAULT_WORKDIR}/test.sh before-build
before-build
::debug::✅ CC Reporter before-build checkin completed...
ℹ️ 'coverageCommand' not set, so skipping building coverage report!
::debug::Parsing 2 coverage location(s) — ${DEFAULT_WORKDIR}/file-a.lcov:lcov,${DEFAULT_WORKDIR}/file-b.lcov:lcov (object)
[command]${DEFAULT_WORKDIR}/test.sh format-coverage ${DEFAULT_WORKDIR}/file-a.lcov -t lcov -o codeclimate.0.json
format-coverage ${DEFAULT_WORKDIR}/file-a.lcov -t lcov -o codeclimate.0.json
[command]${DEFAULT_WORKDIR}/test.sh format-coverage ${DEFAULT_WORKDIR}/file-b.lcov -t lcov -o codeclimate.1.json
format-coverage ${DEFAULT_WORKDIR}/file-b.lcov -t lcov -o codeclimate.1.json
[command]${DEFAULT_WORKDIR}/test.sh sum-coverage codeclimate.0.json codeclimate.1.json -p 2 -o coverage.total.json
sum-coverage codeclimate.0.json codeclimate.1.json -p 2 -o coverage.total.json
[command]${DEFAULT_WORKDIR}/test.sh upload-coverage -i coverage.total.json
upload-coverage -i coverage.total.json
::debug::✅ CC Reporter upload coverage completed!
`,
    'should execute all steps (except running the coverage command).'
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
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = joinPath(
        __dirname,
        './fixtures/dummy-cc-reporter.sh'
      );
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = joinPath(
        __dirname,
        './fixtures/dummy-cc-reporter.sha256'
      );
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = joinPath(
        __dirname,
        './fixtures/dummy-cc-reporter.sha256.sig'
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
      `echo 'coverage ok'`,
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
    // prettier-ignore
    `::debug::Changing working directory to ${CUSTOM_WORKDIR}
::debug::✅ Changing working directory completed...
::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
::debug::ℹ️ Verifying CC Reporter checksum...
::debug::✅ CC Reported checksum verification completed...
::debug::ℹ️ Verifying CC Reporter GPG signature...
::debug::✅ CC Reported GPG signature verification completed...
[command]${CUSTOM_WORKDIR}/test.sh before-build
before-build
::debug::✅ CC Reporter before-build checkin completed...
[command]${DEFAULT_ECHO} 'coverage ok'
'coverage ok'
::debug::✅ Coverage run completed...
[command]${CUSTOM_WORKDIR}/test.sh after-build --exit-code 0
after-build --exit-code 0
::debug::✅ CC Reporter after-build checkin completed!
`,
    'should execute all steps.'
  );
  unlinkSync(filePath);
  nock.cleanAll();
  process.chdir(DEFAULT_WORKDIR);
  t.end();
});

test('🧪 run() should throw an error if run on Windows.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());

  sandbox.stub(os, 'platform').returns('win32');

  const stdHook = hookStd(() => {});

  try {
    await run('http://localhost.test/dummy-cc-reporter', undefined);
    t.fail('should actually throw an error and not succeed');
  } catch (err) {
    t.equal(
      (err as Error).message,
      'CC Reporter is not supported on Windows!',
      'should return the correct error message.'
    );
  } finally {
    stdHook.unhook();
  }

  stdHook.unhook();
  t.end();
});

test('🧪 run() should throw an error if the checksum verification fails.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile =
        './test/fixtures/dummy-cc-reporter-before-build-error.sh';
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
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
    // prettier-ignore
    `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
::debug::ℹ️ Verifying CC Reporter checksum...
::error::CC Reporter checksum does not match!
::error::🚨 CC Reporter checksum verfication failed!
`,
    'should correctly throw the error.'
  );
  unlinkSync(filePath);
  unlinkSync(`${filePath}.sha256`);
  nock.cleanAll();
  t.end();
});

test('🧪 run() should throw an error if the GPG signature verification fails.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile =
        './test/fixtures/dummy-cc-reporter-before-build-error.sh';
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter-before-build-error.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.sha256.sig`;
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
    // prettier-ignore
    `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
::debug::ℹ️ Verifying CC Reporter checksum...
::debug::✅ CC Reported checksum verification completed...
::debug::ℹ️ Verifying CC Reporter GPG signature...
::error::CC Reporter GPG signature is invalid!
::error::🚨 CC Reporter GPG signature verfication failed!
`,
    'should correctly throw the error.'
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
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile =
        './test/fixtures/dummy-cc-reporter-before-build-error.sh';
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter-before-build-error.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.sha256.sig`;
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

  sandbox.stub(utils, 'verifySignature').resolves(true);

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
    // prettier-ignore
    `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
::debug::ℹ️ Verifying CC Reporter checksum...
::debug::✅ CC Reported checksum verification completed...
::debug::ℹ️ Verifying CC Reporter GPG signature...
::debug::✅ CC Reported GPG signature verification completed...
[command]${DEFAULT_WORKDIR}/test.sh before-build
::error::The process '${DEFAULT_WORKDIR}/test.sh' failed with exit code 69
::error::🚨 CC Reporter before-build checkin failed!
`,
    'should correctly throw the error.'
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
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile =
        './test/fixtures/dummy-cc-reporter-after-build-error.sh';
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter-after-build-error.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.sha256.sig`;
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

  sandbox.stub(utils, 'verifySignature').resolves(true);

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
    // prettier-ignore
    `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
::debug::ℹ️ Verifying CC Reporter checksum...
::debug::✅ CC Reported checksum verification completed...
::debug::ℹ️ Verifying CC Reporter GPG signature...
::debug::✅ CC Reported GPG signature verification completed...
[command]${DEFAULT_WORKDIR}/test.sh before-build
::debug::✅ CC Reporter before-build checkin completed...
[command]${DEFAULT_ECHO} 'coverage ok'
'coverage ok'
::debug::✅ Coverage run completed...
[command]${DEFAULT_WORKDIR}/test.sh after-build --exit-code 0
::error::The process '${DEFAULT_WORKDIR}/test.sh' failed with exit code 69
::error::🚨 CC Reporter after-build checkin failed!
`,
    'should correctly throw the error.'
  );
  unlinkSync(filePath);
  unlinkSync(`${filePath}.sha256`);
  unlinkSync(`${filePath}.sha256.sig`);
  unlinkSync('public-key.asc');
  nock.cleanAll();
  t.end();
});

// TODO: @paambaati — Figure out why this test itself passes but why tape fails with exit code 1.
test('🧪 run() should exit cleanly when the coverage command fails.', async (t) => {
  t.plan(1);
  t.teardown(() => sandbox.restore());
  const COVERAGE_COMMAND = 'wololololo'; // Random command that doesn't exist (and so should fail).
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, async () => {
      const dummyReporterFile = './test/fixtures/dummy-cc-reporter.sh';
      const dummyReporter = await readFileAsync(dummyReporterFile);
      return toReadableStream(dummyReporter);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256')
    .reply(200, async () => {
      const checksumFile = `./test/fixtures/dummy-cc-reporter.sha256`;
      const checksum = await readFileAsync(checksumFile);
      return toReadableStream(checksum);
    });

  nock('http://localhost.test')
    .get('/dummy-cc-reporter.sha256.sig')
    .reply(200, async () => {
      const signatureFile = `./test/fixtures/dummy-cc-reporter.sha256.sig`;
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
      // prettier-ignore
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
::debug::ℹ️ Verifying CC Reporter checksum...
::debug::✅ CC Reported checksum verification completed...
::debug::ℹ️ Verifying CC Reporter GPG signature...
::debug::✅ CC Reported GPG signature verification completed...
[command]${DEFAULT_WORKDIR}/test.sh before-build
before-build
::debug::✅ CC Reporter before-build checkin completed...
::error::Unable to locate executable file: ${COVERAGE_COMMAND}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.
::error::🚨 Coverage run failed!
`,
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
