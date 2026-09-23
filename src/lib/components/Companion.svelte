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
  <section class="mascot-card"><div class="mascot-intro"><span class="eyebrow">YOUR STUDY BUDDY</span><span class="tiny-stamp" lang="zh">小红</span></div><img src="/red-panda.webp" alt="Xiao Hong, a little red panda reading a green book" width="260" height="260"/><div class="mascot-caption"><h3>{today >= 10 ? 'Look how far you’ve come!' : today ? 'One character at a time.' : 'Let’s grow together.'}</h3><p>{today >= 10 ? 'Your daily goal is complete. Xiao Hong is very proud.' : 'A tiny bit of practice today. A little more confidence tomorrow.'}</p></div></section>
  <section class="daily-card"><div class="section-label"><h3>Today’s little goal</h3><Icon name="leaf" size={19}/></div><div class="daily-number">{Math.min(today, 10)}<span> / 10 sentences</span></div><div class="goal-track" role="progressbar" aria-label="Daily sentence goal" aria-valuenow={Math.min(today, 10)} aria-valuemin="0" aria-valuemax="10"><span style={`width:${Math.min(today * 10, 100)}%`}></span></div><p>{today >= 10 ? 'Goal complete. Keep going if you feel like it.' : `${10 - today} little discoveries to go.`}</p></section>
  <section class="review-card"><div class="section-label"><h3>A little extra love</h3><Icon name="repeat" size={17}/></div>{#if weak.length}<p>These characters will come around more often.</p><div class="weak-characters">{#each weak as [key]}<button onclick={() => onfocus(key.split(':')[0])} title={`Practice ${key.split(':')[0]}`}><span lang="zh">{key.split(':')[0]}</span><small>{toneMark(key.split(':')[1])}</small></button>{/each}</div>{:else}<p>Miss a character? It will find its way back into your practice.</p><div class="empty-review"><Icon name="spark" size={17}/> A fresh page. A good place to start.</div>{/if}</section>
</aside>
