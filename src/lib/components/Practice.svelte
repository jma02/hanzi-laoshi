<script lang="ts">
  import { tick } from 'svelte';
  import { tokens, type Sentence } from '$lib/corpus';
  import { toneMark, gradePinyin } from '$lib/pinyin';
  import { recordCharacter, dateKey, type Progress, type Settings } from '$lib/progress';
  import glosses from '$lib/data/glosses.json';
  import Icon from './Icon.svelte';
  import AudioPlayer from './AudioPlayer.svelte';
  import CozySprite from './CozySprite.svelte';
  import { topicName } from '$lib/labels';
  export let sentence: Sentence;
  export let progress: Progress;
  export let settings: Settings;
  export let onnext: () => void;
  let values: Record<number, string> = {}, results: Record<number, string> = {};
  let selected = 0, submitted = false, incompleteWarning = false, earned = 0, showTranslation = settings.translation;
  const incompleteLabel = '还有拼音没填，要直接检查吗？ Some answers are blank. Check anyway?';
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
  $: if (filled === answerCount) incompleteWarning = false;

  function reveal(position: number) {
    if (results[position] || submitted) return;
    incompleteWarning = false;
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
    if (!incompleteWarning && characters.some(t => t.pinyin && !values[t.position]?.trim())) {
      incompleteWarning = true; announcement = incompleteLabel;
      return;
    }
    incompleteWarning = false;
    for (const token of characters.filter(t => t.pinyin && !results[t.position])) {
      const value = values[token.position]?.trim() || '';
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

<article class="worksheet">
<section class="practice-card" class:finished={submitted}>
  <header class="worksheet-header">
    <h1>看汉字，写拼音</h1>
    <p lang="en">Write the pinyin above each character.</p>
  </header>
  <div class="sentence-tools">
    <div class="lesson-meta"><span>{topicName(sentence.category)} <small lang="en">{sentence.category}</small></span><span>{sentence.level === 1 ? '入门' : sentence.level === 2 ? '进阶' : '挑战'}</span></div>
    <AudioPlayer {sentence}/>
  </div>

  <form onsubmit={event => { event.preventDefault(); check(); }}>
    <div class="character-line" lang={settings.traditional ? 'zh-Hant' : 'zh-Hans'}>
      {#each characters as token}
        {#if token.pinyin}
          <div class:active={selected === token.position && !submitted} class="character-tile {results[token.position] || ''}">
            <button type="button" class="hanzi" tabindex={submitted ? 0 : -1} aria-label={`Select character ${token.display}`} onclick={() => { selected = token.position; inputs[token.position]?.focus(); }}>{token.display}</button>
            <input bind:this={inputs[token.position]} bind:value={values[token.position]} aria-label={`Pinyin for ${token.display}, character ${token.position + 1}`} aria-describedby="pinyin-shortcuts" aria-keyshortcuts="?" placeholder="pinyin" autocomplete="off" autocapitalize="none" spellcheck={false} disabled={Boolean(results[token.position]) || submitted}
              onfocus={() => { selected = token.position; }} oninput={() => { incompleteWarning = false; announcement = ''; }} oncompositionstart={() => { composing = true; }}
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
                  if (event.repeat) return;
                  if (token.position === characters.filter(t => t.pinyin).at(-1)?.position) check();
                  else nextField(token.position);
                }
              }}/>
            {#if results[token.position]}<span class="answer-label">{toneMark(token.pinyin)} {results[token.position] === 'correct' ? '✓' : results[token.position] === 'recognition' ? '◉' : '↺'}</span>
            {:else}<button type="button" class="reveal" tabindex="-1" aria-label={`Reveal pinyin for ${token.display}`} title="Reveal pinyin (?)" onclick={() => { selected = token.position; reveal(token.position); }}>看答案</button>{/if}
          </div>
        {:else}<span class="punctuation">{token.display}</span>{/if}
      {/each}
    </div>
    <p id="pinyin-shortcuts" class="small muted" lang="en"><kbd>Tab</kbd> next <span>·</span> <kbd>Shift + Tab</kbd> back <span>·</span> <kbd>?</kbd> reveal</p>
    <span class="sr-only" aria-live="polite">{announcement}</span>
    <div class="translation">{#if showTranslation}<span class="meaning-label">释义 <small lang="en">Meaning</small></span><p lang="en">{sentence.english}</p>{:else}<button type="button" class="text-button" onclick={() => { showTranslation = true; }}><Icon name="eye" size={16}/> 看英文释义 <span lang="en">Show English</span></button>{/if}</div>
    <div class="exercise-footer">
      {#if submitted}<div class="result-message" aria-live="polite"><span class="result-icon"><Icon name="check"/></span><div><strong>{correct === answerCount ? '全对了！' : '检查完成'}</strong><span>拼音答对 {correct} / {answerCount} 个 · +{earned} XP{Object.values(results).includes('recognition') ? ' · ◉ 仅识字，未检查声调' : ''}</span><span lang="en">{correct} / {answerCount} pinyin correct{Object.values(results).includes('recognition') ? ' · Character recognized; tone not tested' : ''}</span></div></div><button type="button" class="primary" onclick={onnext}>再练一句 <span lang="en">Next</span></button>
      {:else}<button type="button" class="text-button muted" onclick={() => { for (const token of characters.filter(t => t.pinyin)) reveal(token.position); }}>查看答案 <span lang="en">Reveal all</span></button><div class="check-action" class:incomplete={incompleteWarning}><span>已填 {filled} / {answerCount} 字</span><button bind:this={checkButton} class="primary" class:warning={incompleteWarning} type="submit" aria-describedby={incompleteWarning ? 'incomplete-note' : undefined} onkeydown={event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }}>{incompleteWarning ? '直接检查' : '检查答案'} <span lang="en">{incompleteWarning ? 'Check anyway' : 'Check'}</span></button>{#if incompleteWarning}<small id="incomplete-note">还有拼音没填，空白项会记为答错。<span class="supporting" lang="en">Blank answers count as missed.</span></small>{/if}</div>{/if}
    </div>
  </form>
</section>
<div class="below-practice">
  <section class="character-note" aria-label="Selected character meaning"><div class="note-character" lang="zh">{active?.display || '字'}</div><div><span class="eyebrow">字义 <small lang="en">Character meaning</small></span><h3 lang="en">{active?.char ? ((glosses as Record<string,string>)[active.char] || 'Meaning depends on context') : 'Select a character'}</h3>{#if active?.pinyin && results[selected]}<p>{toneMark(active.pinyin)}</p>{/if}</div><CozySprite kind="tea"/></section>
  <details class="input-help"><summary>拼音怎么输入？ <span lang="en">Pinyin help</span></summary><p>输入 <b>nǐ</b> 或 <b>ni3</b>；关闭声调检查时，也可以输入 <b>ni</b>。输入 ü 时可用 v 或 u:。</p><p lang="en">Type <b>nǐ</b> or <b>ni3</b>; <b>ni</b> also works when tone checking is off. Use <b>ü</b>, <b>v</b>, or <b>u:</b>. <b>Tab</b> or Space moves to the next character; <b>Shift+Tab</b> moves back. Press <b>Backspace</b> in an empty box to return to the previous editable character. Type <b>?</b> to reveal the focused character and move on. Chinese keyboards work too: commit one character per box.</p><p lang="en">Character input practices recognition; it does not test tones. Reveals count as a character to review. We show dictionary tones; 一, 不, third tones, and 儿 can sound different in natural speech.</p></details>
</div>
</article>
