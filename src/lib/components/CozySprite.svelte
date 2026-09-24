<script lang="ts">
  export let kind: 'tea' | 'sprout' = 'tea';
</script>

<span class="cozy-sprite" class:sprout={kind === 'sprout'} aria-hidden="true"></span>

<style>
  .cozy-sprite {
    display: block;
    flex-shrink: 0;
    width: var(--sprite-size, 76px);
    height: var(--sprite-size, 76px);
    background: url('/cozy-sprites.webp') 0 0 / 200% 100% no-repeat;
    image-rendering: pixelated;
  }
  .sprout { background-position: 100% 0; }
</style>
