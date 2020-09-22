import test from 'tape';
import nock from 'nock';
import toReadableStream from 'to-readable-stream';
import * as intercept from 'intercept-stdout';
import { stat as statSync, unlinkSync } from 'fs';
import { exec as pExec } from 'child_process';
import { promisify } from 'util';
import { downloadToFile, run } from '../src/main';

const stat = promisify(statSync);

const DEFAULT_WORKDIR = process.cwd();
let DEFAULT_ECHO = '/bin/echo';

test('🛠 setup', (t) => {
  nock.disableNetConnect();
  pExec('which echo', (err, stdout, stderr) => {
    if (err || stderr) t.fail(err?.message || stderr);
    DEFAULT_ECHO = stdout.trim(); // Finds system default `echo`.
    t.end();
  });
});

test('🧪 downloadToFile() should download the give URL and write to given file location with given mode.', async (t) => {
  t.plan(1);
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, () => {
      return toReadableStream(`#!/bin/bash
echo "hello"
`);
    });
  await downloadToFile(
    'http://localhost.test/dummy-cc-reporter',
    filePath,
    0o777
  );
  const stats = await stat(filePath);
  t.equal(
    stats.mode,
    33261,
    'downloaded file should exist and have executable permissions.'
  );
  unlinkSync(filePath);
  nock.cleanAll();
});

test('🧪 run() should run the CC reporter (happy path).', async (t) => {
  t.plan(1);
  const filePath = './test.sh';
  const mock = await nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, () => {
      return toReadableStream(`#!/bin/bash
echo "$*"
`); // Dummy shell script that just echoes back all arguments.
    });

  let capturedOutput = '';
  const unhookIntercept = intercept.default((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      `echo 'coverage ok'`
    );
    unhookIntercept();
  } catch (err) {
    unhookIntercept();
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
    'should execute all steps.'
  );
  unlinkSync(filePath);
  nock.cleanAll();
  t.end();
});

test('🧪 run() should throw an error if the before-build step throws an error.', async (t) => {
  t.plan(1);
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, () => {
      return toReadableStream(`#!/bin/bash
exit 69
`); // Dummy shell script exits with a non-zero code.
    });

  let capturedOutput = '';
  const unhookIntercept = intercept.default((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      `echo 'coverage ok'`
    );
    unhookIntercept();
  } catch (err) {
    unhookIntercept();
    // do nothing else, we expect this run command to fail.
  } finally {
    nock.cleanAll();
  }

  t.equal(
    capturedOutput,
    // prettier-ignore
    `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
[command]/Users/gp/Projects/codeclimate-action/test.sh before-build
::error::Error: The process '/Users/gp/Projects/codeclimate-action/test.sh' failed with exit code 69
::error::🚨 CC Reporter before-build checkin failed!
`,
    'should correctly throw the error.'
  );
  unlinkSync(filePath);
  nock.cleanAll();
  t.end();
});

// TODO: @paambaati — Figure out why this test itself passes but why tape fails with exit code 1.
test('🧪 run() should exit cleanly when the coverage command fails.', async (t) => {
  t.plan(1);
  const COVERAGE_COMMAND = 'wololololo'; // Random command that doesn't exist (and so should fail).
  const filePath = './test.sh';
  const mock = await nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, () => {
      // prettier-ignore
      return toReadableStream(`#!/bin/bash
echo "$*"
`); // Dummy shell script that just echoes back all arguments.
    });

  let capturedOutput = '';
  const unhookIntercept = intercept.default((text: string) => {
    capturedOutput += text;
  });

  try {
    await run(
      'http://localhost.test/dummy-cc-reporter',
      filePath,
      COVERAGE_COMMAND
    );
    unhookIntercept();
    t.fail('Should throw an error.');
  } catch (err) {
    unhookIntercept();
    t.equal(
      capturedOutput,
      // prettier-ignore
      `::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
::debug::✅ CC Reporter downloaded...
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
    nock.cleanAll();
    t.end();
  }
});

test('💣 teardown', (t) => {
  nock.restore();
  nock.cleanAll();
  nock.enableNetConnect();
  if (process.exitCode === 1) process.exitCode = 0; // This is required because @actions/core `setFailed` sets the exit code to 0 when we're testing errors.
  t.end();
});
