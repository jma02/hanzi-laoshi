<script lang="ts">
  import { dateKey, type Progress } from '$lib/progress';
  import { toneMark } from '$lib/pinyin';
  import Icon from './Icon.svelte';
  export let progress: Progress;
  export let onfocus: (char: string) => void;
  $: today = progress.days[dateKey()]?.length || 0;
  $: weak = Object.entries(progress.characters).filter(([, s]) => s.missed && s.run < 3).sort(([, a], [, b]) => (b.missed / (b.correct + b.missed)) - (a.missed / (a.correct + a.missed))).slice(0, 4);
</script>
<aside class="companion-column">
  <section class="mascot-card">
    <div class="mascot-intro"><span class="eyebrow">A MOMENT WITH XIAO HONG</span><span class="tiny-stamp" lang="zh">小红</span></div>
    <img src="/red-panda.webp" alt="A Chinese print of Xiao Hong the red panda reading beside a moon gate, with tea and bamboo" width="560" height="700"/>
    <div class="mascot-caption"><h3 lang="zh">{today >= 10 ? '今天也很棒！' : '今天也读一点。'}</h3><p>{today >= 10 ? 'Ten sentences. A whole page of discoveries.' : 'A little reading, every day.'}</p></div>
  </section>
  <section class="daily-card">
    <div class="section-label"><h3>Daily reading card</h3><span lang="zh">集章</span></div>
    <div class="daily-number">{Math.min(today, 10)}<span> / 10 sentences</span><span class="daily-day" lang="zh">今日</span></div>
    <div class="reading-stamps" role="progressbar" aria-label="Daily sentence goal" aria-valuenow={Math.min(today, 10)} aria-valuemin="0" aria-valuemax="10">
      {#each Array(10) as _, index}<span class:stamped={index < today} aria-hidden="true">{#if index < today}<span lang="zh">阅</span>{:else}{String(index + 1).padStart(2, '0')}{/if}</span>{/each}
    </div>
    <p>{today >= 10 ? 'A full card. 好棒! Come back for more tomorrow.' : 'One sentence, one stamp. Make a little time for yourself.'}</p>
  </section>
  <section class="review-card"><div class="section-label"><h3>Meet again soon</h3><Icon name="repeat" size={17}/></div>{#if weak.length}<p>A little extra practice for these familiar faces.</p><div class="weak-characters">{#each weak as [key]}<button onclick={() => onfocus(key.split(':')[0])} title={`Practice ${key.split(':')[0]}`}><span lang="zh">{key.split(':')[0]}</span><small>{toneMark(key.split(':')[1])}</small></button>{/each}</div>{:else}<p>Tricky characters return in new sentences. That’s how they become old friends.</p><div class="empty-review"><Icon name="spark" size={17}/> A fresh page. A good place to start.</div>{/if}</section>
</aside>
