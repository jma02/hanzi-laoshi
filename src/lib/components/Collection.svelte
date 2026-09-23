<script lang="ts">
  import { sentences, categories, traditional, type Sentence } from '$lib/corpus';
  import { toneMark } from '$lib/pinyin';
  import type { Progress } from '$lib/progress';
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
  <div class="collection-heading"><h1>{view === 'characters' ? '我的字库 / Character bank' : '例句查询 / Sentence database'}</h1><span>{view === 'characters' ? characterRows.length : sentences.length} {view === 'characters' ? 'readings' : 'sentences'}</span></div>
  <div class="filters"><label class="search">查询 / Search <input aria-label={view === 'characters' ? 'Search characters' : 'Search sentences'} placeholder={view === 'characters' ? '汉字 / pinyin' : '中文 / English'} bind:value={query} oninput={() => { limit = 30; }}/></label>{#if view !== 'characters'}<select aria-label="Sentence topic" bind:value={category} onchange={() => { limit = 30; }}><option>All topics</option>{#each categories as topic}<option>{topic}</option>{/each}</select>{/if}</div>
  {#if view === 'characters'}
    {#if !characterRows.length}<div class="empty-state"><h2>暂无学习记录 / No characters yet</h2><p>Complete a sentence to record your results here.</p><button class="primary" onclick={() => onpractice()}>开始练习 / Start practice</button></div>
    {:else}<div class="table-scroll"><table class="data-table"><thead><tr><th>汉字 / Hanzi</th><th>拼音 / Pinyin</th><th>正确 / Correct</th><th>错误 / Missed</th><th>状态 / Status</th></tr></thead><tbody>{#each characterRows as [key, stat]}<tr><td><button class="character-link" lang="zh" aria-label={`Practice ${key.split(':')[0]}`} onclick={() => onpractice(undefined, key.split(':')[0])}>{useTraditional ? traditional(key.split(':')[0]) : key.split(':')[0]}</button></td><td>{toneMark(key.split(':')[1])}</td><td>{stat.correct}</td><td class:errors={stat.missed > 0}>{stat.missed}</td><td>{stat.run >= 3 ? '已掌握 / Mastered' : stat.missed ? '待复习 / Review' : '学习中 / Learning'}{#if stat.recognition}<small>{stat.recognition} recognized</small>{/if}</td></tr>{/each}</tbody></table></div>{/if}
  {:else}
    <p class="result-count">查询结果 / Results: <b>{filtered.length}</b>　点击例句开始练习 / Select a sentence to practice</p>
    <div class="sentence-list">{#each filtered.slice(0, limit) as sentence, index}<button class="sentence-row" onclick={() => onpractice(sentence)}><span class="row-number">{index + 1}.</span><span class="sentence-copy"><strong lang="zh">{useTraditional ? traditional(sentence.hanzi) : sentence.hanzi}</strong><span>{sentence.english}</span></span><span class="row-topic">[{sentence.category}]</span></button>{/each}</div>
    {#if !filtered.length}<div class="empty-state"><h2>未找到 / No results</h2><p>Try another word or topic.</p></div>{/if}
    {#if filtered.length > limit}<button class="secondary load-more" onclick={() => { limit += 30; }}>更多例句 / Show more »</button>{/if}
  {/if}
</section>
