import {
	readFile,
	realpath as realpathCallback,
	unlinkSync,
	writeFileSync,
} from 'node:fs';
import { default as os, EOL, tmpdir } from 'node:os';
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { context } from '@actions/github';
import * as glob from '@actions/glob';
import { test } from '@japa/runner';
import { hookStd } from 'hook-std';
import intoStream from 'into-stream';
import nock from 'nock';
import sinon from 'sinon';
import which from 'which';
import {
	CODECLIMATE_GPG_PUBLIC_KEY_ID,
	prepareEnv,
	run,
} from '../../src/main.js';
import * as utils from '../../src/utils.js';

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

const __DIRNAME = dirname(fileURLToPath(import.meta.url));

const EXE_PATH_PREFIX =
	PLATFORM === 'win32'
		? 'C:\\Windows\\system32\\cmd.exe /D /S /C'
		: ('' as const);
// NOTE: We have to use `which` because although `echo` is in `/bin/echo` on most *nix systems, on rare occastions, it is in `/usr/bin/echo`.
const ECHO_CMD =
	PLATFORM === 'win32' ? `${EXE_PATH_PREFIX} echo` : which.sync('echo');

const sandbox = sinon.createSandbox();

test.group('🫀 core unit tests', (g) => {
	g.setup(() => {
		nock.disableNetConnect();
		if (!nock.isActive()) nock.activate();
	});

	g.teardown(() => {
		nock.restore();
		nock.cleanAll();
		nock.enableNetConnect();
		if (process.exitCode === 1) process.exitCode = 0; // This is required because @actions/core `setFailed` sets the exit code to 1 when we're testing errors.
	});

	test('🧪 prepareEnv() should return envs as-is in the absence of any GitHub-related variables.', ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const expected = {
			HOME: '/home',
			USER: 'gp',
			PATH: '/usr/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
		};
		sandbox.stub(process, 'env').value(expected);
		const output = prepareEnv();
		assert.deepEqual(output, expected, 'should return envs as-is');
	});

	test('🧪 prepareEnv() should return Git branch correctly when those GitHub-related variables are available.', ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const mockEnv = {
			HOME: '/home',
			USER: 'gp',
			PATH: '/usr/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
			GIT_BRANCH: 'refs/heads/main',
		};
		sandbox.stub(process, 'env').value(mockEnv);
		const expected = {
			...mockEnv,
			GIT_BRANCH: 'main',
		};
		const output = prepareEnv();
		assert.deepEqual(
			output,
			expected,
			'should return correctly updated additional environment variables',
		);
	});

	test('🧪 prepareEnv() should return Git commit SHA and branch correctly when those GitHub-related variables are available.', ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const mockEnv = {
			HOME: '/home',
			USER: 'gp',
			PATH: '/usr/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
			GITHUB_SHA: '89cac89532a27123c44a8fd77c9f8f2ea5c02528',
			GITHUB_REF: 'main',
		};
		sandbox.stub(process, 'env').value(mockEnv);
		const expected = {
			...mockEnv,
			GIT_COMMIT_SHA: '89cac89532a27123c44a8fd77c9f8f2ea5c02528',
			GIT_BRANCH: 'main',
		};
		const output = prepareEnv();
		assert.deepEqual(
			output,
			expected,
			'should return correctly updated additional environment variables',
		);
	});

	test('🧪 prepareEnv() should return Git commit SHA and branch correctly when the relevant GitHub event context is available.', ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const mockEnv = {
			HOME: '/home',
			USER: 'gp',
			PATH: '/usr/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
			GITHUB_EVENT_NAME: 'pull_request',
			GITHUB_HEAD_REF: 'main',
		};
		const mockCommitSHA = '89cac89532a27123c44a8fd77c9f8f2ea5c02528';

		sandbox.stub(process, 'env').value(mockEnv);
		sandbox
			.stub(context, 'payload')
			.value({ pull_request: { head: { sha: mockCommitSHA } } });

		const expected = {
			...mockEnv,
			GIT_COMMIT_SHA: mockCommitSHA,
			GIT_BRANCH: 'main',
		};

		const output = prepareEnv();
		assert.deepEqual(
			output,
			expected,
			'should return correctly updated additional environment variables',
		);
	});

	test('🧪 run() should run the CC reporter (happy path).', async ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const filePath = `./test.${EXE_EXT}`;
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, async () => {
				const dummyReporterFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}`;
				const dummyReporter = await readFileAsync(dummyReporterFile);
				return intoStream(dummyReporter);
			});

		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		try {
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				coverageCommand: `${ECHO_CMD} 'coverage ok'`,
				verifyDownload: 'false',
			});
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			assert.fail((err as Error).message);
		} finally {
			nock.cleanAll();
		}

		const expected = [
			'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
			'::debug::✅ CC Reporter downloaded...',
			PLATFORM === 'win32'
				? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
				: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
			'before-build',
			'::debug::✅ CC Reporter before-build checkin completed...',
			`[command]${ECHO_CMD} 'coverage ok'`,
			`'coverage ok'`,
			'::debug::✅ Coverage run completed...',
			PLATFORM === 'win32'
				? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} after-build --exit-code 0"`
				: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
			'after-build --exit-code 0',
			'::debug::✅ CC Reporter after-build checkin completed!',
			'',
		].join(EOL);
		assert.equal(
			JSON.stringify(capturedOutput),
			JSON.stringify(expected),
			'should execute all steps in happy path.',
		);
		unlinkSync(filePath);
		nock.cleanAll();
	}).pin();

	test('🧪 run() should run the CC reporter without verification if configured.', async ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const filePath = `./test.${EXE_EXT}`;
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, async () => {
				const dummyReporterFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}`;
				const dummyReporter = await readFileAsync(dummyReporterFile);
				return intoStream(dummyReporter);
			});

		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		try {
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				coverageCommand: `${ECHO_CMD} 'coverage ok'`,
				verifyDownload: 'false',
			});
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			assert.fail((err as Error).message);
		} finally {
			nock.cleanAll();
		}

		assert.equal(
			capturedOutput,
			[
				'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
				'::debug::✅ CC Reporter downloaded...',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
					: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
				'before-build',
				'::debug::✅ CC Reporter before-build checkin completed...',
				`[command]${ECHO_CMD} 'coverage ok'`,
				`'coverage ok'`,
				'::debug::✅ Coverage run completed...',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} after-build --exit-code 0"`
					: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
				'after-build --exit-code 0',
				'::debug::✅ CC Reporter after-build checkin completed!',
				'',
			].join(EOL),
			'should execute all steps (except verification).',
		);
		unlinkSync(filePath);
		nock.cleanAll();
	});

	test('🧪 run() should run the CC reporter without a coverage command.', async ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const filePath = `./test.${EXE_EXT}`;
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, async () => {
				const dummyReporterFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}`;
				const dummyReporter = await readFileAsync(dummyReporterFile);
				return intoStream(dummyReporter);
			});

		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		try {
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				verifyDownload: 'false',
			});
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			assert.fail((err as Error).message);
		} finally {
			nock.cleanAll();
		}

		assert.equal(
			capturedOutput,
			[
				'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
				'::debug::✅ CC Reporter downloaded...',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
					: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
				'before-build',
				'::debug::✅ CC Reporter before-build checkin completed...',
				`ℹ️ 'coverageCommand' not set, so skipping building coverage report!`,
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} after-build --exit-code 0"`
					: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
				'after-build --exit-code 0',
				'::debug::✅ CC Reporter after-build checkin completed!',
				'',
			].join(EOL),
			'should execute all steps (except running the coverage command).',
		);
		unlinkSync(filePath);
		nock.cleanAll();
	});

	test('🧪 run() should convert patterns to locations.', async ({
		assert,
		test,
	}) => {
		assert.plan(3);
		test.teardown(() => sandbox.restore());
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
				return intoStream(dummyReporter);
			});

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
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				verifyDownload: 'false',
				coverageLocationsParam: filePattern,
			});
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			assert.fail((err as Error).message);
		} finally {
			nock.cleanAll();
		}

		assert.equal(
			(glob.create as unknown as sinon.SinonSpy).firstCall.firstArg,
			PLATFORM === 'win32'
				? `${DEFAULT_WORKDIR}\\*.lcov`
				: `${DEFAULT_WORKDIR}/*.lcov`,
			'should create a globber with given pattern.',
		);
		assert.ok(
			globSpy.calledOnceWithExactly(),
			'should get the paths of the files from the newly created globber instance.',
		);
		assert.equal(
			capturedOutput,
			[
				'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
				'::debug::✅ CC Reporter downloaded...',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
					: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
				'before-build',
				'::debug::✅ CC Reporter before-build checkin completed...',
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
				'sum-coverage codeclimate.0.json codeclimate.1.json -p 2 -o coverage.total.json',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} upload-coverage -i coverage.total.json"`
					: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} upload-coverage -i coverage.total.json`,
				'upload-coverage -i coverage.total.json',
				'::debug::✅ CC Reporter upload coverage completed!',
				'',
			].join(EOL),
			'should execute all steps (including uploading globbed coverage files).',
		);
		unlinkSync(filePath);
		unlinkSync(fileA);
		unlinkSync(fileB);
		nock.cleanAll();
	}).skip(true, 'Skipping because ES modules cannot be stubbed 😭');

	test('🧪 run() should correctly switch the working directory if given.', async ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const filePath = `./test.${EXE_EXT}`;
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, async () => {
				const dummyReporterFile = joinPath(
					__DIRNAME,
					`../fixtures/dummy-cc-reporter.${EXE_EXT}`,
				);
				const dummyReporter = await readFileAsync(dummyReporterFile);
				return intoStream(dummyReporter);
			});

		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		const CUSTOM_WORKDIR = await realpath(tmpdir());
		try {
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				coverageCommand: `${ECHO_CMD} 'coverage ok'`,
				workingDirectory: CUSTOM_WORKDIR,
				verifyDownload: 'false',
			});
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			assert.fail((err as Error).message);
		} finally {
			nock.cleanAll();
		}

		assert.equal(
			capturedOutput,
			[
				`::debug::Changing working directory to ${CUSTOM_WORKDIR}`,
				'::debug::✅ Changing working directory completed...',
				'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
				'::debug::✅ CC Reporter downloaded...',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} ""${CUSTOM_WORKDIR}\\test.${EXE_EXT}" before-build"`
					: `[command]${CUSTOM_WORKDIR}/test.${EXE_EXT} before-build`,
				'before-build',
				'::debug::✅ CC Reporter before-build checkin completed...',
				`[command]${ECHO_CMD} 'coverage ok'`,
				`'coverage ok'`,
				'::debug::✅ Coverage run completed...',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} ""${CUSTOM_WORKDIR}\\test.${EXE_EXT}" after-build --exit-code 0"`
					: `[command]${CUSTOM_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
				'after-build --exit-code 0',
				'::debug::✅ CC Reporter after-build checkin completed!',
				'',
			].join(EOL),
			'should execute all steps when custom working directory is given.',
		);
		unlinkSync(filePath);
		nock.cleanAll();
		process.chdir(DEFAULT_WORKDIR);
	});

	test('🧪 run() should throw an error if the checksum verification fails.', async ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const filePath = `./test.${EXE_EXT}`;
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, async () => {
				const dummyReporterFile = `./test/fixtures/dummy-cc-reporter-before-build-error.${EXE_EXT}`;
				const dummyReporter = await readFileAsync(dummyReporterFile);
				return intoStream(dummyReporter);
			});

		nock('http://localhost.test')
			.get('/dummy-cc-reporter.sha256')
			.reply(200, () => {
				const dummyChecksum = 'lolno';
				return intoStream(dummyChecksum);
			});

		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		try {
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				coverageCommand: `${ECHO_CMD} 'coverage ok'`,
			});
			assert.fail('should have thrown an error');
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			// do nothing else, we expect this run command to fail.
		} finally {
			nock.cleanAll();
		}

		assert.equal(
			capturedOutput,
			[
				'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
				'::debug::✅ CC Reporter downloaded...',
				'::debug::ℹ️ Verifying CC Reporter checksum...',
				'::error::CC Reporter checksum does not match!',
				'::error::🚨 CC Reporter checksum verfication failed!',
				'',
			].join(EOL),
			'should correctly throw the error if the checksum verification fails.',
		);
		unlinkSync(filePath);
		unlinkSync(`${filePath}.sha256`);
		nock.cleanAll();
	});

	test('🧪 run() should throw an error if the GPG signature verification fails.', async ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const filePath = `./test.${EXE_EXT}`;
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, async () => {
				const dummyReporterFile = `./test/fixtures/dummy-cc-reporter-before-build-error.${EXE_EXT}`;
				const dummyReporter = await readFileAsync(dummyReporterFile);
				return intoStream(dummyReporter);
			});

		nock('http://localhost.test')
			.get('/dummy-cc-reporter.sha256')
			.reply(200, async () => {
				const checksumFile = `./test/fixtures/dummy-cc-reporter-before-build-error.${EXE_EXT}.sha256`;
				const checksum = await readFileAsync(checksumFile);
				return intoStream(checksum);
			});

		nock('http://localhost.test')
			.get('/dummy-cc-reporter.sha256.sig')
			.reply(200, async () => {
				const signatureFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}.sha256.sig`;
				const signature = await readFileAsync(signatureFile);
				return intoStream(signature);
			});

		nock('https://keys.openpgp.org')
			.get(`/vks/v1/by-fingerprint/${CODECLIMATE_GPG_PUBLIC_KEY_ID}`)
			.reply(200, async () => {
				const publicKeyFile =
					'./test/fixtures/9BD9E2DD46DA965A537E5B0A5CBF320243B6FD85.asc';
				const publicKey = await readFileAsync(publicKeyFile);
				return intoStream(publicKey);
			});

		sandbox.stub(utils, 'verifyChecksum').resolves(true);
		sandbox.stub(utils, 'verifySignature').resolves(false);

		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		try {
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				coverageCommand: `${ECHO_CMD} 'coverage ok'`,
			});
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			// do nothing else, we expect this run command to fail.
		} finally {
			nock.cleanAll();
		}

		assert.equal(
			capturedOutput,
			[
				'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
				'::debug::✅ CC Reporter downloaded...',
				'::debug::ℹ️ Verifying CC Reporter checksum...',
				'::debug::✅ CC Reported checksum verification completed...',
				'::debug::ℹ️ Verifying CC Reporter GPG signature...',
				'::error::CC Reporter GPG signature is invalid!',
				'::error::🚨 CC Reporter GPG signature verfication failed!',
				'',
			].join(EOL),
			'should correctly throw the error if the GPG signature verification fails.',
		);
		unlinkSync(filePath);
		unlinkSync(`${filePath}.sha256`);
		unlinkSync(`${filePath}.sha256.sig`);
		unlinkSync('public-key.asc');
		nock.cleanAll();
	}).skip(true, 'Skipping because ES modules cannot be stubbed 😭');

	test('🧪 run() should throw an error if the before-build step throws an error.', async ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const filePath = `./test.${EXE_EXT}`;
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, async () => {
				const dummyReporterFile = `./test/fixtures/dummy-cc-reporter-before-build-error.${EXE_EXT}`;
				const dummyReporter = await readFileAsync(dummyReporterFile);
				return intoStream(dummyReporter);
			});

		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		try {
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				coverageCommand: `${ECHO_CMD} 'coverage ok'`,
				verifyDownload: 'false',
			});
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			// do nothing else, we expect this run command to fail.
		} finally {
			nock.cleanAll();
		}

		assert.equal(
			capturedOutput,
			[
				'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
				'::debug::✅ CC Reporter downloaded...',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
					: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
				PLATFORM === 'win32'
					? `::error::The process '${DEFAULT_WORKDIR}\\test.${EXE_EXT}' failed with exit code 69`
					: `::error::The process '${DEFAULT_WORKDIR}/test.${EXE_EXT}' failed with exit code 69`,
				'::error::🚨 CC Reporter before-build checkin failed!',
				'',
			].join(EOL),
			'should correctly throw the error if the before-build step throws an error.',
		);
		unlinkSync(filePath);
		nock.cleanAll();
	});

	test('🧪 run() should throw an error if the after-build step throws an error.', async ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const filePath = `./test.${EXE_EXT}`;
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, async () => {
				const dummyReporterFile = `./test/fixtures/dummy-cc-reporter-after-build-error.${EXE_EXT}`;
				const dummyReporter = await readFileAsync(dummyReporterFile);
				return intoStream(dummyReporter);
			});

		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		try {
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				coverageCommand: `${ECHO_CMD} 'coverage ok'`,
				verifyDownload: 'false',
			});
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			// do nothing else, we expect this run command to fail.
		} finally {
			nock.cleanAll();
		}

		assert.equal(
			capturedOutput,
			[
				'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
				'::debug::✅ CC Reporter downloaded...',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
					: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
				'::debug::✅ CC Reporter before-build checkin completed...',
				`[command]${ECHO_CMD} 'coverage ok'`,
				`'coverage ok'`,
				'::debug::✅ Coverage run completed...',
				PLATFORM === 'win32'
					? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} after-build --exit-code 0"`
					: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} after-build --exit-code 0`,
				PLATFORM === 'win32'
					? `::error::The process '${DEFAULT_WORKDIR}\\test.${EXE_EXT}' failed with exit code 69`
					: `::error::The process '${DEFAULT_WORKDIR}/test.${EXE_EXT}' failed with exit code 69`,
				'::error::🚨 CC Reporter after-build checkin failed!',
				'',
			].join(EOL),
			'should correctly throw the error if the after-build step throws an error.',
		);
		unlinkSync(filePath);
		nock.cleanAll();
	});

	test('🧪 run() should exit cleanly when the coverage command fails.', async ({
		assert,
		test,
	}) => {
		assert.plan(1);
		test.teardown(() => sandbox.restore());
		const COVERAGE_COMMAND = 'wololololo'; // Random command that doesn't exist (and so should fail).
		const filePath = `./test.${EXE_EXT}`;
		nock('http://localhost.test')
			.get('/dummy-cc-reporter')
			.reply(200, async () => {
				const dummyReporterFile = `./test/fixtures/dummy-cc-reporter.${EXE_EXT}`;
				const dummyReporter = await readFileAsync(dummyReporterFile);
				return intoStream(dummyReporter);
			});

		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		try {
			await run({
				downloadUrl: 'http://localhost.test/dummy-cc-reporter',
				executable: filePath,
				coverageCommand: COVERAGE_COMMAND,
				verifyDownload: 'false',
			});
			stdHook.unhook();
			assert.fail('Should throw an error.');
		} catch (err) {
			stdHook.unhook();
			assert.equal(
				capturedOutput,
				[
					'::debug::ℹ️ Downloading CC Reporter from http://localhost.test/dummy-cc-reporter ...',
					'::debug::✅ CC Reporter downloaded...',
					PLATFORM === 'win32'
						? `[command]${EXE_PATH_PREFIX} "${DEFAULT_WORKDIR}\\test.${EXE_EXT} before-build"`
						: `[command]${DEFAULT_WORKDIR}/test.${EXE_EXT} before-build`,
					'before-build',
					'::debug::✅ CC Reporter before-build checkin completed...',
					PLATFORM === 'win32'
						? `::error::Unable to locate executable file: ${COVERAGE_COMMAND}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`
						: `::error::Unable to locate executable file: ${COVERAGE_COMMAND}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`,
					'::error::🚨 Coverage run failed!',
					'',
				].join(EOL),
				'should fail correctly on wrong/invalid coverage command.',
			);
		} finally {
			unlinkSync(filePath);
			nock.cleanAll();
		}
	});
});
