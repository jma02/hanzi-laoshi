import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

test('the initial route graph excludes the corpus and stays below 200 KB', () => {
  const root = new URL('../.svelte-kit/output/client/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('.vite/manifest.json', root), 'utf8'));
  const loaded = new Set();
  function visit(key) {
    if (loaded.has(key)) return;
    loaded.add(key);
    for (const dependency of manifest[key].imports ?? []) visit(dependency);
  }
  // SvelteKit loads the layout, error fallback and page during startup; include
  // those roots, but not application imports that require a user action.
  const roots = ['entry/start', 'entry/app', 'nodes/0', 'nodes/1', 'nodes/2'];
  for (const name of roots) {
    const key = Object.keys(manifest).find(key => manifest[key].name === name);
    assert.ok(key, `Missing hydration root: ${name}`);
    visit(key);
  }
  assert.ok(manifest['src/lib/corpus.ts']?.isDynamicEntry);
  assert.ok(!loaded.has('src/lib/corpus.ts'), 'Corpus must not be a static dependency of hydration');
  const buffers = [...loaded].map(key => readFileSync(new URL(manifest[key].file, root)));
  const bytes = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const gzip = buffers.reduce((sum, buffer) => sum + gzipSync(buffer).length, 0);
  console.log(`Initial route JS: ${bytes} bytes; ${gzip} bytes gzip (${buffers.length} files)`);
  assert.ok(bytes < 200_000, `Initial route JS exceeds 200 KB: ${bytes}`);
});
