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

<section class="practice-card">
  <div class="card-top"><span class="eyebrow">YOUR NEXT LITTLE DISCOVERY</span><span class="topic-pill">{sentence.category} <span>·</span> {sentence.level === 1 ? 'Beginner' : sentence.level === 2 ? 'Growing' : 'Stretch'}</span></div>
  <div class="exercise-heading"><div><h2>One sentence. A little closer.</h2><p>What do these characters say? Give each one its pinyin.</p></div></div>
  <div class="sentence-tools"><AudioPlayer {sentence}/><span class="sentence-count">{answerCount} characters</span></div>
  {#if focus}<div class="focus-note"><Icon name="repeat" size={15}/> A little extra practice with <strong lang="zh">{focus}</strong></div>{/if}
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
                if (event.key === '?' || event.key === '？') {
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
            {:else}<button type="button" class="reveal" tabindex="-1" aria-label={`Reveal pinyin for ${token.display}`} title="Reveal pinyin (?)" onclick={() => { selected = token.position; reveal(token.position); }}><Icon name="eye" size={13}/> reveal</button>{/if}
          </div>
        {:else}<span class="punctuation">{token.display}</span>{/if}
      {/each}
    </div>
    <p id="pinyin-shortcuts" class="small muted">Tab next · Shift+Tab back · ? reveal &amp; move on</p>
    <span class="sr-only" aria-live="polite">{announcement}</span>
    <div class="translation"><span class="eyebrow">THE MEANING</span>{#if showTranslation}<p>{sentence.english}</p>{:else}<button type="button" class="text-button" onclick={() => { showTranslation = true; }}><Icon name="eye" size={16}/> Show an English hint</button>{/if}</div>
    {#if message}<p class="notice" role="status">{message}</p>{/if}
    <div class="exercise-footer">
      {#if submitted}<div class="result-message" aria-live="polite"><span class="result-icon"><Icon name="check"/></span><div><strong>{correct === answerCount ? 'Beautifully read!' : 'A little more familiar already.'}</strong><span>{correct}/{answerCount} pinyin correct · +{earned} XP{Object.values(results).includes('recognition') ? ' · ◉ character recognized; tone untested' : ''}</span></div></div><button type="button" class="primary" onclick={onnext}>Next sentence <Icon name="arrow" size={18}/></button>
      {:else}<button type="button" class="text-button muted" onclick={() => { for (const token of characters.filter(t => t.pinyin)) reveal(token.position); }}>Reveal all</button><div class="check-action"><span>{filled} / {answerCount} annotated</span><button bind:this={checkButton} class="primary" type="submit">Check my pinyin <Icon name="arrow" size={18}/></button></div>{/if}
    </div>
  </form>
</section>
<div class="below-practice">
  <section class="character-note"><div class="note-character" lang="zh">{active?.display || '字'}</div><div><span class="eyebrow">CHARACTER SPOTLIGHT</span><h3>{active?.char ? ((glosses as Record<string,string>)[active.char] || 'A piece of your sentence') : 'Meet your next character'}</h3>{#if active?.pinyin && results[selected]}<p>{toneMark(active.pinyin)} <span>· meaning changes with context</span></p>{:else}<p>Select a character. Try its sound, then reveal to learn.</p>{/if}</div></section>
  <details class="input-help"><summary><Icon name="help" size={17}/> A little pinyin help</summary><p>Type <b>nǐ</b>, <b>ni3</b>, or <b>ni</b>. Use <b>ü</b>, <b>v</b>, or <b>u:</b>. <b>Tab</b> or Space moves to the next character; <b>Shift+Tab</b> moves back. Type <b>?</b> to reveal the focused character and move on. Chinese keyboards work too: commit one character per box.</p><p>Character input practices recognition; it does not test tones. Reveals count as a character to review. We show dictionary tones; 一, 不, third tones, and 儿 can sound different in natural speech.</p></details>
</div>
