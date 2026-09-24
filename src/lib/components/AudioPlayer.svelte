<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Sentence } from '$lib/corpus';
  import Icon from './Icon.svelte';
  export let sentence: Sentence;
  let premium = false, ready = false, playing = false, slow = false, message = '';
  let voices: SpeechSynthesisVoice[] = [];
  let audio: HTMLAudioElement | undefined;
  let previousId = sentence.id;
  function stop() { audio?.pause(); if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); playing = false; }
  $: if (sentence.id !== previousId) { stop(); message = ''; previousId = sentence.id; }
  onMount(() => {
    fetch('/api/tts').then(r => r.json()).then(data => { premium = data.available; ready = true; }).catch(() => { ready = true; });
    if (!('speechSynthesis' in window)) return;
    const refresh = () => { voices = speechSynthesis.getVoices().filter(v => /^zh[-_]CN$/i.test(v.lang)); };
    refresh(); speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => speechSynthesis.removeEventListener('voiceschanged', refresh);
  });
  onDestroy(stop);
  async function play() {
    if (playing) { stop(); return; }
    message = ''; playing = true;
    if (premium) {
      const id = sentence.id;
      audio = new Audio(`/api/tts?id=${encodeURIComponent(id)}`);
      audio.playbackRate = slow ? 0.8 : 1;
      audio.onended = () => { playing = false; };
      audio.onerror = () => { playing = false; message = 'Mandarin audio is unavailable. Please try again.'; };
      try { await audio.play(); } catch { playing = false; message = 'Could not play audio. Please try again.'; }
    } else if (voices.length) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sentence.hanzi);
      utterance.voice = voices.find(v => /natural|premium|enhanced/i.test(v.name)) || voices[0];
      utterance.lang = 'zh-CN'; utterance.rate = slow ? 0.65 : 0.9;
      utterance.onend = () => { playing = false; };
      utterance.onerror = event => { playing = false; if (event.error !== 'canceled' && event.error !== 'interrupted') message = 'Device speech could not play this sentence.'; };
      speechSynthesis.speak(utterance);
    } else { playing = false; message = 'No Mandarin voice is installed. Add a Chinese voice in your device speech settings, or connect Cartesia in the server settings.'; }
  }
</script>
<div class="audio-tools">
  <button class="listen-button" onclick={play} disabled={!ready} title={premium ? 'Mandarin audio' : 'Device voice; quality varies by device'} aria-label={playing ? 'Stop sentence audio' : 'Listen to sentence'}><Icon name="volume" size={18}/>{playing ? '停止' : '听一遍'} <span lang="en">{playing ? 'Stop' : 'Listen'}</span></button>
  <button class="speed-button" aria-label="Slow audio" aria-pressed={slow} onclick={() => { slow = !slow; if (audio) audio.playbackRate = slow ? 0.8 : 1; }}>{slow ? '0.8×' : '1×'}</button>
</div>
{#if message}<p class="notice" role="status">{message}</p>{/if}
