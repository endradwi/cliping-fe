<script lang="ts">
  import { Play, Pause, RotateCcw, RotateCw, Subtitles, Maximize2, Crop } from 'lucide-svelte';
  import { clipStore } from '../../stores/clip.svelte';

  let {
    videoId = '',
    currentTime = 0,
    isPlaying = false,
    burnSubtitles = true,
    aspectRatio = '9:16',
    activeDialogueText = '',
    onTogglePlay,
    onToggleSubtitles,
    onSeekRelative
  }: {
    videoId: string;
    currentTime: number;
    isPlaying: boolean;
    burnSubtitles: boolean;
    aspectRatio: string;
    activeDialogueText?: string;
    onTogglePlay: () => void;
    onToggleSubtitles: () => void;
    onSeekRelative?: (seconds: number) => void;
  } = $props();

  // Responsive frame dimensions avoiding any column overflow
  const frameClass = $derived.by(() => {
    switch (aspectRatio) {
      case '16:9':
        return 'w-full max-w-[440px] aspect-[16/9]';
      case '1:1':
        return 'w-[280px] sm:w-[320px] aspect-square';
      case '9:16':
      default:
        return 'w-[260px] sm:w-[290px] h-[460px] sm:h-[515px]';
    }
  });

  // Responsive iframe scaling matching each aspect ratio
  const iframeClass = $derived.by(() => {
    switch (aspectRatio) {
      case '16:9':
        return 'w-full h-full object-cover pointer-events-none';
      case '1:1':
        return 'w-[500px] h-full max-w-none pointer-events-none scale-110 object-cover';
      case '9:16':
      default:
        return 'w-[750px] h-full max-w-none pointer-events-none scale-125 object-cover';
    }
  });

  function formatTime(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}`;
  }

  // Generate words preview based on active dialogue or sample hook
  const displayWords = $derived.by(() => {
    if (activeDialogueText && activeDialogueText.trim().length > 0) {
      return activeDialogueText.trim().split(/\s+/).slice(0, 8);
    }
    return ['VIRAL', 'HOOK', 'MOMENT', 'DETECTED'];
  });
</script>

<div class="flex flex-col items-center w-full">
  <!-- Dynamic Phone / Desktop Frame -->
  <div class="relative {frameClass} bg-[#0c0c0e] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl flex items-center justify-center group transition-all">
    {#if videoId}
      <iframe
        id="preview-iframe"
        src="https://www.youtube-nocookie.com/embed/{videoId}?start={Math.floor(currentTime)}&autoplay={isPlaying ? 1 : 0}&controls=0&modestbranding=1&rel=0"
        title="YouTube Preview"
        class={iframeClass}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
    {:else}
      <div class="text-[#757D6F] text-sm font-mono text-center p-4">
        No video loaded
      </div>
    {/if}

    <!-- Simulated Kinetic Subtitle Overlay -->
    {#if burnSubtitles && videoId}
      <div
        class="absolute inset-x-3 text-center pointer-events-none transition-all px-2 z-10"
        style="top: {clipStore.subtitlePosY}%;"
      >
        <div
          class="inline-block max-w-full font-black tracking-wide uppercase leading-tight select-none"
          style="
            font-size: {Math.max(16, Math.min(32, clipStore.subtitleFontSize))}px;
            filter: {clipStore.subtitleGlow ? `drop-shadow(0 0 14px ${clipStore.subtitleColor}80) drop-shadow(0 4px 6px rgba(0,0,0,0.9))` : 'drop-shadow(0 4px 6px rgba(0,0,0,0.95))'};
            text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000;
          "
        >
          {#each displayWords as word, idx}
            {@const isHighlighted = clipStore.highlightedWordIndices.includes(idx)}
            <span
              class="inline-block mx-1 transition-all {clipStore.subtitleAnimation === 'POP' ? 'scale-105' : ''}"
              style="color: {isHighlighted ? clipStore.subtitleColor : '#FFFFFF'};"
            >
              {word}
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- FLOATING CAPSULE DOCK (Glassmorphism Pill Control Bar) -->
    <div class="absolute bottom-4 inset-x-3 flex justify-center z-20 pointer-events-auto">
      <div class="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-black/85 backdrop-blur-xl border border-white/15 rounded-full shadow-2xl shadow-black/80 text-white font-mono text-xs">
        <!-- Rewind 5s -->
        <button
          type="button"
          onclick={() => onSeekRelative ? onSeekRelative(-5) : null}
          class="p-1 text-white/60 hover:text-white transition-colors hover:scale-110 active:scale-95"
          title="Rewind 5s (J)"
        >
          <RotateCcw size={14} />
        </button>

        <!-- Primary Play/Pause Pill with Electric Lime / Accent -->
        <button
          type="button"
          onclick={onTogglePlay}
          class="w-7 h-7 rounded-full bg-[#D4FF00] text-black font-bold flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
          title="Play / Pause (Space)"
        >
          {#if isPlaying}
            <Pause size={14} class="fill-black" />
          {:else}
            <Play size={14} class="fill-black ml-0.5" />
          {/if}
        </button>

        <!-- Forward 5s -->
        <button
          type="button"
          onclick={() => onSeekRelative ? onSeekRelative(5) : null}
          class="p-1 text-white/60 hover:text-white transition-colors hover:scale-110 active:scale-95"
          title="Forward 5s (L)"
        >
          <RotateCw size={14} />
        </button>

        <!-- Aspect Ratio badge -->
        <div class="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md text-[10px] text-white/70">
          <Crop size={11} />
          <span>{aspectRatio}</span>
        </div>

        <!-- Subtitles Toggle Pill -->
        <button
          type="button"
          onclick={onToggleSubtitles}
          class="px-2 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 {burnSubtitles ? 'bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40' : 'bg-white/5 text-white/40'}"
          title="Toggle Subtitles"
        >
          <Subtitles size={12} />
          <span>CC</span>
        </button>

        <!-- Tabular Monospace Time Counter -->
        <span class="text-[11px] font-mono text-white/75 px-1 tracking-tight">
          {formatTime(currentTime)} / {formatTime(clipStore.selectedDuration)}
        </span>
      </div>
    </div>
  </div>

  <!-- Keyboard Shortcuts Cheat-Sheet -->
  <div class="flex items-center gap-2 mt-3 text-[11px] font-mono text-[#757D6F] flex-wrap justify-center">
    <span class="px-1.5 py-0.5 bg-[#2D0000] border border-[#757D6F]/30 rounded text-[#EEEAD7]">Space</span>
    <span>Play</span>
    <span>•</span>
    <span class="px-1.5 py-0.5 bg-[#2D0000] border border-[#757D6F]/30 rounded text-[#EEEAD7]">I / O</span>
    <span>In/Out</span>
    <span>•</span>
    <span class="px-1.5 py-0.5 bg-[#2D0000] border border-[#757D6F]/30 rounded text-[#EEEAD7]">J / L</span>
    <span>±5s</span>
  </div>
</div>
