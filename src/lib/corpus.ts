import daily from './data/daily.json';
import world from './data/world.json';
import * as OpenCC from 'opencc-js/cn2t';

export type Sentence = { id: string; category: string; level: number; hanzi: string; pinyin: string[]; english: string };
export const sentences: Sentence[] = [...daily, ...world];
export const traditional = OpenCC.Converter({ from: 'cn', to: 'tw' });
export const categories = [...new Set(sentences.map(s => s.category))];
export const hanziPattern = /\p{Script=Han}/u;
export const totalCharacters = new Set(sentences.flatMap(s => [...s.hanzi].filter(c => hanziPattern.test(c)))).size;

export function tokens(sentence: Sentence, useTraditional = false) {
  let index = 0;
  const converted = [...traditional(sentence.hanzi)];
  return [...sentence.hanzi].map((char, position) => ({
    char, traditional: converted[position], display: useTraditional ? converted[position] : char, pinyin: hanziPattern.test(char) ? sentence.pinyin[index++] : '',
    position
  }));
}
