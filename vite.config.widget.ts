import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		svelte({
			emitCss: false,
			compilerOptions: {
				css: 'injected'
			}
		})
	],
	build: {
		lib: {
			entry: 'src/lib/widget/mount.ts',
			formats: ['iife'],
			name: 'DoublejWidget',
			fileName: () => 'widget.js'
		},
		outDir: 'dist',
		emptyOutDir: false
	}
});
