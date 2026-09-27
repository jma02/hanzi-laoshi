export type Sentence = { id: string; category: string; level: number; hanzi: string; pinyin: string[]; english: string };
export type PracticeSentence = Sentence & { traditionalHanzi: string };
export const hanziPattern = /\p{Script=Han}/u;

// Use the contextual conversion supplied with the sentence, including when
// grading Traditional character input in Simplified mode. No dictionary needed.
export function tokens(sentence: PracticeSentence, useTraditional = false) {
  let index = 0;
  const converted = [...sentence.traditionalHanzi];
  return [...sentence.hanzi].map((char, position) => ({
    char, traditional: converted[position], display: useTraditional ? converted[position] : char, pinyin: hanziPattern.test(char) ? sentence.pinyin[index++] : '',
    position
  }));
}
