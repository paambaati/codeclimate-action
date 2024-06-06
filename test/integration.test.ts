import { unlinkSync } from 'node:fs';
import { EOL, arch, platform } from 'node:os';
import { hookStd } from 'hook-std';
import t from 'tap';
import {
	DOWNLOAD_URL,
	EXECUTABLE,
	FILE_ARTIFACTS,
	downloadAndRecord,
	verifyChecksumAndSignature,
} from '../src/main.js';

t.test(
	'🧪 verifyChecksumAndSignature() should download the CC reporter and pass all validations (happy path).',
	{
		skip:
			platform() === 'darwin' && arch() === 'arm64'
				? 'Skipping because the CC reporter is not available on macOS Apple Silicon!'
				: false,
	},
	async (t) => {
		t.plan(1);
		let capturedOutput = '';
		const stdHook = hookStd((text: string) => {
			capturedOutput += text;
		});

		try {
			await downloadAndRecord(DOWNLOAD_URL, EXECUTABLE);
			await verifyChecksumAndSignature(DOWNLOAD_URL, EXECUTABLE);
			stdHook.unhook();
		} catch (err) {
			stdHook.unhook();
			t.fail({ error: err });
		} finally {
			for (const artifact of FILE_ARTIFACTS) {
				try {
					unlinkSync(artifact);
				} catch {}
			}
		}

		t.equal(
			capturedOutput,
			[
				'::debug::ℹ️ Verifying CC Reporter checksum...',
				'::debug::✅ CC Reported checksum verification completed...',
				'::debug::ℹ️ Verifying CC Reporter GPG signature...',
				'::debug::✅ CC Reported GPG signature verification completed...',
				'',
			].join(EOL),
			'should download the reporter and correctly pass checksum and signature verification steps.',
		);
		t.end();
	},
);
