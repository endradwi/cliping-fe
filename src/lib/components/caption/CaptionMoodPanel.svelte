<script lang="ts">
  import { clipStore, type SubtitleAnimation } from '../../stores/clip.svelte';
  import { Sparkles, Crop, Flame, Layers, Download, Check } from 'lucide-svelte';

  let {
    activeTranscriptText = '',
    onRender
  }: {
    activeTranscriptText: string;
    onRender: () => void;
  } = $props();

  const aspectRatios = [
    { id: '9:16' as const, label: '9:16', desc: 'Shorts/TikTok/Reels' },
    { id: '4:5' as const, label: '4:5', desc: 'IG Portrait Feed' },
    { id: '1:1' as const, label: '1:1', desc: 'Square Post' },
    { id: '16:9' as const, label: '16:9', desc: 'YouTube Landscape' }
  ];

  const colorPalette = [
    { label: 'Electric Lime', color: '#D4FF00' },
    { label: 'Pure White', color: '#FFFFFF' },
    { label: 'Cyber Gold', color: '#FFE600' },
    { label: 'Sunset Orange', color: '#FF6B00' },
    { label: 'Hot Pink', color: '#FF2A85' },
    { label: 'Ice Cyan', color: '#00F0FF' },
    { label: 'Emerald Green', color: '#10B981' },
    { label: 'Soft Cream', color: '#EEEAD7' }
  ];

  const animationList: SubtitleAnimation[] = [
    'POP', 'FADE', 'RISE', 'DROP', 'ZOOM', 'TYPE', 'OFF'
  ];
</script>

