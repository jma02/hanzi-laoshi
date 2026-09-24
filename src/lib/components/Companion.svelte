<script lang="ts">
  import { dateKey, type Progress } from '$lib/progress';
  import { toneMark } from '$lib/pinyin';
  import CozySprite from './CozySprite.svelte';
  export let progress: Progress;
  export let level: number, streak: number, mastered: number;
  export let onfocus: (char: string) => void;
  $: today = progress.days[dateKey()]?.length || 0;
  $: weak = Object.entries(progress.characters).filter(([, s]) => s.missed && s.run < 3).sort(([, a], [, b]) => (b.missed / (b.correct + b.missed)) - (a.missed / (a.correct + a.missed))).slice(0, 4);
</script>
<aside class="companion-column">
  <section class="stats-panel">
    <h2 class="panel-title">学习记录 <span lang="en">Progress</span></h2>
    <div class="today-progress"><div><span>今天 <small lang="en">Today</small></span><p><b>{today}</b><span> / 10 句</span></p></div><CozySprite kind="sprout"/></div>
    <div class="goal-boxes" role="progressbar" aria-label="Daily sentence goal" aria-valuenow={Math.min(today, 10)} aria-valuemin="0" aria-valuemax="10">{#each Array(10) as _, index}<span class:done={index < today} aria-hidden="true"></span>{/each}</div>
    <table class="stats-table"><tbody>
      <tr><th>连续学习 <small lang="en">Streak</small></th><td>{streak} 天</td></tr>
      <tr><th>已掌握读音 <small lang="en">Mastered</small></th><td>{mastered} 个</td></tr>
      <tr><th>学习等级 <small lang="en">Level</small></th><td>{level} 级</td></tr>
      <tr><th>学习积分 <small lang="en">Points</small></th><td class="score">{progress.xp} XP</td></tr>
    </tbody></table>
  </section>
  <section class="review-panel">
    <h2 class="panel-title">再练一遍 <span lang="en">Review</span></h2>
    {#if weak.length}<table class="review-table"><thead><tr><th>汉字</th><th>拼音</th><th>练习</th></tr></thead><tbody>{#each weak as [key]}<tr><td lang="zh">{key.split(':')[0]}</td><td>{toneMark(key.split(':')[1])}</td><td><button class="text-button" onclick={() => onfocus(key.split(':')[0])} aria-label={`Practice ${key.split(':')[0]}`}>复习</button></td></tr>{/each}</tbody></table>{:else}<p>暂无待复习的字。<span class="supporting" lang="en">Missed or revealed characters appear here.</span></p>{/if}
  </section>
</aside>
