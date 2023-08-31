import test from 'tape';
import { unlinkSync } from 'node:fs';
import { EOL, arch, platform } from 'node:os';
import { default as hookStd } from 'hook-std';
import {
  downloadAndRecord,
  verifyChecksumAndSignature,
  DOWNLOAD_URL,
  EXECUTABLE,
  FILE_ARTIFACTS,
} from '../src/main';

test.skip(
  '🧪 verifyChecksumAndSignature() should download the CC reporter and pass all validations (happy path).',
  {
    // NOTE: Skipping integration test because the CC reporter is not available on macOS Apple Silicon!
    skip: platform() === 'darwin' && arch() === 'arm64',
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
      t.fail(err);
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
        `::debug::ℹ️ Verifying CC Reporter checksum...`,
        `::debug::✅ CC Reported checksum verification completed...`,
        `::debug::ℹ️ Verifying CC Reporter GPG signature...`,
        `::debug::✅ CC Reported GPG signature verification completed...`,
        ``,
      ].join(EOL),
      'should download the reporter and correctly pass checksum and signature verification steps.',
    );
    t.end();
  },
);
