import { Server } from '../.svelte-kit/output/server/index.js';
import { manifest, prerendered, base_path } from '../.svelte-kit/cloudflare-tmp/manifest.js';

// Sites does not expose the default Workers cache. Serve through SvelteKit and
// the asset binding directly; browser Cache-Control headers still work normally.
const server = new Server(manifest);
let initialized;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    initialized ??= server.init({
      env,
      read: async file => {
        const response = await env.ASSETS.fetch(new URL(file, url.origin));
        if (!response.ok) throw new Error(`Unable to read asset: ${file}`);
        return response.body;
      }
    });
    await initialized;

    let pathname = url.pathname;
    try { pathname = decodeURIComponent(pathname); } catch { /* Let SvelteKit handle malformed paths. */ }
    const stripped = pathname.replace(/\/$/, '');
    const filename = stripped.slice(base_path.length + 1);
    const isAsset = manifest.assets.has(filename) || manifest.assets.has(`${filename}/index.html`)
      || filename in manifest._.server_assets || `${filename}/index.html` in manifest._.server_assets;
    if (isAsset || prerendered.has(pathname) || pathname === `/${manifest.appPath}/version.json`
      || pathname.startsWith(`/${manifest.appPath}/immutable/`)) {
      return env.ASSETS.fetch(request);
    }

    const redirect = pathname.endsWith('/') ? stripped : `${pathname}/`;
    if (redirect && prerendered.has(redirect)) {
      return new Response(null, { status: 308, headers: { location: redirect + url.search } });
    }
    return server.respond(request, {
      platform: { env, ctx, context: ctx, cf: request.cf },
      getClientAddress: () => request.headers.get('cf-connecting-ip') || '0.0.0.0'
    });
  }
};
