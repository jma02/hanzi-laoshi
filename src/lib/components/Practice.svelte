<script lang="ts">
  import { tick } from 'svelte';
  import { tokens, type Sentence } from '$lib/corpus';
  import { toneMark, gradePinyin } from '$lib/pinyin';
  import { recordCharacter, dateKey, type Progress, type Settings } from '$lib/progress';
  import glosses from '$lib/data/glosses.json';
  import Icon from './Icon.svelte';
  import AudioPlayer from './AudioPlayer.svelte';
  export let sentence: Sentence;
  export let progress: Progress;
  export let settings: Settings;
  export let onnext: () => void;
  export let focus = '';
  let values: Record<number, string> = {}, results: Record<number, string> = {};
  let selected = 0, submitted = false, message = '', earned = 0, showTranslation = settings.translation;
  let inputs: (HTMLInputElement | undefined)[] = [];
  let checkButton: HTMLButtonElement | undefined;
  let announcement = '';
  let composing = false;
  $: characters = tokens(sentence, settings.traditional);
  $: answerCount = characters.filter(t => t.pinyin).length;
  $: filled = Object.values(values).filter(v => v.trim()).length;
  $: active = characters[selected];
  $: correct = Object.values(results).filter(r => r === 'correct').length;
  $: showTranslation = settings.translation;

  function reveal(position: number) {
    if (results[position] || submitted) return;
    const token = characters[position];
    results[position] = 'revealed'; values[position] = toneMark(token.pinyin);
    announcement = `${token.display}: ${toneMark(token.pinyin)}`;
    recordCharacter(progress, token.char, token.pinyin, 'missed'); progress = { ...progress };
  }

  async function nextField(position: number) {
    const next = characters.find(t => t.position > position && t.pinyin && !results[t.position]);
    await tick();
    if (next) { selected = next.position; inputs[next.position]?.focus(); }
    else checkButton?.focus();
  }

  function check() {
    if (submitted || composing) return;
    if (characters.some(t => t.pinyin && !values[t.position]?.trim())) { message = 'Add pinyin to each character, or reveal the ones you’re learning.'; return; }
    message = '';
    for (const token of characters.filter(t => t.pinyin && !results[t.position])) {
      const value = values[token.position].trim();
      const recognized = value === token.char || value === token.traditional;
      const result = recognized ? 'recognition' : gradePinyin(value, token.pinyin, settings.strict) ? 'correct' : 'missed';
      results[token.position] = result;
      recordCharacter(progress, token.char, token.pinyin, result);
    }
    const day = dateKey();
    if (!(progress.days[day] ?? []).includes(sentence.id)) {
      earned = 5 + Object.values(results).filter(r => r === 'correct').length * 3;
      progress.xp += earned; progress.days[day] = [...(progress.days[day] ?? []), sentence.id];
    }
    progress.recent = [...progress.recent, sentence.id].slice(-40);
    progress = { ...progress }; submitted = true; showTranslation = true;
  }
</script>

