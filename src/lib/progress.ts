import type { Sentence } from './corpus';
export type CharacterProgress = { correct: number; missed: number; recognition: number; run: number; last: number };
export type Progress = { version: 1; xp: number; characters: Record<string, CharacterProgress>; days: Record<string, string[]>; recent: string[] };
export type Settings = { traditional: boolean; translation: boolean; strict: boolean };
export const storageKey = 'hanzi-laoshi:v1';
export const freshProgress: Progress = { version: 1, xp: 0, characters: {}, days: {}, recent: [] };
export const defaultSettings: Settings = { traditional: false, translation: true, strict: false };

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function recordCharacter(progress: Progress, char: string, pinyin: string, result: 'correct' | 'missed' | 'recognition') {
  const key = `${char}:${pinyin}`;
  const previous = progress.characters[key] ?? { correct: 0, missed: 0, recognition: 0, run: 0, last: 0 };
  progress.characters[key] = { ...previous, [result]: previous[result] + 1, run: result === 'correct' ? previous.run + 1 : result === 'missed' ? 0 : previous.run, last: Date.now() };
}

export function chooseSentence(pool: Sentence[], progress: Progress, focus = '', random = Math.random) {
  const focused = focus ? pool.filter(s => s.hanzi.includes(focus)) : pool;
  const available = focused.length ? focused : pool;
  const unseen = available.filter(s => !progress.recent.slice(-12).includes(s.id));
  const candidates = unseen.length ? unseen : available;
  const weights = candidates.map(sentence => {
    let index = 0;
    const difficulty = [...sentence.hanzi].filter(c => /\p{Script=Han}/u.test(c)).map(char => {
      const stat = progress.characters[`${char}:${sentence.pinyin[index++]}`];
      return stat ? Math.max(0, stat.missed * 2 - stat.run * 1.5) / (stat.correct + stat.missed + 1) : 0.15;
    });
    return 1 + difficulty.reduce((sum, n) => sum + n, 0) * 3;
  });
  let draw = random() * weights.reduce((sum, n) => sum + n, 0);
  return candidates.find((_, i) => (draw -= weights[i]) < 0) ?? candidates[0];
}

export function restoreProgress(raw: string | null): { progress: Progress; settings: Settings } {
  const saved = raw ? JSON.parse(raw) : null;
  if (!saved || saved.progress?.version !== 1) return { progress: structuredClone(freshProgress), settings: { ...defaultSettings } };
  const progress = saved.progress;
  if (!Number.isFinite(progress.xp) || progress.xp < 0 || !Array.isArray(progress.recent) || !progress.days || !progress.characters) throw new Error('Invalid progress');
  for (const entry of Object.values(progress.characters) as CharacterProgress[]) {
    if (![entry.correct, entry.missed, entry.recognition, entry.run, entry.last].every(n => Number.isFinite(n) && n >= 0)) throw new Error('Invalid character history');
  }
  if (!Object.values(progress.days).every(ids => Array.isArray(ids) && ids.every(id => typeof id === 'string'))) throw new Error('Invalid daily history');
  const settings = { ...defaultSettings };
  for (const key of Object.keys(settings) as (keyof Settings)[]) if (typeof saved.settings?.[key] === 'boolean') settings[key] = saved.settings[key];
  return { progress, settings };
}
