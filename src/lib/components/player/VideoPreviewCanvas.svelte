<script lang="ts">
  import { Play, Pause, RotateCcw, RotateCw, Subtitles, Crop } from 'lucide-svelte';
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
        return 'w-full max-w-[460px] aspect-[16/9] max-h-[46vh]';
      case '1:1':
        return 'w-auto h-[44vh] max-h-[380px] aspect-square';
      case '4:5':
        return 'w-auto h-[48vh] max-h-[420px] aspect-[4/5]';
      case '9:16':
      default:
        return 'w-auto h-[48vh] max-h-[430px] aspect-[9/16]';
    }
  });

  // Responsive iframe scaling matching each aspect ratio
  const iframeClass = $derived.by(() => {
    switch (aspectRatio) {
      case '16:9':
        return 'w-full h-full object-cover pointer-events-none';
      case '1:1':
        return 'w-[520px] h-full max-w-none pointer-events-none scale-110 object-cover';
      case '4:5':
        return 'w-[580px] h-full max-w-none pointer-events-none scale-115 object-cover';
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
    const t = currentTime - (clipStore.subtitleSyncOffset || 0);
    return transcript.find(line => {
      const lineEnd = line.start + (line.duration || 2.5);
      return t >= line.start && t <= lineEnd;
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
    const sampleWords = ['VIRAL', 'HOOK', 'MOMENT'];
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
    <!-- TOP HOOK TITLE OVERLAY (Preset Title like SOCL Visuals) -->
    {#if clipStore.showHookTitle && (clipStore.hookTitleText || clipStore.analysisResult?.title)}
      <div
        class="absolute inset-x-3 text-center pointer-events-none z-20 px-2 transition-all"
        style="top: {clipStore.hookTitlePosY}%;"
      >
        <div
          class="inline-block max-w-[92%] px-3 py-1.5 rounded-lg font-black tracking-tight uppercase shadow-2xl leading-snug {
            clipStore.hookTitleTheme === 'yellow' ? 'bg-[#FFE600] text-black border border-black/20' :
            clipStore.hookTitleTheme === 'red' ? 'bg-[#FF1E1E] text-white border border-white/20' :
            clipStore.hookTitleTheme === 'neon' ? 'bg-[#fcf1d0] text-black border border-black/20' :
            'bg-black/90 text-white border border-white/25'
          }"
          style="font-size: 13px;"
        >
          {clipStore.hookTitleText || clipStore.analysisResult?.title}
        </div>
      </div>
    {/if}

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
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 border border-[#fcf1d0]/40 text-[9px] font-mono font-bold text-[#fcf1d0] shadow z-10">
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
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 border border-white/20 text-[9px] font-mono font-bold text-white/90 shadow z-10">
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
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 border border-[#fcf1d0]/40 text-[9px] font-mono font-bold text-[#fcf1d0] z-10">
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
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 border border-white/20 text-[9px] font-mono font-bold text-white/90 z-10">
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
      <div class="text-[#22396f] text-sm font-mono text-center p-4">
        No video loaded
      </div>
    {/if}

    <!-- DYNAMIC KINETIC SUBTITLE OVERLAY (Word-by-Word with Box Highlight or Glow) -->
    {#if burnSubtitles && (videoId || clipStore.analysisResult?.directVideoUrl)}
      <div
        class="absolute inset-x-3 text-center pointer-events-none transition-all px-2 z-10"
        style="top: {clipStore.subtitlePosY}%;"
      >
        <div
          class="inline-block max-w-full font-black tracking-wide uppercase leading-tight select-none"
          style="
            font-size: {Math.max(16, Math.min(36, clipStore.subtitleFontSize))}px;
            text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000;
          "
        >
          {#each subtitleState.chunkWords as word, idx (idx)}
            {@const isActiveKaraoke = idx === subtitleState.activeInChunk}
            {@const isCustomHighlighted = clipStore.isWordHighlighted(word)}
            {@const shouldHighlight = isActiveKaraoke || isCustomHighlighted}
            {#if shouldHighlight}
              {#if clipStore.captionHighlightStyle === 'box'}
                <!-- Hormozi Box Highlight (SOCL Visuals Signature) -->
                <span
                  class="inline-block mx-1 px-2 py-0.5 rounded-md font-black shadow-2xl transition-all {animationClass}"
                  style="
                    background-color: {clipStore.subtitleColor};
                    color: #000000;
                    text-shadow: none;
                    transform-origin: center bottom;
                  "
                >
                  {word}
                </span>
              {:else}
                <!-- Glow & Vibrant Text -->
                <span
                  class="inline-block mx-1.5 transition-all {animationClass}"
                  style="
                    color: {clipStore.subtitleColor};
                    filter: {clipStore.subtitleGlow ? `drop-shadow(0 0 16px ${clipStore.subtitleColor}90)` : 'none'};
                    transform-origin: center bottom;
                  "
                >
                  {word}
                </span>
              {/if}
            {:else}
              <span
                class="inline-block mx-1.5 text-white transition-all opacity-95"
                style="transform-origin: center bottom;"
              >
                {word}
              </span>
            {/if}
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
          class="w-7 h-7 rounded-full bg-[#fcf1d0] text-black font-bold flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
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
          title="Ubah Rasio Layar"
        >
          <Crop size={11} />
          <span>{aspectRatio}</span>
        </button>

        <!-- Subtitles Toggle Pill -->
        <button
          type="button"
          onclick={onToggleSubtitles}
          class="px-2 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 {burnSubtitles ? 'bg-[#fcf1d0]/20 text-[#fcf1d0] border border-[#fcf1d0]/40' : 'bg-white/5 text-white/40'}"
          title="Toggle Subtitle"
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
  <div class="flex items-center gap-2 mt-2 text-[10px] font-mono text-[#22396f] flex-wrap justify-center">
    <span class="px-1.5 py-0.5 bg-[#0d1c42] border border-[#22396f]/30 rounded text-[#fcf1d0]">Space</span>
    <span>Play</span>
    <span>•</span>
    <span class="px-1.5 py-0.5 bg-[#0d1c42] border border-[#22396f]/30 rounded text-[#fcf1d0]">I / O</span>
    <span>In/Out</span>
    <span>•</span>
    <span class="px-1.5 py-0.5 bg-[#0d1c42] border border-[#22396f]/30 rounded text-[#fcf1d0]">J / L</span>
    <span>±5s</span>
  </div>
</div>
