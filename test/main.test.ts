import test from 'tape';
import nock from 'nock';
import toReadableStream from 'to-readable-stream';
import * as intercept from 'intercept-stdout';
import { stat, unlinkSync } from 'fs';
import { downloadToFile, run } from '../src/main';

test('🛠 setup', t => {
  nock.disableNetConnect();
  t.end();
});

test('🧪 downloadToFile() should download the give URL and write to given file location with given mode.', async t => {
  t.plan(1);
  const filePath = './test.sh';
  const mock = await nock('http://localhost.test')
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
  stat(filePath, (err, stats) => {
    if (err) t.fail(err.message);
    t.equal(
      stats.mode,
      33261,
      'downloaded file should exist and have executable permissions.'
    );
    unlinkSync(filePath);
    nock.cleanAll();
    t.end();
  });
});

test('🧪 run() should run the CC reporter (happy path).', async t => {
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
    nock.cleanAll();
    t.fail(err);
  }

  t.equal(
    capturedOutput,
    `##[debug]ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...
##[debug]✅ CC Reporter downloaded...
[command]./test.sh before-build\nbefore-build
##[debug]✅ CC Reporter before-build checkin completed...
[command]echo \'coverage ok\'
\'coverage ok\'
##[debug]✅ Coverage run completed...
[command]./test.sh after-build --exit-code 0
after-build --exit-code 0
##[debug]✅ CC Reporter after-build checkin completed!
`,
    'should execute all steps.'
  );
  unlinkSync(filePath);
  nock.cleanAll();
  t.end();
});

test('💣 teardown', t => {
  nock.restore();
  nock.cleanAll();
  nock.enableNetConnect();
  t.end();
});
