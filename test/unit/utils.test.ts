import { stat as statCallback, unlinkSync } from 'node:fs';
import { platform } from 'node:os';
import { promisify } from 'node:util';
import { test } from '@japa/runner';
import intoStream from 'into-stream';
import nock from 'nock';
import {
	areObjectsEqual,
	downloadToFile,
	parsePathAndFormat,
} from '../../src/utils.js';

const stat = promisify(statCallback);

test.group('⚒️ utils tests', (group) => {
	group.setup(() => {
		nock.disableNetConnect();
		if (!nock.isActive()) nock.activate();
	});

	group.teardown(() => {
		nock.restore();
		nock.cleanAll();
		nock.enableNetConnect();
		if (process.exitCode === 1) process.exitCode = 0; // This is required because @actions/core `setFailed` sets the exit code to 1 when we're testing errors.
	});

	test('🧪 areObjectsEqual() should correctly check object equality', ({
		assert,
	}) => {
		assert.plan(1);
		const obj1 = {
			a: 1,
			b: true,
			c: null,
			d: undefined,
			45: -45.223232323,
		};
		assert.ok(
			areObjectsEqual(obj1, { ...obj1 }),
			'objects should be compared correctly.',
		);
	});

	test('🧪 downloadToFile() should download the give URL and write to given file location with given mode.', async ({
		assert,
	}) => {
		assert.plan(1);
		const filePath = './test.sh';
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, () => {
				return intoStream(`#!/bin/bash
	echo "hello"
	`);
			});
		await downloadToFile(
			'http://localhost.test/dummy-cc-reporter',
			filePath,
			0o777,
		);
		const stats = await stat(filePath);
		assert.equal(
			stats.mode,
			platform() === 'win32' ? 33206 : 33261,
			'downloaded file should exist and have executable permissions on valid platforms.',
		);
		unlinkSync(filePath);
		nock.cleanAll();
	});

	test('🧪 parsePathAndFormat() should correctly parse path patterns and formats correctly on Windows.', async ({
		assert,
	}) => {
		assert.plan(1);
		const fixture =
			'C:\\Users\\gp\\Projects\\codeclimate-action\\test\\*.lcov:lcov' as const;
		const expected = {
			format: 'lcov',
			pattern: 'C:\\Users\\gp\\Projects\\codeclimate-action\\test\\*.lcov',
		};
		const result = parsePathAndFormat(fixture);
		assert.strictEqual(
			result,
			expected,
			'path patterns and formats should be correctly parsed on Windows',
		);
	}).skip(
		platform() !== 'win32',
		`Skipping because this test is only for Windows, but the current OS is ${platform()}`,
	);

	test('🧪 parsePathAndFormat() should correctly parse path patterns and formats correctly on macOS.', async ({
		assert,
	}) => {
		assert.plan(1);
		const fixture =
			'/Users/gp/Projects/codeclimate-action/test/*.lcov:lcov' as const;
		const expected = {
			format: 'lcov',
			pattern: '/Users/gp/Projects/codeclimate-action/test/*.lcov',
		};
		const result = parsePathAndFormat(fixture);
		assert.deepEqual(
			result,
			expected,
			'path patterns and formats should be correctly parsed on macOS',
		);
	}).skip(
		platform() !== 'darwin',
		`Skipping because this test is only for macOS, but the current OS is ${platform()}`,
	);

	test('🧪 parsePathAndFormat() should correctly parse path patterns and formats correctly on Linux.', async ({
		assert,
	}) => {
		assert.plan(1);
		const fixture =
			'/home/gp/Projects/codeclimate-action/test/*.lcov:lcov' as const;
		const expected = {
			format: 'lcov',
			pattern: '/home/gp/Projects/codeclimate-action/test/*.lcov',
		};
		const result = parsePathAndFormat(fixture);
		assert.deepEqual(
			result,
			expected,
			'path patterns and formats should be correctly parsed on Linux',
		);
	}).skip(
		platform() !== 'linux',
		`Skipping because this test is only for Linux, but the current OS is ${platform()}`,
	);
});
