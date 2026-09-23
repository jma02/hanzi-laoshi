<script lang="ts">
  export let name: string;
  export let size = 20;
  const paths: Record<string, string> = {
    book: 'M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v15h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3z M12 6v15',
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    volume: 'M11 4 5 9H2v6h3l6 5z M15 8a6 6 0 0 1 0 8 M18 4a11 11 0 0 1 0 16',
    arrow: 'M5 12h14 M13 6l6 6-6 6',
    check: 'm5 12 4 4L19 6',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    spark: 'm12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7z',
    flame: 'M13 2c2 7-3 6-1 11 2-1 3-3 3-5 5 5 6 13-3 14C3 21 2 15 6 10c-1 5 3 6 3 2-2-4 3-5 4-10z',
    settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
    leaf: 'M20 3C8 2 2 8 5 16c8 5 16-1 15-13z M4 21 16 8',
    close: 'm6 6 12 12 M6 18 18 6',
    search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
    repeat: 'M4 7h13l-3-3 M20 17H7l3 3 M20 7v5 M4 17v-5',
    help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4 M12 18h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20'
  };
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name] || paths.spark}/></svg>
