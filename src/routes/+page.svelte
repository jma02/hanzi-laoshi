<script lang="ts">
  import { onMount, tick } from 'svelte';
  import '../styles.css';
  import '../styles/practice.css';
  import '../styles/companion.css';
  import '../styles/collection.css';
  import '../styles/responsive.css';
  import Practice from '$lib/components/Practice.svelte';
  import Collection from '$lib/components/Collection.svelte';
  import Companion from '$lib/components/Companion.svelte';
  import { sentences, totalCharacters, type Sentence } from '$lib/corpus';
  import { freshProgress, defaultSettings, storageKey, restoreProgress, chooseSentence, dateKey } from '$lib/progress';
  let progress = structuredClone(freshProgress), settings = { ...defaultSettings };
  let hydrated = false, storageMessage = '', view = 'practice', settingsOpen = false;
  let sentence = sentences.find(s => s.hanzi === '我想喝一杯茶。') || sentences[40];
  let round = 0, focus = '';
  $: level = Math.floor(progress.xp / 150) + 1;
  $: mastered = Object.values(progress.characters).filter(s => s.run >= 3).length;
  $: streak = (() => { const day = new Date(); let count = 0; if (!progress.days[dateKey(day)]?.length) day.setDate(day.getDate() - 1); while (progress.days[dateKey(day)]?.length) { count++; day.setDate(day.getDate() - 1); } return count; })();
  $: if (hydrated) {
    try { localStorage.setItem(storageKey, JSON.stringify({ progress, settings })); }
    catch { storageMessage = 'Your browser could not save progress. Keep this tab open, or allow local storage.'; }
  }
  onMount(() => {
    try { ({ progress, settings } = restoreProgress(localStorage.getItem(storageKey))); }
    catch { storageMessage = 'Saved progress could not be read. This session starts fresh.'; }
    hydrated = true;
    if (progress.recent.length) startPractice();
    const lifecycle = new AbortController();
    const context = document.modelContext;
    if (context?.registerTool) {
      const tools = [
        { name: 'get_learning_progress', description: 'Read the learner’s saved character results and XP.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => structuredClone(progress) },
        { name: 'start_sentence_practice', description: 'Start a sentence by its corpus ID, or choose adaptive practice. Does not submit answers.', inputSchema: { type: 'object', properties: { sentenceId: { type: 'string' } }, additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input: unknown) => {
          if (!input || typeof input !== 'object' || Object.keys(input).some(key => key !== 'sentenceId')) throw new Error('Expected an optional sentenceId.');
          const id = (input as { sentenceId?: unknown }).sentenceId;
          const chosen = id === undefined ? undefined : sentences.find(s => s.id === id);
          if (id !== undefined && !chosen) throw new Error('Unknown sentence ID.');
          startPractice(chosen); await tick(); return { id: sentence.id, hanzi: sentence.hanzi, status: 'ready' };
        } }
      ];
      for (const tool of tools) {
        try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional browser capability. */ }
      }
    }
    return () => lifecycle.abort();
  });
  function startPractice(pick?: Sentence, char = '') {
    focus = char; sentence = pick || chooseSentence(sentences, progress, char); round++; view = 'practice';
  }
</script>

<svelte:head><title>汉字老师 - 在线拼音练习 | Hanzi Laoshi</title><meta name="description" content="Chinese reading and pinyin practice. 440 sentences, per-character annotations, and adaptive review."/><meta name="theme-color" content="#f3e6d3"/></svelte:head>

<div class="portal">
  <header class="masthead">
    <a class="brand" href="/" aria-label="Hanzi Laoshi home"><strong lang="zh">汉字老师</strong><span>Hanzi Laoshi</span></a>
    <div class="site-description"><span lang="zh">日常汉语 · 每日练习</span><p>A little practice, every day.</p></div>
  </header>
  <nav class="portal-nav" aria-label="Main navigation">
    {#each [{ id: 'practice', title: 'Practice', chinese: '每日练习' }, { id: 'characters', title: 'Characters', chinese: '我的字库' }, { id: 'sentences', title: 'Sentences', chinese: '例句选读' }] as item}
      <button class:current={view === item.id} aria-current={view === item.id ? 'page' : undefined} onclick={() => { view = item.id; }}><span class="nav-copy"><b lang="zh">{item.chinese}</b><small>{item.title}</small></span></button>
    {/each}
    <button class:current={settingsOpen} aria-expanded={settingsOpen} onclick={() => { settingsOpen = !settingsOpen; }}><span class="nav-copy"><b lang="zh">练习设置</b><small>Settings</small></span></button>
  </nav>
  <main>
    <div class="location-bar"><span>练习簿 / <b>{view === 'practice' ? '每日练习' : view === 'characters' ? '我的字库' : '例句选读'}</b></span><div class="script-toggle" aria-label="Character script"><button class:selected={!settings.traditional} aria-pressed={!settings.traditional} onclick={() => { settings.traditional = false; }}>简体 Simplified</button><button class:selected={settings.traditional} aria-pressed={settings.traditional} onclick={() => { settings.traditional = true; }}>繁體 Traditional</button></div></div>
    {#if storageMessage}<p class="notice" role="status">{storageMessage}</p>{/if}
    {#if settingsOpen}<section class="settings-panel"><div class="section-label"><h2>练习设置 / Settings</h2><button class="text-button" aria-label="Close settings" onclick={() => { settingsOpen = false; }}>关闭 Close ×</button></div><label><input type="checkbox" bind:checked={settings.translation}/> 显示英文 / Show English translation by default</label><label><input type="checkbox" bind:checked={settings.strict}/> 声调检查 / Require tone marks or numbers</label><p class="small muted">Progress is stored in this browser. A reading is mastered after three consecutive correct pinyin answers.</p></section>{/if}
    <div class="learning-layout">
      <div class="main-column">
        {#if view === 'practice'}
          <div class="practice-tabs"><strong>温习 / Review</strong><span>{focus ? `重点字：${focus}` : progress.recent.length ? 'A little review, a little progress.' : 'Your first sentence. Take your time.'}</span>{#if focus}<button class="text-button" onclick={() => startPractice()}>取消 Clear</button>{/if}</div>
          {#key round}<Practice {sentence} bind:progress {settings} {focus} onnext={() => startPractice(undefined, focus)}/>{/key}
          <div class="practice-bottom"><span>词句来自日常生活 / Everyday Chinese</span><button class="text-button" onclick={() => startPractice(undefined, focus)}>换一道题 / Skip sentence »</button></div>
        {:else}<Collection {view} {progress} useTraditional={settings.traditional} onpractice={startPractice}/>{/if}
      </div>
      <Companion {progress} {level} {streak} {mastered} onfocus={char => startPractice(undefined, char)}/>
    </div>
    <footer class="site-footer"><span lang="zh">汉字老师 · 读写练习簿</span><span>{sentences.length} sentences · {totalCharacters} characters</span><span>{storageMessage ? 'Progress not saved' : 'Progress saved in this browser'}</span></footer>
  </main>
</div>
