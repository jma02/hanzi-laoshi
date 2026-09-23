<script lang="ts">
  import { onMount, tick } from 'svelte';
  import '../styles.css';
  import '../styles/practice.css';
  import '../styles/companion.css';
  import '../styles/collection.css';
  import '../styles/responsive.css';
  import Icon from '$lib/components/Icon.svelte';
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

<svelte:head><title>Hanzi Laoshi · A little Chinese, every day</title><meta name="description" content="Learn to read Chinese one character at a time. Annotate pinyin, discover everyday sentences, and build confidence with adaptive practice."/><meta name="theme-color" content="#19483e"/></svelte:head>

<div class="app-shell">
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="Hanzi Laoshi home"><span class="brand-mark" lang="zh">汉字<br/>老师</span><span>hanzi<br/>laoshi<span class="brand-dot">.</span></span></a>
    <span class="sidebar-label">A LITTLE CHINESE, EVERY DAY</span>
    <nav aria-label="Main navigation">{#each [{ id: 'practice', icon: 'book', title: 'Daily practice', chinese: '每日练习' }, { id: 'characters', icon: 'grid', title: 'My characters', chinese: '我的字库' }, { id: 'sentences', icon: 'search', title: 'Sentence garden', chinese: '句子小园' }] as item}<button class:current={view === item.id} aria-current={view === item.id ? 'page' : undefined} onclick={() => { view = item.id; }}><Icon name={item.icon}/><span>{item.title}<small lang="zh">{item.chinese}</small></span>{#if view === item.id}<span class="nav-indicator"></span>{/if}</button>{/each}</nav>
    <section class="level-card"><div class="level-badge" lang="zh">学</div><span>LEVEL {level}</span><h3>{level < 3 ? 'Curious seedling' : level < 6 ? 'Growing reader' : 'Hanzi explorer'}</h3><div class="level-track"><span style={`width:${progress.xp % 150 / 150 * 100}%`}></span></div><p>{progress.xp % 150} / 150 XP to level {level + 1}</p></section>
    <div class="sidebar-bottom"><button class="settings-button" aria-expanded={settingsOpen} onclick={() => { settingsOpen = !settingsOpen; }}><Icon name="settings"/>Practice settings</button><div class="local-save"><span class="save-dot"></span>{storageMessage ? 'Progress is not saved' : 'Your progress stays with you'}<span>Saved in this browser</span></div></div>
  </aside>
  <main>
    <header class="topbar"><div class="breadcrumb"><span class="room-label" lang="zh">书房</span> Your reading room <span>/</span> <strong>{view === 'practice' ? 'Daily practice' : view === 'characters' ? 'My characters' : 'Sentence garden'}</strong></div><div class="top-stats"><span><Icon name="flame" size={19}/><b>{streak}</b> <span>day streak</span></span><span><Icon name="spark" size={18}/><b>{progress.xp}</b> XP</span><div class="avatar" lang="zh" aria-label="Your profile">你</div></div></header>
    <div class="workspace">
      <div class="page-heading"><div><div class="greeting"><span lang="zh">慢慢来</span> GOOD THINGS TAKE PRACTICE</div><h1><span class="heading-chinese" lang="zh">{view === 'practice' ? '小小书房' : view === 'characters' ? '我的字库' : '句子小园'}</span>{view === 'practice' ? 'A little Chinese. A little closer.' : view === 'characters' ? 'Old friends. New characters.' : 'Everyday words, a wider world.'}</h1><p>{view === 'practice' ? 'Pull up a chair. Pour some tea. Let’s read something together.' : view === 'characters' ? 'Your own little collection of characters, one discovery at a time.' : `${sentences.length} sentences. ${totalCharacters} characters. Follow your curiosity.`}</p></div><div class="script-toggle" aria-label="Character script"><button class:selected={!settings.traditional} aria-pressed={!settings.traditional} onclick={() => { settings.traditional = false; }}>简 <span>Simplified</span></button><button class:selected={settings.traditional} aria-pressed={settings.traditional} onclick={() => { settings.traditional = true; }}>繁 <span>Traditional</span></button></div></div>
      {#if storageMessage}<p class="notice" role="status">{storageMessage}</p>{/if}
      {#if settingsOpen}<section class="settings-panel"><div class="section-label"><h3>Make practice yours</h3><button class="icon-button" aria-label="Close settings" onclick={() => { settingsOpen = false; }}><Icon name="close"/></button></div><label><span><b>Show English by default</b><small>Keep the meaning close while you read.</small></span><input type="checkbox" bind:checked={settings.translation}/></label><label><span><b>Challenge me on tones</b><small>Require tone marks or numbers. Plain pinyin is accepted when off.</small></span><input type="checkbox" bind:checked={settings.strict}/></label><p class="small muted">Progress is stored on this device. Three consecutive correct pinyin answers help a character take root. A reveal brings it back for review.</p></section>{/if}
      <div class="learning-layout"><div class="main-column">
        {#if view === 'practice'}
          <div class="practice-tabs"><span class="active-tab"><Icon name="spark" size={16}/> {focus ? `Focus on ${focus}` : 'For you'}</span><span>Adapts as you learn</span>{#if focus}<button class="text-button" onclick={() => startPractice()}>Clear focus</button>{/if}</div>
          {#key round}<Practice {sentence} bind:progress {settings} {focus} onnext={() => startPractice(undefined, focus)}/>{/key}
          <div class="practice-bottom"><span><Icon name="leaf" size={15}/> Every attempt helps your next sentence find you.</span><button class="text-button" onclick={() => startPractice(undefined, focus)}>Try another sentence <Icon name="arrow" size={15}/></button></div>
        {:else}<Collection {view} {progress} useTraditional={settings.traditional} onpractice={startPractice}/>{/if}
      </div><Companion {progress} onfocus={char => startPractice(undefined, char)}/></div>
      <footer class="workspace-footer"><span><b lang="zh">日积月累</b> A little, every day.</span><span>{sentences.length} everyday sentences <span>·</span> {totalCharacters} characters <span>·</span> {mastered} readings taking root</span></footer>
    </div>
  </main>
</div>
