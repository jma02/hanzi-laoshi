import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gradePinyin, toneMark } from '../src/lib/pinyin.ts';
import { chooseSentence, freshProgress, recordCharacter, restoreProgress } from '../src/lib/progress.ts';

const corpus = ['daily', 'world'].flatMap(name => JSON.parse(readFileSync(new URL(`../src/lib/data/${name}.json`, import.meta.url), 'utf8')));

test('accepts tone marks, numbers, neutral tones, and keyboard alternatives', () => {
  for (const input of ['nǐ', 'ni3', 'NI3', ' ni3 ']) assert.ok(gradePinyin(input, 'ni3', true));
  for (const input of ['lü4', 'lv4', 'lu:4', 'lǜ']) assert.ok(gradePinyin(input, 'lv4', true));
  assert.ok(gradePinyin('de0 ', 'de5', true));
  assert.ok(gradePinyin('ni', 'ni3', false));
  assert.equal(gradePinyin('ni', 'ni3', true), false);
  for (const input of ['ni2', 'nǐ4', 'ni33', 'nǐǐ', 'n i3', '你']) assert.equal(gradePinyin(input, 'ni3', false), false);
  assert.equal(toneMark('xue2'), 'xué'); assert.equal(toneMark('shui3'), 'shuǐ'); assert.equal(toneMark('liu2'), 'liú');
});

test('corpus has aligned pinyin, unique IDs and sentences, and valid syllables', () => {
  assert.ok(corpus.length >= 400);
  assert.equal(new Set(corpus.map(s => s.id)).size, corpus.length);
  assert.equal(new Set(corpus.map(s => s.hanzi)).size, corpus.length);
  for (const sentence of corpus) {
    assert.equal([...sentence.hanzi].filter(c => /\p{Script=Han}/u.test(c)).length, sentence.pinyin.length, sentence.id);
    for (const pinyin of sentence.pinyin) assert.match(pinyin, /^[a-zü]+[1-5]$/u, sentence.id);
    assert.ok(sentence.english && sentence.category);
  }
});

test('reveals reset recall streak; recognition does not imply pinyin mastery', () => {
  const progress = structuredClone(freshProgress);
  for (let i = 0; i < 3; i++) recordCharacter(progress, '好', 'hao3', 'correct');
  recordCharacter(progress, '好', 'hao3', 'recognition');
  assert.equal(progress.characters['好:hao3'].run, 3);
  recordCharacter(progress, '好', 'hao3', 'missed');
  assert.equal(progress.characters['好:hao3'].run, 0);
  recordCharacter(progress, '好', 'hao4', 'missed');
  assert.equal(progress.characters['好:hao3'].missed, 1);
  assert.equal(progress.characters['好:hao4'].missed, 1);
});

test('adaptive selection favors errors, excludes recent sentences, and honors focus', () => {
  const pool = [{ id: 'a', hanzi: '你', pinyin: ['ni3'] }, { id: 'b', hanzi: '我', pinyin: ['wo3'] }].map(s => ({ ...s, category: 'Test', level: 1, english: 'Test' }));
  const progress = structuredClone(freshProgress);
  for (let i = 0; i < 8; i++) recordCharacter(progress, '我', 'wo3', 'missed');
  assert.equal(chooseSentence(pool, progress, '', () => 0.3).id, 'b');
  progress.recent = ['b']; assert.equal(chooseSentence(pool, progress, '', () => 0.9).id, 'a');
  assert.equal(chooseSentence(pool, progress, '我', () => 0).id, 'b');
});

test('saved progress round-trips and corrupted histories are rejected', () => {
  const progress = structuredClone(freshProgress);
  recordCharacter(progress, '你', 'ni3', 'missed');
  const raw = JSON.stringify({ progress, settings: { strict: true, traditional: 'false' } });
  const saved = restoreProgress(raw);
  assert.equal(saved.progress.characters['你:ni3'].missed, 1);
  assert.equal(saved.settings.strict, true); assert.equal(saved.settings.traditional, false);
  assert.throws(() => restoreProgress('{broken'));
  assert.throws(() => restoreProgress(JSON.stringify({ progress: { ...progress, xp: -1 } })));
});