<section class="practice-card" class:finished={submitted}>
  <div class="card-top"><div class="lesson-label"><h1>看汉字，写拼音 <span>Read &amp; annotate</span></h1></div><span class="topic-pill">{sentence.category} <span>·</span> {sentence.level === 1 ? 'Beginner' : sentence.level === 2 ? 'Growing' : 'Stretch'}</span></div>
  <div class="exercise-heading"><p><b>题目 / Sentence {sentence.id}</b>　请填写下列汉字的拼音。</p><span class:complete={submitted}>{submitted ? '[已提交 / Checked]' : '[答题中 / In progress]'}</span></div>
  <div class="sentence-tools"><AudioPlayer {sentence}/><span class="sentence-count">{answerCount} characters</span></div>
  {#if focus}<div class="focus-note"><Icon name="repeat" size={15}/> 重点复习 / Focus character: <strong lang="zh">{focus}</strong></div>{/if}
  <form onsubmit={event => { event.preventDefault(); check(); }}>
    <div class="character-line" lang={settings.traditional ? 'zh-Hant' : 'zh-Hans'}>
      {#each characters as token}
        {#if token.pinyin}
          <div class:active={selected === token.position && !submitted} class="character-tile {results[token.position] || ''}">
            <button type="button" class="hanzi" tabindex={submitted ? 0 : -1} aria-label={`Select character ${token.display}`} onclick={() => { selected = token.position; inputs[token.position]?.focus(); }}>{token.display}</button>
            <input bind:this={inputs[token.position]} bind:value={values[token.position]} aria-label={`Pinyin for ${token.display}, character ${token.position + 1}`} aria-describedby="pinyin-shortcuts" aria-keyshortcuts="?" placeholder="pinyin" autocomplete="off" autocapitalize="none" spellcheck={false} disabled={Boolean(results[token.position]) || submitted}
              onfocus={() => { selected = token.position; }} oncompositionstart={() => { composing = true; }}
              oncompositionend={() => { composing = false; }}
              onkeydown={event => {
                if (event.isComposing || composing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey) return;
                if (event.key === 'Backspace' && event.currentTarget.value === '') {
                  event.preventDefault();
                  if (event.repeat) return;
                  const previous = characters.slice(0, token.position).reverse().find(t => t.pinyin && !results[t.position]);
                  const input = previous && inputs[previous.position];
                  if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
                } else if (event.key === '?' || event.key === '？') {
                  event.preventDefault();
                  if (event.repeat) return;
                  reveal(token.position); nextField(token.position);
                } else if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (token.position === characters.filter(t => t.pinyin).at(-1)?.position) check();
                  else nextField(token.position);
                }
              }}/>
            {#if results[token.position]}<span class="answer-label">{toneMark(token.pinyin)} {results[token.position] === 'correct' ? '✓' : results[token.position] === 'recognition' ? '◉' : '↺'}</span>
            {:else}<button type="button" class="reveal" tabindex="-1" aria-label={`Reveal pinyin for ${token.display}`} title="Reveal pinyin (?)" onclick={() => { selected = token.position; reveal(token.position); }}>答案 ?</button>{/if}
          </div>
        {:else}<span class="punctuation">{token.display}</span>{/if}
      {/each}
    </div>
    <p id="pinyin-shortcuts" class="small muted">Tab next · Shift+Tab back · Backspace on empty: back · ? reveal &amp; move on</p>
    <span class="sr-only" aria-live="polite">{announcement}</span>
    <div class="translation"><span class="eyebrow"><span lang="zh">参考译文</span> / English translation</span>{#if showTranslation}<p>{sentence.english}</p>{:else}<button type="button" class="text-button" onclick={() => { showTranslation = true; }}><Icon name="eye" size={16}/> 显示译文 / Show English</button>{/if}</div>
    {#if message}<p class="notice" role="status">{message}</p>{/if}
    <div class="exercise-footer">
      {#if submitted}<div class="result-message" aria-live="polite"><span class="result-icon"><Icon name="check"/></span><div><strong>{correct === answerCount ? '全部正确 / All correct' : '已批改 / Answers checked'}</strong><span>{correct}/{answerCount} pinyin correct · +{earned} XP{Object.values(results).includes('recognition') ? ' · ◉ character recognized; tone untested' : ''}</span></div></div><button type="button" class="primary" onclick={onnext}>下一题 / Next »</button>
      {:else}<button type="button" class="text-button muted" onclick={() => { for (const token of characters.filter(t => t.pinyin)) reveal(token.position); }}>显示全部答案 / Reveal all</button><div class="check-action"><span>{filled} / {answerCount} annotated</span><button bind:this={checkButton} class="primary" type="submit">提交答案 / Check</button></div>{/if}
    </div>
  </form>
</section>
<div class="below-practice">
  <section class="character-note"><div class="note-character" lang="zh">{active?.display || '字'}</div><div><span class="eyebrow">单字解释 / Character meaning</span><h3>{active?.char ? ((glosses as Record<string,string>)[active.char] || 'Meaning depends on context') : 'Select a character'}</h3>{#if active?.pinyin && results[selected]}<p>{toneMark(active.pinyin)} <span>· meaning changes with context</span></p>{:else}<p>Click a character to see its meaning. Reveal to check pronunciation.</p>{/if}</div></section>
  <details class="input-help"><summary>输入帮助 / Pinyin &amp; tone rules</summary><p>Type <b>nǐ</b>, <b>ni3</b>, or <b>ni</b>. Use <b>ü</b>, <b>v</b>, or <b>u:</b>. <b>Tab</b> or Space moves to the next character; <b>Shift+Tab</b> moves back. Press <b>Backspace</b> in an empty box to return to the previous editable character. Type <b>?</b> to reveal the focused character and move on. Chinese keyboards work too: commit one character per box.</p><p>Character input practices recognition; it does not test tones. Reveals count as a character to review. We show dictionary tones; 一, 不, third tones, and 儿 can sound different in natural speech.</p></details>
</div>
