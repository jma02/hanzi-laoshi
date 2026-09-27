import daily from './data/daily.json';
import world from './data/world.json';
import * as OpenCC from 'opencc-js/cn2t';
import { hanziPattern, type Sentence, type PracticeSentence } from './sentence';

export type { Sentence } from './sentence';
export const sentences: Sentence[] = [...daily, ...world];
export const traditional = OpenCC.Converter({ from: 'cn', to: 'tw' });
export const categories = [...new Set(sentences.map(s => s.category))];
export const totalCharacters = new Set(sentences.flatMap(s => [...s.hanzi].filter(c => hanziPattern.test(c)))).size;

export function prepareSentence(sentence: Sentence): PracticeSentence {
  return { ...sentence, traditionalHanzi: traditional(sentence.hanzi) };
}
