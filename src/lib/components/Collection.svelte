<script lang="ts">
  import { sentences, categories, traditional, type Sentence } from '$lib/corpus';
  import { toneMark } from '$lib/pinyin';
  import type { Progress } from '$lib/progress';
  import { topicName } from '$lib/labels';
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
  <div class="collection-heading"><div><h1>{view === 'characters' ? '字库' : '例句'}</h1><p lang="en">{view === 'characters' ? 'Your character bank' : 'Sentence index'}</p></div><span>{view === 'characters' ? `${characterRows.length} 个读音` : `${sentences.length} 个例句`}</span></div>
  <div class="filters"><label class="search"><span>查找<small lang="en">Search</small></span><input aria-label={view === 'characters' ? 'Search characters' : 'Search sentences'} placeholder={view === 'characters' ? '汉字或拼音 · Hanzi / pinyin' : '中文或英文 · Chinese / English'} bind:value={query} oninput={() => { limit = 30; }}/></label>{#if view !== 'characters'}<select aria-label="Sentence topic" bind:value={category} onchange={() => { limit = 30; }}><option value="All topics">全部话题 · All topics</option>{#each categories as topic}<option value={topic}>{topicName(topic)} · {topic}</option>{/each}</select>{/if}</div>
  {#if view === 'characters'}
    {#if !characterRows.length}<div class="empty-state"><p>{query ? '没有找到这个字。' : '完成练习后，学过的字会记在这里。'}<span class="supporting" lang="en">{query ? 'No matching characters. Try another search.' : 'Your practiced characters will appear here.'}</span></p><button class="primary" onclick={() => onpractice()}>去练一练 <span lang="en">Start practice</span></button></div>
    {:else}<div class="table-scroll">
      <!-- svelte-ignore a11y_no_redundant_roles (Explicit roles preserve table semantics when the mobile layout changes display.) -->
      <table class="data-table" role="table"><thead role="rowgroup"><tr role="row"><th role="columnheader">汉字<small lang="en">Hanzi</small></th><th role="columnheader">拼音<small lang="en">Pinyin</small></th><th role="columnheader">答对<small lang="en">Correct</small></th><th role="columnheader">未答对<small lang="en">Missed / revealed</small></th><th role="columnheader">状态<small lang="en">Status</small></th></tr></thead><tbody role="rowgroup">{#each characterRows as [key, stat]}<tr role="row"><td class="bank-character" role="cell"><button class="character-link" lang="zh" aria-label={`Practice ${key.split(':')[0]}`} onclick={() => onpractice(undefined, key.split(':')[0])}>{useTraditional ? traditional(key.split(':')[0]) : key.split(':')[0]}</button></td><td class="bank-pinyin" role="cell">{toneMark(key.split(':')[1])}</td><td class="bank-correct" role="cell"><span class="mobile-cell-label" lang="en">Correct </span>{stat.correct}</td><td class="bank-missed" role="cell" class:errors={stat.missed > 0}><span class="mobile-cell-label" lang="en">Missed / revealed </span>{stat.missed}</td><td class="bank-status" role="cell"><span class="reading-status" class:mastered={stat.run >= 3}>{stat.run >= 3 ? '已掌握' : stat.missed ? '待复习' : '学习中'}</span><small lang="en">{stat.run >= 3 ? 'Mastered' : stat.missed ? 'Review' : 'Learning'}</small>{#if stat.recognition}<small>识字 {stat.recognition} 次</small>{/if}</td></tr>{/each}</tbody></table></div>{/if}
  {:else}
    <p class="result-count">找到 <b>{filtered.length}</b> 个例句 <span lang="en">Select a sentence to practice</span></p>
    <div class="sentence-list">{#each filtered.slice(0, limit) as sentence}<button class="sentence-row" onclick={() => onpractice(sentence)}><span class="sentence-copy"><strong lang={useTraditional ? 'zh-Hant' : 'zh-Hans'}>{useTraditional ? traditional(sentence.hanzi) : sentence.hanzi}</strong><span lang="en">{sentence.english}</span></span><span class="row-topic">{topicName(sentence.category)}</span></button>{/each}</div>
    {#if !filtered.length}<div class="empty-state"><h2>没有找到合适的句子</h2><p>换个词，或者看看别的话题。<span class="supporting" lang="en">Try another word or topic.</span></p></div>{/if}
    {#if filtered.length > limit}<button class="secondary load-more" onclick={() => { limit += 30; }}>再看一些 <span lang="en">Show more</span></button>{/if}
  {/if}
</section>
