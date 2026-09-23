import { cp, mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';

// Keep the ordinary SvelteKit Cloudflare output, and prepare the Sites layout.
await rm('dist', { recursive: true, force: true });
await mkdir('dist/server', { recursive: true });
await cp('.svelte-kit/cloudflare', 'dist/client', { recursive: true });
await rm('dist/client/_worker.js');
await build({
  entryPoints: ['.svelte-kit/cloudflare/_worker.js'], outfile: 'dist/server/index.js',
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022',
  external: ['cloudflare:*', 'node:*'], conditions: ['workerd', 'worker', 'browser']
});
