import { platform } from 'node:os';
import { pathToFileURL } from 'node:url';
import { assert } from '@japa/assert';
import { configure, processCLIArgs, run } from '@japa/runner';

processCLIArgs(process.argv.splice(2));
configure({
	suites: [
		{
			name: 'unit',
			files: ['test/unit/**/*.test.ts'],
		},
		{
			name: 'integration',
			files: ['test/integration/**/*.test.ts'],
		},
	],
	plugins: [assert()],
	importer: (filePath) => {
		return platform() === 'win32'
			? import(pathToFileURL(filePath.toString()).href)
			: import(filePath.toString());
	},
});

await run();
