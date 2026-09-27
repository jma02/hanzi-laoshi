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
  import type { Sentence } from '$lib/sentence';
  import type { PageData } from './$types';
  import { freshProgress, defaultSettings, storageKey, restoreProgress, chooseSentence, dateKey } from '$lib/progress';
  export let data: PageData;
  let progress = structuredClone(freshProgress), settings = { ...defaultSettings };
  let hydrated = false, storageMessage = '', view = 'practice', settingsOpen = false;
  let sentence = data.initialSentence;
  let corpus: typeof import('$lib/corpus') | undefined;
  let corpusPromise: Promise<typeof import('$lib/corpus')> | undefined;
  let corpusLoading = false, corpusError = '', actionId = 0;
  let retryCorpus: (() => Promise<boolean>) | undefined;
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
    if (progress.recent.length) void startPractice(undefined, '', false);
    const lifecycle = new AbortController();
    const context = document.modelContext;
    if (context?.registerTool) {
      const tools = [
        { name: 'get_learning_progress', description: 'Read the learner’s saved character results and XP.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => structuredClone(progress) },
        { name: 'start_sentence_practice', description: 'Start a sentence by its corpus ID, or choose adaptive practice. Does not submit answers.', inputSchema: { type: 'object', properties: { sentenceId: { type: 'string' } }, additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input: unknown) => {
          if (!input || typeof input !== 'object' || Object.keys(input).some(key => key !== 'sentenceId')) throw new Error('Expected an optional sentenceId.');
          const id = (input as { sentenceId?: unknown }).sentenceId;
          if (id !== undefined && typeof id !== 'string') throw new Error('Expected a string sentenceId.');
          const ready = await withCorpus(loaded => {
            const chosen = id === undefined ? undefined : loaded.sentences.find(s => s.id === id);
            if (id !== undefined && !chosen) throw new Error('Unknown sentence ID.');
            applyPractice(loaded, chosen);
          });
          if (!ready) throw new Error(corpusError || 'Practice request was superseded.');
          await tick(); return { id: sentence.id, hanzi: sentence.hanzi, status: 'ready' };
        } }
      ];
      for (const tool of tools) {
        try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional browser capability. */ }
      }
    }
    return () => { actionId++; lifecycle.abort(); };
  });
  async function withCorpus(action: (loaded: typeof import('$lib/corpus')) => void): Promise<boolean> {
    const request = ++actionId;
    corpusLoading = !corpus; corpusError = ''; retryCorpus = undefined;
    let loaded: typeof import('$lib/corpus');
    try {
      // Deduplicate concurrent requests; permit retry after a failed download.
      corpusPromise ??= import('$lib/corpus').catch(error => { corpusPromise = undefined; throw error; });
      loaded = await corpusPromise;
      corpus = loaded;
    } catch {
      if (request === actionId) {
        corpusError = 'The sentence bank could not be loaded. Check your connection and try again.';
        retryCorpus = () => withCorpus(action);
      }
      return false;
    } finally {
      if (request === actionId) corpusLoading = false;
    }
    if (request !== actionId) return false;
    action(loaded);
    return true;
  }
  async function scrollToTopOnPhone() {
    await tick();
    if (window.matchMedia('(max-width: 640px)').matches) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function selectView(nextView: string) {
    actionId++; corpusLoading = false; corpusError = ''; retryCorpus = undefined;
    view = nextView; settingsOpen = false;
    if (view !== 'practice') void withCorpus(() => {});
    void scrollToTopOnPhone();
  }
  function startPractice(pick?: Sentence, char = '', scroll = true) {
    return withCorpus(loaded => applyPractice(loaded, pick, char, scroll));
  }
  function applyPractice(loaded: typeof import('$lib/corpus'), pick?: Sentence, char = '', scroll = true) {
    focus = char; sentence = loaded.prepareSentence(pick || chooseSentence(loaded.sentences, progress, char)); round++; view = 'practice'; settingsOpen = false;
    if (scroll) void scrollToTopOnPhone();
  }
</script>

<svelte:head><title>汉字老师 · Hanzi Laoshi</title><meta name="description" content="汉字辨读、拼音练习和日常例句。Chinese reading and pinyin practice with English support."/><meta name="theme-color" content="#f2efe7"/></svelte:head>

<div class="portal">
  <header class="masthead">
    <a class="brand" href="/" aria-label="汉字老师 Hanzi Laoshi home"><strong>汉字老师</strong><span lang="en">Hanzi Laoshi</span></a>
    <nav class="portal-nav" aria-label="Main navigation">
    {#each [{ id: 'practice', title: 'Practice', chinese: '练习' }, { id: 'characters', title: 'Characters', chinese: '字库' }, { id: 'sentences', title: 'Sentences', chinese: '例句' }] as item}
      <button class:current={view === item.id} aria-current={view === item.id ? 'page' : undefined} onclick={() => selectView(item.id)}><span class="nav-copy"><b>{item.chinese}</b><small lang="en">{item.title}</small></span></button>
    {/each}
    <button class:current={settingsOpen} aria-expanded={settingsOpen} onclick={() => { settingsOpen = !settingsOpen; void scrollToTopOnPhone(); }}><span class="nav-copy"><b>设置</b><small lang="en">Settings</small></span></button>
    </nav>
  </header>
  <main>
    <div class="page-tools"><div class="script-toggle" aria-label="Character script"><button class:selected={!settings.traditional} aria-pressed={!settings.traditional} aria-label="Simplified Chinese" onclick={() => { settings.traditional = false; }}>简体 <span lang="en">Simplified</span></button><span aria-hidden="true">/</span><button class:selected={settings.traditional} aria-pressed={settings.traditional} aria-label="Traditional Chinese" onclick={() => { settings.traditional = true; }}>繁體 <span lang="en">Traditional</span></button></div></div>
    {#if storageMessage}<p class="notice" role="status" lang="en">{storageMessage}</p>{/if}
    {#if corpusLoading}<p class="notice" role="status" lang="en">Loading the sentence bank…</p>{/if}
    {#if corpusError}<p class="notice" role="alert" lang="en">{corpusError} <button class="text-button" onclick={() => { void retryCorpus?.(); }}>Try again</button></p>{/if}
    {#if settingsOpen}
      <section class="settings-panel">
        <div class="section-label"><h2>练习设置 <small lang="en">Settings</small></h2><button class="text-button" aria-label="Close settings" onclick={() => { settingsOpen = false; }}>关闭 ×</button></div>
        <label><input type="checkbox" bind:checked={settings.translation}/><span>默认显示英文释义<small class="supporting" lang="en">Show English translations by default</small></span></label>
        <label><input type="checkbox" bind:checked={settings.strict}/><span>检查声调<small class="supporting" lang="en">Require tone marks or numbers, such as nǐ or ni3</small></span></label>
        <p class="small muted">同一字音连续答对三次，记为已掌握。进度保存在当前浏览器。<span class="supporting" lang="en">Three consecutive correct pinyin answers master a reading. Progress stays in this browser.</span></p>
      </section>
    {/if}
    <div class="learning-layout">
      <div class="main-column">
        {#if view === 'practice'}
          {#if focus}<div class="practice-tabs"><strong>重点复习：{focus}</strong><button class="text-button" onclick={() => startPractice()}>取消 <span lang="en">Clear focus</span></button></div>{/if}
          {#key round}<Practice {sentence} bind:progress {settings} onnext={() => startPractice(undefined, focus)}/>{/key}
          <div class="practice-bottom"><button class="text-button" onclick={() => startPractice(undefined, focus)}>换一句 <span lang="en">Skip</span></button></div>
        {:else if corpus}<Collection {corpus} {view} {progress} useTraditional={settings.traditional} onpractice={startPractice}/>{/if}
      </div>
      <Companion {progress} {level} {streak} {mastered} onfocus={char => startPractice(undefined, char)}/>
    </div>
    <footer class="site-footer"><span>{data.sentenceCount} 个日常例句 · {data.totalCharacters} 个汉字</span><span>{storageMessage ? '进度未保存' : '进度已保存在本机'}</span></footer>
  </main>
</div>
