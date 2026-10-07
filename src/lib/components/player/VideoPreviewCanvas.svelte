<script lang="ts">
  import { Play, Pause, Subtitles } from 'lucide-svelte';

  let {
    videoId = '',
    currentTime = 0,
    isPlaying = false,
    burnSubtitles = true,
    aspectRatio = '9:16',
    onTogglePlay,
    onToggleSubtitles
  }: {
    videoId: string;
    currentTime: number;
    isPlaying: boolean;
    burnSubtitles: boolean;
    aspectRatio: string;
    onTogglePlay: () => void;
    onToggleSubtitles: () => void;
  } = $props();

  // Responsive frame dimensions avoiding any column overflow
  const frameClass = $derived.by(() => {
    switch (aspectRatio) {
      case '16:9':
        return 'w-full max-w-[420px] aspect-[16/9]';
      case '1:1':
        return 'w-[280px] sm:w-[320px] aspect-square';
      case '9:16':
      default:
        return 'w-[260px] sm:w-[280px] h-[460px] sm:h-[497px]';
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
        return 'w-[700px] h-full max-w-none pointer-events-none scale-125 object-cover';
    }
  });
</script>

<div class="flex flex-col items-center w-full">
  <!-- Dynamic Phone / Desktop Frame -->
  <div class="relative {frameClass} bg-[#2D0000] rounded-2xl overflow-hidden border-2 border-[#757D6F]/40 shadow-2xl flex items-center justify-center group transition-all">
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

    <!-- Simulated Subtitle Overlay -->
    {#if burnSubtitles && videoId}
      <div class="absolute {aspectRatio === '16:9' ? 'bottom-8 inset-x-2' : 'bottom-14 inset-x-4'} text-center pointer-events-none transition-all">
        <span class="inline-block px-2.5 py-1 bg-[#150000]/90 border border-[#757D6F]/50 rounded-lg text-xs sm:text-sm font-black tracking-wide text-[#EEEAD7] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <span class="text-[#EEEAD7] bg-[#6D0808] px-1.5 py-0.5 rounded mr-1">VIRAL</span> HIGHLIGHT
        </span>
      </div>
    {/if}

    <!-- Quick action controls overlay on hover -->
    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
      <button
        type="button"
        onclick={onTogglePlay}
        class="w-12 h-12 rounded-full bg-[#6D0808] text-[#EEEAD7] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 border border-[#EEEAD7]/30"
      >
        {#if isPlaying}
          <Pause size={22} />
        {:else}
          <Play size={22} class="ml-0.5" />
        {/if}
      </button>

      <button
        type="button"
        onclick={onToggleSubtitles}
        class="p-2.5 rounded-full {burnSubtitles ? 'bg-[#EEEAD7] text-[#6D0808] font-bold' : 'bg-[#2D0000] text-[#757D6F]'} shadow transition-transform hover:scale-105 border border-[#757D6F]/40"
        title="Toggle Subtitles"
      >
        <Subtitles size={18} />
      </button>
    </div>
  </div>

  <!-- Keyboard Shortcuts Cheat-Sheet -->
  <div class="flex items-center gap-2 mt-3 text-[11px] font-mono text-[#757D6F] flex-wrap justify-center">
    <span class="px-1.5 py-0.5 bg-[#2D0000] border border-[#757D6F]/30 rounded text-[#EEEAD7]">Space</span>
    <span>Play/Pause</span>
    <span>•</span>
    <span class="px-1.5 py-0.5 bg-[#2D0000] border border-[#757D6F]/30 rounded text-[#EEEAD7]">I</span>
    <span>Set In</span>
    <span>•</span>
    <span class="px-1.5 py-0.5 bg-[#2D0000] border border-[#757D6F]/30 rounded text-[#EEEAD7]">O</span>
    <span>Set Out</span>
    <span>•</span>
    <span class="px-1.5 py-0.5 bg-[#2D0000] border border-[#757D6F]/30 rounded text-[#EEEAD7]">J/L</span>
    <span>±5s</span>
  </div>
</div>
