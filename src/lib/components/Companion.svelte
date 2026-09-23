<script lang="ts">
  import { dateKey, type Progress } from '$lib/progress';
  import { toneMark } from '$lib/pinyin';
  export let progress: Progress;
  export let level: number, streak: number, mastered: number;
  export let onfocus: (char: string) => void;
  $: today = progress.days[dateKey()]?.length || 0;
  $: weak = Object.entries(progress.characters).filter(([, s]) => s.missed && s.run < 3).sort(([, a], [, b]) => (b.missed / (b.correct + b.missed)) - (a.missed / (a.correct + a.missed))).slice(0, 4);
</script>
<aside class="companion-column">
  <section class="stats-panel">
    <h2 class="panel-title">学习统计 <span>Study stats</span></h2>
    <table class="stats-table"><tbody>
      <tr><th>等级 Level</th><td>Lv. {level}</td></tr>
      <tr><th>积分 Points</th><td class="score">{progress.xp}</td></tr>
      <tr><th>连续 Streak</th><td>{streak} 天 / days</td></tr>
      <tr><th>掌握 Mastered</th><td>{mastered} readings</td></tr>
      <tr><th>今日 Today</th><td><b>{today}</b> / 10 sentences</td></tr>
    </tbody></table>
    <div class="daily-goal"><div class="goal-boxes" role="progressbar" aria-label="Daily sentence goal" aria-valuenow={Math.min(today, 10)} aria-valuemin="0" aria-valuemax="10">{#each Array(10) as _, index}<span class:done={index < today} aria-hidden="true"></span>{/each}</div><p>{today >= 10 ? '今日目标已完成 / Daily goal complete' : `距目标还差 ${10 - today} 句 / ${10 - today} to go`}</p></div>
  </section>
  <section class="review-panel">
    <h2 class="panel-title">错字复习 <span>Review mistakes</span></h2>
    {#if weak.length}<table class="review-table"><thead><tr><th>汉字</th><th>Pinyin</th><th>练习</th></tr></thead><tbody>{#each weak as [key]}<tr><td lang="zh">{key.split(':')[0]}</td><td>{toneMark(key.split(':')[1])}</td><td><button class="text-button" onclick={() => onfocus(key.split(':')[0])} aria-label={`Practice ${key.split(':')[0]}`}>复习 »</button></td></tr>{/each}</tbody></table><p>These characters appear more often in practice.</p>{:else}<p>暂无记录 / No mistakes recorded.</p><p>Missed or revealed characters appear here for review.</p>{/if}
  </section>
  <section class="help-panel">
    <h2 class="panel-title">操作说明 <span>Keyboard</span></h2>
    <dl><dt>Tab / Space</dt><dd>下一字 / Next character</dd><dt>Shift + Tab</dt><dd>上一字 / Previous</dd><dt>Backspace</dt><dd>空白时返回 / Back if empty</dd><dt>?</dt><dd>显示答案 / Reveal &amp; next</dd></dl>
    <p>拼音示例 / Pinyin: <b>nǐ · ni3 · ni</b><br/>ü = v = u:　·　Chinese IME supported</p>
  </section>
</aside>
