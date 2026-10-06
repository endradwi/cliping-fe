<script lang="ts">
  import type { HeatmapPoint, CandidateClip } from '../../types';

  let {
    points = [],
    duration = 100,
    currentTime = 0,
    selectedStart = 0,
    selectedEnd = 30,
    topClips = [],
    onSeek
  }: {
    points: HeatmapPoint[];
    duration: number;
    currentTime: number;
    selectedStart: number;
    selectedEnd: number;
    topClips: CandidateClip[];
    onSeek: (time: number) => void;
  } = $props();

  const svgWidth = 800;
  const svgHeight = 70;

  // Build SVG path
  let pathD = $derived.by(() => {
    if (!points || points.length === 0) return '';
    const step = svgWidth / Math.max(1, points.length - 1);
    
    // Smooth points
    return points.reduce((acc, pt, idx) => {
      const x = idx * step;
      // Invert Y so high value is at top
      const y = svgHeight - (pt.value * (svgHeight - 12)) - 6;
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  });

  let fillD = $derived.by(() => {
    if (!pathD) return '';
    return `${pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;
  });

  function handleClick(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  }
</script>

<div class="relative w-full bg-neutral-950/90 border border-neutral-800/80 rounded-xl p-3 select-none">
  <div class="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
    <div class="flex items-center gap-2">
      <span class="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
      <span class="text-neutral-200 font-medium">Audience Retention Curve (Most Replayed)</span>
    </div>
    <span>{Math.floor(currentTime)}s / {Math.floor(duration)}s</span>
  </div>

  <!-- Interactive timeline track -->
  <div
    role="slider"
    tabindex="0"
    aria-valuenow={currentTime}
    aria-valuemin="0"
    aria-valuemax={duration}
    onclick={handleClick}
    onkeydown={(e) => {
      if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 5));
      if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 5));
    }}
    class="relative h-[70px] w-full cursor-pointer overflow-hidden rounded-lg bg-neutral-900/50"
  >
    <!-- SVG Heatmap Curve -->
    <svg viewBox="0 0 {svgWidth} {svgHeight}" preserveAspectRatio="none" class="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="heatGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E11D48" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#E11D48" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      
      {#if fillD}
        <path d={fillD} fill="url(#heatGradient)" />
        <path d={pathD} fill="none" stroke="#F43F5E" stroke-width="2" stroke-linecap="round" />
      {/if}
    </svg>

    <!-- Highlighted Active Slice Range -->
    {#if duration > 0}
      {@const startPct = (selectedStart / duration) * 100}
      {@const widthPct = ((selectedEnd - selectedStart) / duration) * 100}
      <div
        class="absolute top-0 bottom-0 border-x-2 border-rose-500 bg-rose-500/20 backdrop-blur-[1px] pointer-events-none transition-all duration-75"
        style="left: {startPct}%; width: {widthPct}%;"
      >
        <div class="absolute top-1 left-1.5 px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-800 text-[10px] font-mono text-rose-200 font-semibold shadow">
          {Math.round(selectedEnd - selectedStart)}s CLIP
        </div>
      </div>
    {/if}

    <!-- Playhead cursor line -->
    {#if duration > 0}
      {@const cursorPct = (currentTime / duration) * 100}
      <div
        class="absolute top-0 bottom-0 w-[2px] bg-white shadow-lg pointer-events-none z-10"
        style="left: {cursorPct}%;"
      >
        <div class="w-2.5 h-2.5 -ml-1 -mt-0.5 rounded-full bg-white shadow-md"></div>
      </div>
    {/if}
  </div>

  <!-- Top 3 Peak Badges on bottom -->
  <div class="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-900 text-xs">
    <span class="text-neutral-500 font-mono text-[11px]">HOTSPOTS:</span>
    {#each topClips as clip}
      <button
        type="button"
        onclick={() => onSeek(clip.start)}
        class="px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-all {selectedStart === clip.start ? 'bg-rose-950/90 text-rose-300 border border-rose-700/80' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'}"
      >
        <span class="font-bold text-rose-400">#{clip.rank}</span>
        <span>{clip.start}s - {clip.end}s</span>
        <span class="text-[10px] text-neutral-500 font-sans">({clip.score}%)</span>
      </button>
    {/each}
  </div>
</div>
