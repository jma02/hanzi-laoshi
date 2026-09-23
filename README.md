# Hanzi Laoshi

A small, cheerful SvelteKit reading studio for everyday Mandarin. Annotate individual characters, uncover their pinyin, and let the sentences adapt to the characters you miss.

## Run

Node 24+ and npm:

```sh
npm ci
npm run dev
```

```sh
npm run check
npm test
npm run build
node --test tests/worker.test.mjs
```

Svelte 5, SvelteKit, TypeScript, and the Cloudflare adapter. No application database or account system. Progress and preferences use `localStorage` under `hanzi-laoshi:v1`; they stay in one browser and origin. Clearing browser data clears progress.

## Learning behavior

- 440 original sentences across 12 everyday topics, with English and per-character numbered pinyin. Content lives in two JSON files, one sentence per line.
- Simplified by default. OpenCC supplies contextual traditional forms; progress keeps the same simplified-character/reading key across scripts.
- Inputs accept `nǐ`, `ni3`, plain `ni`, and `ü` / `v` / `u:`. An explicit wrong tone remains wrong. Enable tone challenge to require tones.
- Chinese IME composition is not interrupted. Commit one simplified or contextual traditional character in each box. This is labeled recognition, with no pinyin mastery credit, because a committed character cannot prove which tone was typed.
- Reveals and incorrect answers become review signals. Blank checks do not change progress. Each answer is counted once per exercise.
- Selection weights frequent misses and avoids the last 12 completed sentences when alternatives exist. Click a character to focus on it.
- Three consecutive pinyin recalls mark a reading as taking root. Hints reset that run. XP and daily goals reward each distinct sentence once per local calendar day.
- Dictionary tones are displayed. Natural third-tone sandhi, 一 / 不 changes, and erhua may sound different in speech. The sentence bank is original AI-authored learning material, not an official HSK corpus or a substitute for a native-speaker editorial review.

## Mandarin audio

Device speech works when a `zh-CN` voice is installed. Its quality varies; the app identifies it as device speech. It does not claim a neural or Beijing accent.

For fluid Cartesia audio, set `CARTESIA_API_KEY` as a **server secret**. For local development copy `.env.example` to `.dev.vars` and fill the key there. `CARTESIA_VOICE_ID` optionally chooses a voice you have auditioned; otherwise the server discovers an active native `zh-CN` voice. A provider account and usage credits are required.

The server uses Cartesia `sonic-3.6`, API version `2026-08-14`, `locale: zh-CN`, and streams MP3 through `/api/tts?id=<known-sentence-id>`. It accepts only corpus IDs, never arbitrary speech text. Audio is privately cached by the browser for a week. The key is never sent to the client or saved in localStorage. Playback can be slowed without another provider request. Standard Mandarin support does not guarantee a Beijing-specific voice; audition before selecting one.

References: [Cartesia bytes API](https://docs.cartesia.ai/api-reference/tts/bytes), [voice discovery](https://docs.cartesia.ai/api-reference/voices/list).

## Deployment

`npm run build` creates normal `.svelte-kit/cloudflare` output for Cloudflare Workers and a `dist/server` + `dist/client` package for Sites. The Sites entry serves SvelteKit and assets without the default Workers cache, which Sites does not permit. Browser cache headers remain intact. A regression test checks the built worker with Cache API access disabled. Set production secrets with the hosting platform, never in source control.

The published Site starts private. Before offering public access to a paid TTS endpoint, add account-level quotas and abuse protection appropriate to the audience.

## Structure

- `src/lib/pinyin.ts` — input normalization and tone display
- `src/lib/progress.ts` — progress schema and adaptive selection
- `src/lib/corpus.ts` — sentence and script handling
- `src/lib/components/` — practice, collection, companion, audio
- `src/routes/api/tts/` — server-only Cartesia integration
- `tests/learning.test.ts` — grading, corpus integrity, review behavior, persistence

UI event handlers stay close to the component they serve; shared functions have multiple callers. The red panda mascot was generated for this project.
