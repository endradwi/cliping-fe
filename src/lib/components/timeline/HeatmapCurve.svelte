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
    
    return points.reduce((acc, pt, idx) => {
      const x = idx * step;
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

<div class="relative w-full bg-[#2D0000]/70 border border-[#757D6F]/30 rounded-xl p-3 select-none">
  <div class="flex items-center justify-between text-xs text-[#A9B3A1] mb-2 font-mono">
    <div class="flex items-center gap-2">
      <span class="inline-block w-2.5 h-2.5 rounded-full bg-[#6D0808] border border-[#EEEAD7]/40"></span>
      <span class="text-[#EEEAD7] font-medium">Audience Retention Curve (Most Replayed)</span>
    </div>
    <span class="text-[#EEEAD7] font-semibold">{Math.floor(currentTime)}s / {Math.floor(duration)}s</span>
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
    class="relative h-[70px] w-full cursor-pointer overflow-hidden rounded-lg bg-[#150000]/80 border border-[#757D6F]/20"
  >
    <!-- SVG Heatmap Curve with Crimson Gradient -->
    <svg viewBox="0 0 {svgWidth} {svgHeight}" preserveAspectRatio="none" class="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="heatGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6D0808" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#2D0000" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      
      {#if fillD}
        <path d={fillD} fill="url(#heatGradient)" />
        <path d={pathD} fill="none" stroke="#EEEAD7" stroke-width="2" stroke-linecap="round" stroke-opacity="0.8" />
      {/if}
    </svg>

    <!-- Highlighted Active Slice Range -->
    {#if duration > 0}
      {@const startPct = (selectedStart / duration) * 100}
      {@const widthPct = ((selectedEnd - selectedStart) / duration) * 100}
      <div
        class="absolute top-0 bottom-0 border-x-2 border-[#6D0808] bg-[#6D0808]/30 backdrop-blur-[1px] pointer-events-none transition-all duration-75"
        style="left: {startPct}%; width: {widthPct}%;"
      >
        <div class="absolute top-1 left-1.5 px-1.5 py-0.5 rounded bg-[#2D0000] border border-[#6D0808] text-[10px] font-mono text-[#EEEAD7] font-bold shadow">
          {Math.round(selectedEnd - selectedStart)}s CLIP
        </div>
      </div>
    {/if}

    <!-- Playhead cursor line -->
    {#if duration > 0}
      {@const cursorPct = (currentTime / duration) * 100}
      <div
        class="absolute top-0 bottom-0 w-[2px] bg-[#EEEAD7] shadow-lg pointer-events-none z-10"
        style="left: {cursorPct}%;"
      >
        <div class="w-2.5 h-2.5 -ml-1 -mt-0.5 rounded-full bg-[#EEEAD7] border border-[#2D0000] shadow-md"></div>
      </div>
    {/if}
  </div>

  <!-- Top 3 Peak Badges on bottom -->
  <div class="flex items-center gap-2 mt-2 pt-2 border-t border-[#757D6F]/20 text-xs overflow-x-auto pb-1">
    <span class="text-[#757D6F] font-mono text-[11px] whitespace-nowrap">HOTSPOTS:</span>
    {#each topClips as clip}
      <button
        type="button"
        onclick={() => onSeek(clip.start)}
        class="px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 whitespace-nowrap transition-all {selectedStart === clip.start ? 'bg-[#6D0808] text-[#EEEAD7] font-bold border border-[#870E0E]' : 'bg-[#2D0000] hover:bg-[#3D0404] text-[#A9B3A1] border border-[#757D6F]/30'}"
      >
        <span class="font-bold text-[#EEEAD7]">#{clip.rank}</span>
        <span>{clip.start}s - {clip.end}s</span>
        <span class="text-[10px] text-[#A9B3A1] font-sans">({clip.score}%)</span>
      </button>
    {/each}
  </div>
</div>
