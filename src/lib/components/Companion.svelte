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
    <div class="today-progress"><div><span>今天已练</span><p><b>{today}</b><span> / 10 句</span></p><small lang="en">Sentences today</small></div><CozySprite kind="sprout"/></div>
    <div class="daily-goal"><div class="goal-boxes" role="progressbar" aria-label="Daily sentence goal" aria-valuenow={Math.min(today, 10)} aria-valuemin="0" aria-valuemax="10">{#each Array(10) as _, index}<span class:done={index < today} aria-hidden="true"></span>{/each}</div><p>{today >= 10 ? '今日目标完成，辛苦啦！' : `再练 ${10 - today} 句，就完成今日目标了。`}</p></div>
    <table class="stats-table"><tbody>
      <tr><th>连续学习 <small lang="en">Streak</small></th><td>{streak} 天</td></tr>
      <tr><th>已掌握读音 <small lang="en">Mastered</small></th><td>{mastered} 个</td></tr>
      <tr><th>学习等级 <small lang="en">Level</small></th><td>{level} 级</td></tr>
      <tr><th>学习积分 <small lang="en">Points</small></th><td class="score">{progress.xp} XP</td></tr>
    </tbody></table>
  </section>
  <section class="review-panel">
    <h2 class="panel-title">再练一遍 <span lang="en">Review</span></h2>
    {#if weak.length}<table class="review-table"><thead><tr><th>汉字</th><th>拼音</th><th>练习</th></tr></thead><tbody>{#each weak as [key]}<tr><td lang="zh">{key.split(':')[0]}</td><td>{toneMark(key.split(':')[1])}</td><td><button class="text-button" onclick={() => onfocus(key.split(':')[0])} aria-label={`Practice ${key.split(':')[0]}`}>复习</button></td></tr>{/each}</tbody></table><p>这些字会在接下来的练习中多出现几次。<span class="supporting" lang="en">These characters appear more often in practice.</span></p>{:else}<p>还没有需要复习的字。<span class="supporting" lang="en">No characters to review yet.</span></p><p>答错或看过答案的字，会记在这里。<span class="supporting" lang="en">Missed or revealed characters will appear here.</span></p>{/if}
  </section>
  <figure class="classroom-picture"><img src="/classroom-afternoon.webp" alt="阳光照进教室，木桌上放着一本练习册" width="600" height="400"/></figure>
  <details class="help-panel">
    <summary>键盘小提示 <span lang="en">Keyboard</span></summary>
    <dl><dt>Tab / Space</dt><dd>下一字 <small lang="en">Next character</small></dd><dt>Shift + Tab</dt><dd>上一字 <small lang="en">Previous</small></dd><dt>Backspace</dt><dd>空白时返回上一字 <small lang="en">Back if empty</small></dd><dt>?</dt><dd>看答案，接着练 <small lang="en">Reveal &amp; next</small></dd></dl>
    <p>拼音示例：<b>nǐ · ni3 · ni</b><br/>ü 可以写成 v 或 u:。关闭声调检查时，也可以输入 ni。<span class="supporting" lang="en">Plain ni works when tone checking is off. Chinese IME is also supported.</span></p>
  </details>
</aside>
