import { sentences, totalCharacters, prepareSentence } from '$lib/corpus';
import type { PageServerLoad } from './$types';

// Only this sentence and the counts cross the SSR/hydration boundary. The full
// corpus and OpenCC stay out of the initial client dependency graph.
export const load: PageServerLoad = () => ({
  initialSentence: prepareSentence(sentences.find(s => s.hanzi === '我想喝一杯茶。') || sentences[40]),
  sentenceCount: sentences.length,
  totalCharacters
});
