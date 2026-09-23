<script lang="ts">
  import { sentences, categories, traditional, type Sentence } from '$lib/corpus';
  import { toneMark } from '$lib/pinyin';
  import type { Progress } from '$lib/progress';
  import Icon from './Icon.svelte';
  export let view: string;
  export let progress: Progress;
  export let useTraditional: boolean;
  export let onpractice: (sentence?: Sentence, focus?: string) => void;
  let query = '', category = 'All topics';
  $: characterRows = Object.entries(progress.characters).sort(([, a], [, b]) => b.missed - a.missed).filter(([key]) => key.includes(query));
  $: filtered = sentences.filter(s => (category === 'All topics' || s.category === category) && `${s.hanzi}${traditional(s.hanzi)}${s.english}`.toLowerCase().includes(query.toLowerCase()));
  let limit = 30;
</script>
<section class="collection-card">
  <div class="collection-heading"><div><span class="eyebrow">{view === 'characters' ? 'YOUR GROWING COLLECTION' : 'SMALL SENTENCES, A BIG WORLD'}</span><h2>{view === 'characters' ? 'Every character has a story.' : 'Find something to say.'}</h2></div><span class="topic-pill">{view === 'characters' ? characterRows.length : sentences.length} {view === 'characters' ? 'readings seen' : 'sentences'}</span></div>
  <div class="filters"><label class="search"><Icon name="search" size={17}/><input aria-label={view === 'characters' ? 'Search characters' : 'Search sentences'} placeholder={view === 'characters' ? 'Find a character…' : 'Search Chinese or English…'} bind:value={query} oninput={() => { limit = 30; }}/></label>{#if view !== 'characters'}<select aria-label="Sentence topic" bind:value={category} onchange={() => { limit = 30; }}><option>All topics</option>{#each categories as topic}<option>{topic}</option>{/each}</select>{/if}</div>
  {#if view === 'characters'}
    {#if !characterRows.length}<div class="empty-state"><span lang="zh">字</span><h3>Your collection starts with one sentence.</h3><p>Characters you practice will appear here, with the tricky ones first.</p><button class="primary" onclick={() => onpractice()}>Practice a sentence <Icon name="arrow" size={17}/></button></div>{/if}
    <div class="character-collection">{#each characterRows as [key, stat]}<button class="collected-character" onclick={() => onpractice(undefined, key.split(':')[0])}><span class="hanzi-small" lang="zh">{useTraditional ? traditional(key.split(':')[0]) : key.split(':')[0]}</span><strong>{toneMark(key.split(':')[1])}</strong><span>{stat.run >= 3 ? 'Taking root' : stat.missed ? 'Needs a little love' : 'Getting familiar'}</span><small>{stat.correct} recalled · {stat.missed} to review{stat.recognition ? ` · ${stat.recognition} recognized` : ''}</small></button>{/each}</div>
  {:else}
    <p class="small muted">{filtered.length} sentences · Pick one to practice</p>
    {#each filtered.slice(0, limit) as sentence}<button class="sentence-row" onclick={() => onpractice(sentence)}><span><strong lang="zh">{useTraditional ? traditional(sentence.hanzi) : sentence.hanzi}</strong><span>{sentence.english}</span></span><span class="row-topic">{sentence.category} <Icon name="arrow" size={18}/></span></button>{/each}
    {#if !filtered.length}<div class="empty-state"><h3>No sentences found.</h3><p>Try another word or topic.</p></div>{/if}
    {#if filtered.length > limit}<button class="secondary load-more" onclick={() => { limit += 30; }}>Show more sentences</button>{/if}
  {/if}
</section>
