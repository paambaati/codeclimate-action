import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/main.ts'],
	target: 'node20',
	format: ['esm'],
	outExtension() {
		return {
			js: '.mjs',
		};
	},
	outDir: 'lib/',
	dts: false,
	sourcemap: false,
	clean: true,
});
