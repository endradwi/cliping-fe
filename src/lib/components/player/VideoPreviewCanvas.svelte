<script lang="ts">
  import { Play, Pause, RotateCcw, RotateCw, Subtitles, Crop, Film } from 'lucide-svelte';
  import { clipStore } from '../../stores/clip.svelte';

  let {
    videoId = '',
    currentTime = 0,
    isPlaying = false,
    burnSubtitles = true,
    aspectRatio = '9:16',
    clipStart = 0,
    clipEnd = 30,
    onTogglePlay,
    onToggleSubtitles,
    onSeekRelative,
    onTimeUpdate
  }: {
    videoId: string;
    currentTime: number;
    isPlaying: boolean;
    burnSubtitles: boolean;
    aspectRatio: string;
    clipStart?: number;
    clipEnd?: number;
    onTogglePlay: () => void;
    onToggleSubtitles: () => void;
    onSeekRelative?: (seconds: number) => void;
    onTimeUpdate?: (time: number) => void;
  } = $props();

  let videoElement = $state<HTMLVideoElement | null>(null);
  let secondaryVideoElement = $state<HTMLVideoElement | null>(null);

  // Responsive frame dimensions avoiding any column overflow - Elegant Device Scale
  const frameClass = $derived.by(() => {
    switch (aspectRatio) {
      case '16:9':
        return 'w-full max-w-[440px] aspect-[16/9]';
      case '1:1':
        return 'w-[260px] sm:w-[300px] aspect-square';
      case '4:5':
        return 'w-[250px] sm:w-[280px] aspect-[4/5]';
      case '9:16':
      default:
        return 'w-[230px] sm:w-[260px] h-[410px] sm:h-[460px]';
    }
  });

  // Responsive iframe scaling matching each aspect ratio
  const iframeClass = $derived.by(() => {
    switch (aspectRatio) {
      case '16:9':
        return 'w-full h-full object-cover pointer-events-none';
      case '1:1':
        return 'w-[500px] h-full max-w-none pointer-events-none scale-110 object-cover';
      case '4:5':
        return 'w-[560px] h-full max-w-none pointer-events-none scale-115 object-cover';
      case '9:16':
      default:
        return 'w-[750px] h-full max-w-none pointer-events-none scale-125 object-cover';
    }
  });

  // Handle Seek from timeline or controls
  $effect(() => {
    if (videoElement && clipStore.analysisResult?.directVideoUrl) {
      if (Math.abs(videoElement.currentTime - currentTime) > 0.8) {
        videoElement.currentTime = currentTime;
      }
    }
    if (secondaryVideoElement && clipStore.analysisResult?.directVideoUrl) {
      if (Math.abs(secondaryVideoElement.currentTime - currentTime) > 0.8) {
        secondaryVideoElement.currentTime = currentTime;
      }
    }
  });

  // Real-time Playback Loop & Time Tracking
  $effect(() => {
    let animId: number | null = null;
    let timer: any = null;

    if (isPlaying) {
      if (videoElement && clipStore.analysisResult?.directVideoUrl) {
        if (videoElement.paused) {
          videoElement.play().catch(() => {});
        }
        if (secondaryVideoElement && secondaryVideoElement.paused) {
          secondaryVideoElement.play().catch(() => {});
        }

        const tick = () => {
          if (!videoElement) return;
          const t = videoElement.currentTime;
          const endBoundary = clipEnd || clipStore.selectedEnd || 30;
          const startBoundary = clipStart || clipStore.selectedStart || 0;

          if (t >= endBoundary) {
            videoElement.currentTime = startBoundary;
            if (secondaryVideoElement) secondaryVideoElement.currentTime = startBoundary;
            onTimeUpdate?.(startBoundary);
          } else {
            onTimeUpdate?.(t);
          }
          animId = requestAnimationFrame(tick);
        };
        animId = requestAnimationFrame(tick);
      } else {
        // Fallback ticker for YouTube embed preview
        timer = setInterval(() => {
          const endBoundary = clipEnd || clipStore.selectedEnd || 30;
          const startBoundary = clipStart || clipStore.selectedStart || 0;
          let nextTime = currentTime + 0.1;
          if (nextTime >= endBoundary) {
            nextTime = startBoundary;
          }
          onTimeUpdate?.(nextTime);
        }, 100);
      }
    } else {
      if (videoElement && !videoElement.paused) {
        videoElement.pause();
      }
      if (secondaryVideoElement && !secondaryVideoElement.paused) {
        secondaryVideoElement.pause();
      }
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (timer) clearInterval(timer);
    };
  });

  function formatTime(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}`;
  }

  // Find currently spoken transcript line synchronized to exact video timestamp
  const activeLine = $derived.by(() => {
    const transcript = clipStore.analysisResult?.transcript || [];
    return transcript.find(line => {
      const lineEnd = line.start + (line.duration || 2.5);
      return currentTime >= line.start && currentTime <= lineEnd;
    });
  });

  // Real-time Word-by-Word Karaoke & Chunk Calculation
  const subtitleState = $derived.by(() => {
    if (activeLine && activeLine.text) {
      const words = activeLine.text.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const lineDuration = Math.max(0.4, activeLine.duration || 2.5);
        const elapsed = Math.max(0, currentTime - activeLine.start);
        const progress = Math.min(0.99, elapsed / lineDuration);
        const currentWordIdx = Math.floor(progress * words.length);

        const chunkSize = Math.max(1, clipStore.wordsPerChunk || 2);
        const chunkIdx = Math.floor(currentWordIdx / chunkSize);
        const startIdx = chunkIdx * chunkSize;
        const chunkWords = words.slice(startIdx, startIdx + chunkSize);
        const activeInChunk = currentWordIdx - startIdx;

        return {
          chunkWords,
          activeInChunk,
          activeKey: `${activeLine.start}_${currentWordIdx}`
        };
      }
    }

    // Fallback display when paused or between spoken sentences
    const sampleWords = ['VIRAL', 'HOOK', 'CLIP'];
    return {
      chunkWords: sampleWords,
      activeInChunk: 0,
      activeKey: 'preview_idle'
    };
  });

  // Get animation class corresponding to store setting
  const animationClass = $derived.by(() => {
    const anim = clipStore.subtitleAnimation || 'POP';
    if (anim === 'OFF') return '';
    return `anim-${anim.toLowerCase()}`;
  });
</script>

<div class="flex flex-col items-center w-full">
  <!-- Dynamic Phone / Desktop Frame -->
  <div class="relative {frameClass} bg-[#0c0c0e] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl flex items-center justify-center group transition-all">
    {#if clipStore.analysisResult?.directVideoUrl}
      {#if clipStore.layoutMode === 'split'}
        <!-- Podcast Stacked Split-Screen (Top: Host 15%, Bottom: Guest 85%) -->
        <div class="w-full h-full flex flex-col overflow-hidden">
          <div class="h-1/2 w-full overflow-hidden relative border-b-2 border-white/20">
            <video
              bind:this={videoElement}
              src={clipStore.analysisResult.directVideoUrl}
              class="w-full h-full object-cover pointer-events-none"
              style="object-position: 15% center;"
              playsinline
              muted={false}
            ></video>
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 border border-[#D4FF00]/40 text-[9px] font-mono font-bold text-[#D4FF00] shadow">
              HOST (L)
            </span>
          </div>

          <div class="h-1/2 w-full overflow-hidden relative">
            <video
              bind:this={secondaryVideoElement}
              src={clipStore.analysisResult.directVideoUrl}
              class="w-full h-full object-cover pointer-events-none"
              style="object-position: 85% center;"
              playsinline
              muted={true}
            ></video>
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 border border-white/20 text-[9px] font-mono font-bold text-white/90 shadow">
              GUEST (R)
            </span>
          </div>
        </div>
      {:else if clipStore.layoutMode === 'fit-blur'}
        <!-- Ambient Blurred Background + Sharp Centered Video -->
        <div class="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
          <video
            bind:this={secondaryVideoElement}
            src={clipStore.analysisResult.directVideoUrl}
            class="absolute inset-0 w-full h-full object-cover filter blur-xl scale-125 opacity-50 pointer-events-none"
            playsinline
            muted={true}
          ></video>
          <video
            bind:this={videoElement}
            src={clipStore.analysisResult.directVideoUrl}
            class="relative max-w-full max-h-full object-contain pointer-events-none z-1 shadow-2xl rounded-lg"
            playsinline
            muted={false}
          ></video>
        </div>
      {:else}
        <!-- Single Focus with Interactive Camera Pan -->
        <video
          bind:this={videoElement}
          src={clipStore.analysisResult.directVideoUrl}
          class="w-full h-full object-cover pointer-events-none transition-all duration-150"
          style="object-position: {clipStore.panOffset * 100}% center;"
          playsinline
          muted={false}
        ></video>
      {/if}
    {:else if videoId}
      {#if clipStore.layoutMode === 'split'}
        <div class="w-full h-full flex flex-col overflow-hidden">
          <div class="h-1/2 w-full overflow-hidden relative border-b-2 border-white/20 flex items-center justify-center">
            <iframe
              src="https://www.youtube-nocookie.com/embed/{videoId}?start={Math.floor(currentTime)}&autoplay={isPlaying ? 1 : 0}&controls=0&modestbranding=1&rel=0"
              title="YouTube Preview Host"
              class="w-[750px] h-[400px] max-w-none pointer-events-none scale-125 object-cover"
              style="transform: scale(1.2) translateX(25%);"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 border border-[#D4FF00]/40 text-[9px] font-mono font-bold text-[#D4FF00]">
              HOST (L)
            </span>
          </div>
          <div class="h-1/2 w-full overflow-hidden relative flex items-center justify-center">
            <iframe
              src="https://www.youtube-nocookie.com/embed/{videoId}?start={Math.floor(currentTime)}&autoplay={isPlaying ? 1 : 0}&controls=0&modestbranding=1&rel=0"
              title="YouTube Preview Guest"
              class="w-[750px] h-[400px] max-w-none pointer-events-none scale-125 object-cover"
              style="transform: scale(1.2) translateX(-25%);"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 border border-white/20 text-[9px] font-mono font-bold text-white/90">
              GUEST (R)
            </span>
          </div>
        </div>
      {:else}
        <iframe
          id="preview-iframe"
          src="https://www.youtube-nocookie.com/embed/{videoId}?start={Math.floor(currentTime)}&autoplay={isPlaying ? 1 : 0}&controls=0&modestbranding=1&rel=0"
          title="YouTube Preview"
          class={iframeClass}
          style="transform: scale(1.25) translateX({(0.5 - clipStore.panOffset) * 35}%);"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      {/if}
    {:else}
      <div class="text-[#757D6F] text-sm font-mono text-center p-4">
        No video loaded
      </div>
    {/if}

    <!-- DYNAMIC KINETIC SUBTITLE OVERLAY (Synchronized Word-by-Word with Video) -->
    {#if burnSubtitles && (videoId || clipStore.analysisResult?.directVideoUrl)}
      <div
        class="absolute inset-x-3 text-center pointer-events-none transition-all px-2 z-10"
        style="top: {clipStore.subtitlePosY}%;"
      >
        <div
          class="inline-block max-w-full font-black tracking-wide uppercase leading-tight select-none"
          style="
            font-size: {Math.max(16, Math.min(36, clipStore.subtitleFontSize))}px;
            filter: {clipStore.subtitleGlow ? `drop-shadow(0 0 16px ${clipStore.subtitleColor}90) drop-shadow(0 4px 6px rgba(0,0,0,0.95))` : 'drop-shadow(0 4px 6px rgba(0,0,0,0.98))'};
            text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000;
          "
        >
          {#each subtitleState.chunkWords as word, idx (idx)}
            {@const isActiveKaraoke = idx === subtitleState.activeInChunk}
            <span
              class="inline-block mx-1.5 transition-all {isActiveKaraoke ? animationClass : ''}"
              style="
                color: {isActiveKaraoke ? clipStore.subtitleColor : '#FFFFFF'};
                transform-origin: center bottom;
              "
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

        <!-- Primary Play/Pause Pill with Electric Lime Accent -->
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

        <!-- Aspect Ratio switch toggle -->
        <button
          type="button"
          onclick={() => {
            const ratios: Array<'9:16' | '4:5' | '1:1' | '16:9'> = ['9:16', '4:5', '1:1', '16:9'];
            const nextIdx = (ratios.indexOf(clipStore.aspectRatio as any) + 1) % ratios.length;
            clipStore.aspectRatio = ratios[nextIdx];
          }}
          class="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-md text-[10px] text-white/90 transition hover:scale-105 active:scale-95 font-bold"
          title="Click to cycle aspect ratio (9:16, 4:5, 1:1, 16:9)"
        >
          <Crop size={11} />
          <span>{aspectRatio}</span>
        </button>

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

  <!-- FRAMING & PODCAST LAYOUT CONTROLLER -->
  <div class="w-full flex flex-col gap-2 p-2.5 bg-[#150000] border border-[#757D6F]/30 rounded-xl font-mono text-xs shadow-md mt-2">
    <div class="flex items-center justify-between">
      <span class="text-[10px] text-[#A9B3A1] font-bold flex items-center gap-1">
        <Film size={12} class="text-[#D4FF00]" />
        <span>PODCAST FRAMING & LAYOUT:</span>
      </span>
      <span class="text-[10px] text-[#D4FF00] font-bold uppercase">
        {clipStore.layoutMode === 'split' ? 'SPLIT (50/50)' : (clipStore.layoutMode === 'fit-blur' ? 'FIT BLUR' : 'SINGLE CAMERA')}
      </span>
    </div>

    <!-- 3 Quick Layout Tabs -->
    <div class="grid grid-cols-3 gap-1.5 p-1 bg-[#200202] rounded-lg border border-[#757D6F]/25 text-[11px]">
      <button
        type="button"
        onclick={() => clipStore.layoutMode = 'single'}
        class="py-1 px-2 rounded-md font-bold transition flex items-center justify-center gap-1 {clipStore.layoutMode === 'single' ? 'bg-[#D4FF00] text-black shadow' : 'text-[#A9B3A1] hover:text-white'}"
      >
        <span>Single</span>
      </button>

      <button
        type="button"
        onclick={() => clipStore.layoutMode = 'split'}
        class="py-1 px-2 rounded-md font-bold transition flex items-center justify-center gap-1 {clipStore.layoutMode === 'split' ? 'bg-[#D4FF00] text-black shadow' : 'text-[#A9B3A1] hover:text-white'}"
        title="Stack Host on top & Guest on bottom"
      >
        <span>Split 50/50</span>
      </button>

      <button
        type="button"
        onclick={() => clipStore.layoutMode = 'fit-blur'}
        class="py-1 px-2 rounded-md font-bold transition flex items-center justify-center gap-1 {clipStore.layoutMode === 'fit-blur' ? 'bg-[#D4FF00] text-black shadow' : 'text-[#A9B3A1] hover:text-white'}"
        title="Full video with blurred background"
      >
        <span>Fit Blur</span>
      </button>
    </div>

    <!-- Interactive Pan Slider & Presets when on Single Mode -->
    {#if clipStore.layoutMode === 'single'}
      <div class="flex flex-col gap-1.5 pt-1 border-t border-white/5">
        <div class="flex items-center justify-between text-[10px] text-[#A9B3A1]">
          <span>CAMERA FOCUS / PAN:</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick={() => clipStore.panOffset = 0.15}
              class="px-1.5 py-0.5 rounded bg-[#2D0000] hover:bg-[#3D0404] text-[10px] font-bold transition border border-[#757D6F]/30 {Math.abs(clipStore.panOffset - 0.15) < 0.05 ? 'border-[#D4FF00] text-[#D4FF00]' : 'text-[#A9B3A1]'}"
            >
              Host
            </button>
            <button
              type="button"
              onclick={() => clipStore.panOffset = 0.5}
              class="px-1.5 py-0.5 rounded bg-[#2D0000] hover:bg-[#3D0404] text-[10px] font-bold transition border border-[#757D6F]/30 {Math.abs(clipStore.panOffset - 0.5) < 0.05 ? 'border-[#D4FF00] text-[#D4FF00]' : 'text-[#A9B3A1]'}"
            >
              Center
            </button>
            <button
              type="button"
              onclick={() => clipStore.panOffset = 0.85}
              class="px-1.5 py-0.5 rounded bg-[#2D0000] hover:bg-[#3D0404] text-[10px] font-bold transition border border-[#757D6F]/30 {Math.abs(clipStore.panOffset - 0.85) < 0.05 ? 'border-[#D4FF00] text-[#D4FF00]' : 'text-[#A9B3A1]'}"
            >
              Guest
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[9px] text-[#757D6F]">L</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={clipStore.panOffset}
            class="accent-[#D4FF00] h-1.5 w-full bg-[#2D0000] rounded-lg cursor-pointer"
          />
          <span class="text-[9px] text-[#757D6F]">R</span>
          <span class="text-[10px] text-[#D4FF00] font-bold w-9 text-right font-mono">
            {Math.round(clipStore.panOffset * 100)}%
          </span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Keyboard Shortcuts Cheat-Sheet -->
  <div class="flex items-center gap-2 mt-2 text-[10px] font-mono text-[#757D6F] flex-wrap justify-center">
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
