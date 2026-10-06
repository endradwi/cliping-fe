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

  const aspectMap: Record<string, string> = {
    '9:16': 'w-[280px] h-[497px]',
    '1:1': 'w-[360px] h-[360px]',
    '16:9': 'w-[560px] h-[315px]'
  };

  let aspectClass = $derived(aspectMap[aspectRatio] || 'w-[280px] h-[497px]');
</script>

<div class="flex flex-col items-center">
  <!-- 9:16 Canvas Phone Mockup Frame -->
  <div class="relative {aspectClass} bg-neutral-950 rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-2xl flex items-center justify-center group transition-all">
    {#if videoId}
      <!-- Embedded YouTube preview iframe -->
      <iframe
        id="preview-iframe"
        src="https://www.youtube-nocookie.com/embed/{videoId}?start={Math.floor(currentTime)}&autoplay={isPlaying ? 1 : 0}&controls=0&modestbranding=1&rel=0"
        title="YouTube Preview"
        class="w-[700px] h-[497px] max-w-none pointer-events-none scale-125 object-cover"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
    {:else}
      <div class="text-neutral-600 text-sm font-mono text-center p-4">
        No video loaded
      </div>
    {/if}

    <!-- Simulated Karaoke Subtitle Overlay (if enabled) -->
    {#if burnSubtitles && videoId}
      <div class="absolute bottom-16 inset-x-4 text-center pointer-events-none">
        <span class="inline-block px-3 py-1 bg-black/85 border border-neutral-700/60 rounded-lg text-sm font-black tracking-wide text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <span class="text-yellow-400">UNBELIEVABLE</span> VIRAL MOMENT
        </span>
      </div>
    {/if}

    <!-- Quick action controls overlay on hover -->
    <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
      <button
        type="button"
        onclick={onTogglePlay}
        class="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
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
        class="p-2.5 rounded-full {burnSubtitles ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800 text-neutral-400'} shadow transition-transform hover:scale-105"
        title="Toggle Subtitles"
      >
        <Subtitles size={18} />
      </button>
    </div>
  </div>

  <!-- Keyboard Shortcuts Cheat-Sheet (Linear Style) -->
  <div class="flex items-center gap-2 mt-3 text-[11px] font-mono text-neutral-400">
    <span class="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-300">Space</span>
    <span>Play/Pause</span>
    <span class="text-neutral-600">•</span>
    <span class="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-300">I</span>
    <span>Set In</span>
    <span class="text-neutral-600">•</span>
    <span class="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-300">O</span>
    <span>Set Out</span>
    <span class="text-neutral-600">•</span>
    <span class="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-300">J/L</span>
    <span>±5s</span>
  </div>
</div>
