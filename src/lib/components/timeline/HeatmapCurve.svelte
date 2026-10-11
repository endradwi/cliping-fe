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
  const svgHeight = 54;

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

<div class="relative w-full bg-[#0d1c42] border border-white/10 rounded-xl p-2.5 select-none font-mono">
  <div class="flex items-center justify-between text-xs text-slate-400 mb-1.5">
    <div class="flex items-center gap-1.5">
      <span class="inline-block w-2 h-2 rounded-full bg-[#fcf1d0] shadow-[0_0_8px_#fcf1d0]"></span>
      <span class="text-white font-medium text-[11px]">Kurva Retensi Penonton</span>
    </div>
    <span class="text-white font-semibold text-[11px]">{Math.floor(currentTime)}s / {Math.floor(duration)}s</span>
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
    class="relative h-[48px] w-full cursor-pointer overflow-hidden rounded-lg bg-[#010736] border border-white/10"
  >
    <!-- SVG Heatmap Curve with Cyan/Teal Waveform Gradient -->
    <svg viewBox="0 0 {svgWidth} {svgHeight}" preserveAspectRatio="none" class="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="heatGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fcf1d0" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#fcf1d0" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      
      {#if fillD}
        <path d={fillD} fill="url(#heatGradient)" />
        <path d={pathD} fill="none" stroke="#fcf1d0" stroke-width="2" stroke-linecap="round" stroke-opacity="0.9" />
      {/if}
    </svg>

    <!-- Highlighted Active Slice Range -->
    {#if duration > 0}
      {@const startPct = (selectedStart / duration) * 100}
      {@const widthPct = ((selectedEnd - selectedStart) / duration) * 100}
      <div
        class="absolute top-0 bottom-0 border-x-2 border-[#fcf1d0] bg-[#fcf1d0]/20 backdrop-blur-[1px] pointer-events-none transition-all duration-75"
        style="left: {startPct}%; width: {widthPct}%;"
      >
        <div class="absolute top-1 left-1.5 px-1.5 py-0.2 rounded bg-[#010736] border border-[#fcf1d0]/60 text-[9px] font-mono text-[#fcf1d0] font-bold shadow">
          {Math.round(selectedEnd - selectedStart)}s KLIP
        </div>
      </div>
    {/if}

    <!-- Playhead cursor line -->
    {#if duration > 0}
      {@const cursorPct = (currentTime / duration) * 100}
      <div
        class="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_#fcf1d0] pointer-events-none z-10"
        style="left: {cursorPct}%;"
      >
        <div class="w-2.5 h-2.5 -ml-1 -mt-0.5 rounded-full bg-white border border-[#010736] shadow-md"></div>
      </div>
    {/if}
  </div>

  <!-- Top 3 Peak Badges on bottom -->
  <div class="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5 text-xs overflow-x-auto pb-0.5">
    <span class="text-slate-500 font-mono text-[10px] whitespace-nowrap">MOMEN PEAK:</span>
    {#each topClips as clip}
      <button
        type="button"
        onclick={() => onSeek(clip.start)}
        class="px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1.5 whitespace-nowrap transition-all {selectedStart === clip.start ? 'bg-[#fcf1d0] text-black font-bold shadow-md' : 'bg-[#0d1c42] hover:bg-[#22396f] text-slate-300 border border-white/10'}"
      >
        <span>#{clip.rank}</span>
        <span class="opacity-80">({clip.score}%)</span>
      </button>
    {/each}
  </div>
</div>
