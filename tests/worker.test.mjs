import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('built Sites worker serves pages, APIs, and assets without the default cache', async () => {
  const originalCache = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    get() { throw new Error('This Worker is not permitted to access the default cache.'); }
  });
  try {
    const { default: worker } = await import('../dist/server/index.js');
    const assets = [];
    const env = { ASSETS: { fetch: async request => {
      assets.push(new URL(request.url).pathname);
      return new Response(request.method === 'HEAD' ? null : 'asset contents');
    } } };
    const ctx = { waitUntil() {} };
    const page = await worker.fetch(new Request('https://hanzi.test/'), env, ctx);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Hanzi Laoshi/);
    assert.match(html, /Pinyin for/);
    assert.match(html, /440 个日常例句/);
    assert.match(html, /traditionalHanzi/);
    const manifest = JSON.parse(readFileSync(new URL('../.svelte-kit/output/client/.vite/manifest.json', import.meta.url), 'utf8'));
    assert.ok(!html.includes(manifest['src/lib/corpus.ts'].file), 'SSR must not preload the deferred corpus');

    const data = await worker.fetch(new Request('https://hanzi.test/__data.json'), env, ctx);
    assert.equal(data.status, 200);
    const serialized = await data.text();
    assert.match(serialized, /我想喝一杯茶。/);
    assert.match(serialized, /sentenceCount/);
    assert.ok(serialized.length < 2000, 'Hydration data must contain only the starter and counts');

    const status = await worker.fetch(new Request('https://hanzi.test/api/tts'), env, ctx);
    assert.equal(status.status, 200);
    assert.deepEqual(await status.json(), { available: false });

    for (const path of ['/favicon.svg', '/_app/immutable/entry/start.js']) {
      const response = await worker.fetch(new Request(`https://hanzi.test${path}`), env, ctx);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), 'asset contents');
    }
    assert.equal(assets.length, 2);
    const head = await worker.fetch(new Request('https://hanzi.test/favicon.svg', { method: 'HEAD' }), env, ctx);
    assert.equal(await head.text(), '');
    const missing = await worker.fetch(new Request('https://hanzi.test/not-a-route'), env, ctx);
    assert.equal(missing.status, 404);
  } finally {
    if (originalCache) Object.defineProperty(globalThis, 'caches', originalCache);
    else delete globalThis.caches;
  }
});
