import { json, error } from '@sveltejs/kit';
import { sentences } from '$lib/corpus';
import type { RequestHandler } from './$types';

let nativeVoice: { key: string; id: string } | undefined;

export const GET: RequestHandler = async ({ url, platform, fetch }) => {
  const key = platform?.env?.CARTESIA_API_KEY;
  const id = url.searchParams.get('id');
  if (!id) return json({ available: Boolean(key) });
  if (!key) error(503, 'Cartesia has not been configured.');
  const sentence = sentences.find(s => s.id === id);
  if (!sentence) error(404, 'Sentence not found.');
  const headers = { Authorization: `Bearer ${key}`, 'Cartesia-Version': '2026-08-14', 'Content-Type': 'application/json' };
  let voice = platform?.env?.CARTESIA_VOICE_ID || (nativeVoice?.key === key ? nativeVoice.id : '');
  try {
    if (!voice) {
      const response = await fetch('https://api.cartesia.ai/voices?language=zh-CN&limit=100', { headers, signal: AbortSignal.timeout(12000) });
      if (!response.ok) error(502, 'Could not load Mandarin voices.');
      const result = await response.json() as { data: { id: string; status: string; accents: { locale: string; is_native: boolean }[] }[] };
      voice = result.data.find(v => v.status === 'active' && v.accents?.some(a => a.locale === 'zh-CN' && a.is_native))?.id || '';
      if (!voice) error(503, 'Set CARTESIA_VOICE_ID to a native Mandarin voice.');
      nativeVoice = { key, id: voice };
    }
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST', headers, signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ model_id: 'sonic-3.6', transcript: sentence.hanzi, voice, locale: 'zh-CN', output_format: { container: 'mp3', sample_rate: 44100, bit_rate: 128000 }, generation_config: { speed: 1 } })
    });
    if (!response.ok) error(502, 'Mandarin audio could not be generated.');
    return new Response(response.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=604800', 'X-Content-Type-Options': 'nosniff' } });
  } catch (cause) {
    if (cause && typeof cause === 'object' && 'status' in cause) throw cause;
    error(502, 'The voice service is temporarily unavailable.');
  }
};