<div class="flex flex-col gap-4 p-4 sm:p-5 bg-[#200202]/80 border border-[#757D6F]/30 rounded-2xl backdrop-blur-md shadow-xl text-[#EEEAD7]">
  <!-- Header: CAPTION MOOD -->
  <div class="flex items-center justify-between pb-3 border-b border-[#757D6F]/20">
    <div class="flex items-center gap-2">
      <div class="w-2.5 h-2.5 rounded-full bg-[#D4FF00] animate-pulse"></div>
      <span class="text-xs font-mono font-bold tracking-wider text-[#EEEAD7] uppercase">STYLE & FORMAT STUDIO</span>
      <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#150000] text-[#A9B3A1] border border-[#757D6F]/30">PRESETS</span>
    </div>
    <span class="text-[11px] font-mono text-[#D4FF00] font-bold">● LIVE PREVIEW</span>
  </div>

  <!-- VIDEO FORMAT & ASPECT RATIO SELECTOR -->
  <div class="flex flex-col gap-1.5 p-3 bg-[#150000] border border-[#757D6F]/30 rounded-xl">
    <div class="flex justify-between items-center text-[11px] font-mono text-[#A9B3A1]">
      <span class="flex items-center gap-1.5">
        <Crop size={14} class="text-[#D4FF00]" />
        <span>VIDEO FORMAT & ASPECT RATIO</span>
      </span>
      <span class="font-bold text-[#D4FF00]">{clipStore.aspectRatio}</span>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1">
      {#each aspectRatios as fmt}
        <button
          type="button"
          onclick={() => clipStore.aspectRatio = fmt.id}
          class="p-2 rounded-xl text-left font-mono transition-all border flex flex-col justify-between {clipStore.aspectRatio === fmt.id ? 'bg-[#6D0808] border-[#870E0E] text-[#EEEAD7] shadow-lg shadow-black/60 scale-[1.02]' : 'bg-[#2D0000]/60 border-[#757D6F]/25 text-[#A9B3A1] hover:text-[#EEEAD7]'}"
        >
          <div class="flex items-center justify-between w-full">
            <span class="text-xs font-bold">{fmt.label}</span>
            {#if clipStore.aspectRatio === fmt.id}
              <Check size={13} class="text-[#D4FF00]" />
            {/if}
          </div>
          <span class="text-[9px] opacity-75 mt-0.5 truncate">{fmt.desc}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Segmented Pill: BURN SUBTITLES INTO CLIP -->
  <div class="flex flex-col gap-1.5">
    <div class="flex justify-between items-center text-[11px] font-mono text-[#A9B3A1]">
      <span class="tracking-wide uppercase">BURN SUBTITLES INTO CLIP</span>
      <span class="font-bold {clipStore.burnSubtitles ? 'text-[#D4FF00]' : 'text-[#757D6F]'}">
        {clipStore.burnSubtitles ? 'ON' : 'OFF'}
      </span>
    </div>
    <div class="grid grid-cols-2 p-1 bg-[#150000] rounded-xl border border-[#757D6F]/30">
      <button
        type="button"
        onclick={() => clipStore.burnSubtitles = true}
        class="py-1.5 rounded-lg text-xs font-mono font-bold transition {clipStore.burnSubtitles ? 'bg-[#D4FF00] text-black shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
      >
        ON
      </button>
      <button
        type="button"
        onclick={() => clipStore.burnSubtitles = false}
        class="py-1.5 rounded-lg text-xs font-mono font-bold transition {!clipStore.burnSubtitles ? 'bg-[#6D0808] text-[#EEEAD7] shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
      >
        OFF
      </button>
    </div>
  </div>

  {#if clipStore.burnSubtitles}
    <!-- Subtitle Style (Color Swatches) -->
    <div class="flex flex-col gap-2">
      <span class="text-[11px] font-mono text-[#A9B3A1] tracking-wide uppercase">
        SUBTITLE STYLE (PALETTE)
      </span>
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        {#each colorPalette as item}
          <button
            type="button"
            onclick={() => clipStore.subtitleColor = item.color}
            title={item.label}
            class="w-7 h-7 rounded-full flex-shrink-0 transition-all border-2 relative flex items-center justify-center {clipStore.subtitleColor === item.color ? 'scale-110 border-white ring-2 ring-[#D4FF00]' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}"
            style="background-color: {item.color};"
          >
            {#if clipStore.subtitleColor === item.color}
              <div class="w-1.5 h-1.5 rounded-full bg-black"></div>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- GLOW EFFECT Toggle -->
    <div class="flex flex-col gap-1.5">
      <div class="flex justify-between items-center text-[11px] font-mono text-[#A9B3A1]">
        <span class="tracking-wide uppercase">GLOW EFFECT · OFF = CLEAN OUTLINE</span>
        <span class="font-bold {clipStore.subtitleGlow ? 'text-[#D4FF00]' : 'text-[#757D6F]'}">
          {clipStore.subtitleGlow ? 'ON' : 'OFF'}
        </span>
      </div>
      <div class="grid grid-cols-2 p-1 bg-[#150000] rounded-xl border border-[#757D6F]/30">
        <button
          type="button"
          onclick={() => clipStore.subtitleGlow = true}
          class="py-1.5 rounded-lg text-xs font-mono font-bold transition {clipStore.subtitleGlow ? 'bg-[#EEEAD7] text-[#150000] shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
        >
          GLOW ON
        </button>
        <button
          type="button"
          onclick={() => clipStore.subtitleGlow = false}
          class="py-1.5 rounded-lg text-xs font-mono font-bold transition {!clipStore.subtitleGlow ? 'bg-[#3D0404] text-[#EEEAD7] shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
        >
          OUTLINE ONLY
        </button>
      </div>
    </div>

    <!-- Animation matrix (2x4 Grid of Pills) -->
    <div class="flex flex-col gap-1.5">
      <span class="text-[11px] font-mono text-[#A9B3A1] tracking-wide uppercase">
        ANIMATION · WORD-BY-WORD "TYPE"
      </span>
      <div class="grid grid-cols-4 gap-1.5">
        {#each animationList as anim}
          <button
            type="button"
            onclick={() => clipStore.subtitleAnimation = anim}
            class="py-1.5 px-2 rounded-lg text-[11px] font-mono transition text-center {clipStore.subtitleAnimation === anim ? 'bg-[#D4FF00] text-black font-bold shadow' : 'bg-[#150000] text-[#A9B3A1] hover:text-[#EEEAD7] border border-[#757D6F]/20'}"
          >
            {anim}
          </button>
        {/each}
      </div>
    </div>

    <!-- WORDS PER CHUNK (1W, 2W, 3W, 4W) -->
    <div class="flex flex-col gap-1.5">
      <div class="flex justify-between items-center text-[11px] font-mono text-[#A9B3A1]">
        <span class="tracking-wide uppercase">WORDS PER CHUNK</span>
        <span class="font-bold text-[#D4FF00]">{clipStore.wordsPerChunk} WORDS</span>
      </div>
      <div class="grid grid-cols-4 gap-1.5 p-1 bg-[#150000] rounded-xl border border-[#757D6F]/30">
        {#each [1, 2, 3, 4] as num}
          <button
            type="button"
            onclick={() => clipStore.wordsPerChunk = num}
            class="py-1 rounded-lg text-xs font-mono font-bold transition {clipStore.wordsPerChunk === num ? 'bg-[#D4FF00] text-black shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
          >
            {num}W
          </button>
        {/each}
      </div>
    </div>

    <!-- Sliders: Font Size & Position Y -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#150000] border border-[#757D6F]/30 rounded-xl">
      <div class="flex flex-col gap-1">
        <div class="flex justify-between items-center text-[10px] font-mono text-[#A9B3A1]">
          <span>FONT SIZE</span>
          <span class="text-[#EEEAD7] font-bold">{clipStore.subtitleFontSize}px</span>
        </div>
        <input
          type="range"
          min="18"
          max="42"
          step="1"
          bind:value={clipStore.subtitleFontSize}
          class="accent-[#D4FF00] h-1.5 bg-[#2D0000] rounded-lg cursor-pointer"
        />
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex justify-between items-center text-[10px] font-mono text-[#A9B3A1]">
          <span>Y POSITION</span>
          <span class="text-[#EEEAD7] font-bold">{clipStore.subtitlePosY}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="90"
          step="1"
          bind:value={clipStore.subtitlePosY}
          class="accent-[#D4FF00] h-1.5 bg-[#2D0000] rounded-lg cursor-pointer"
        />
      </div>
    </div>
  {/if}

  <!-- Batch Render CTA (Reflecting chosen format) -->
  <button
    type="button"
    disabled={clipStore.isRendering}
    onclick={onRender}
    class="w-full py-3 px-4 rounded-xl font-bold font-mono text-sm tracking-wide flex items-center justify-center gap-2 transition shadow-xl bg-[#D4FF00] hover:bg-[#c7f000] text-black active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Download size={16} class="text-black" />
    <span>⬇ Render Clip ({clipStore.aspectRatio})</span>
  </button>
</div>
