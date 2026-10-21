<script lang="ts">
  import { clipStore } from '../../stores/clip.svelte';
  import { resolveMediaUrl } from '../../services/api.client';
  import { Play, Pause, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-svelte';

  let {
    videoId = '',
    currentTime = 0,
    isPlaying = $bindable(false),
    burnSubtitles = true,
    aspectRatio = '9:16',
    clipStart = 0,
    clipEnd = 30,
    onTimeUpdate
  }: {
    videoId: string;
    currentTime: number;
    isPlaying: boolean;
    burnSubtitles: boolean;
    aspectRatio: string;
    clipStart?: number;
    clipEnd?: number;
    onTimeUpdate?: (time: number) => void;
  } = $props();

  let videoElement = $state<HTMLVideoElement | null>(null);
  let secondaryVideoElement = $state<HTMLVideoElement | null>(null);
  let isMuted = $state(false);
  let hasPlaybackError = $state<string | null>(null);
  let isBuffering = $state(false);

  // Auto-resolve video source: uses 0ms local blob first, then fallbacks to stream proxy
  const activeVideoSource = $derived.by(() => {
    if (clipStore.localVideoBlobUrl) return clipStore.localVideoBlobUrl;
    if (clipStore.analysisResult?.directVideoUrl) {
      return resolveMediaUrl(clipStore.analysisResult.directVideoUrl);
    }
    return '';
  });

  // Responsive frame dimensions filling the monitor area smoothly (CapCut Studio Style)
  const frameClass = $derived.by(() => {
    switch (aspectRatio) {
      case '16:9':
        return 'w-full max-w-[620px] aspect-[16/9] max-h-full';
      case '1:1':
        return 'h-full max-h-[50vh] aspect-square';
      case '4:5':
        return 'h-full max-h-[54vh] aspect-[4/5]';
      case '9:16':
      default:
        return 'h-full max-h-[58vh] aspect-[9/16]';
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

  function playVideo() {
    if (!videoElement) return;
    hasPlaybackError = null;
    const p = videoElement.play();
    if (p !== undefined) {
      p.catch((err) => {
        console.warn('Playback with audio blocked by browser autoplay policy, attempting muted fallback:', err);
        isMuted = true;
        if (videoElement) {
          videoElement.muted = true;
          videoElement.play().catch((mutedErr) => {
            console.error('Muted playback also blocked:', mutedErr);
            hasPlaybackError = 'Klik video untuk memutar';
          });
        }
      });
    }
    if (secondaryVideoElement && secondaryVideoElement.paused) {
      secondaryVideoElement.play().catch(() => {});
    }
  }

  function pauseVideo() {
    if (videoElement && !videoElement.paused) {
      videoElement.pause();
    }
    if (secondaryVideoElement && !secondaryVideoElement.paused) {
      secondaryVideoElement.pause();
    }
  }

  function togglePlay(e?: MouseEvent) {
    if (e) e.stopPropagation();
    if (activeVideoSource) {
      if (!videoElement) return;
      if (videoElement.paused) {
        videoElement.muted = isMuted;
        playVideo();
        isPlaying = true;
      } else {
        pauseVideo();
        isPlaying = false;
      }
    } else {
      isPlaying = !isPlaying;
    }
  }

  function toggleMute(e?: MouseEvent) {
    if (e) e.stopPropagation();
    isMuted = !isMuted;
    if (videoElement) {
      videoElement.muted = isMuted;
    }
  }

  function handleTimeUpdate() {
    if (!videoElement) return;
    const t = videoElement.currentTime;
    const start = clipStart ?? clipStore.selectedStart ?? 0;
    const end = clipEnd ?? clipStore.selectedEnd ?? 30;

    if (t >= end) {
      videoElement.currentTime = start;
      if (secondaryVideoElement) secondaryVideoElement.currentTime = start;
      onTimeUpdate?.(start);
    } else {
      onTimeUpdate?.(t);
    }
  }

  // Handle Seek from timeline or controls
  $effect(() => {
    if (videoElement && activeVideoSource) {
      if (Math.abs(videoElement.currentTime - currentTime) > 0.4) {
        videoElement.currentTime = currentTime;
        if (secondaryVideoElement) {
          secondaryVideoElement.currentTime = currentTime;
        }
      }
    }
  });

  // Handle outside play/pause state changes (Spacebar or dock buttons)
  $effect(() => {
    if (activeVideoSource && videoElement) {
      if (isPlaying && videoElement.paused) {
        playVideo();
      } else if (!isPlaying && !videoElement.paused) {
        pauseVideo();
      }
    }
  });

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

<div class="h-full w-full flex items-center justify-center p-1">
  <!-- Dynamic Phone / Desktop Frame (Clean, Unobstructed Video Monitor) -->
  <div class="relative {frameClass} bg-black rounded-2xl overflow-hidden border border-[#22396f]/40 shadow-2xl flex items-center justify-center group transition-all">
    <!-- TOP HOOK TITLE OVERLAY (Preset Title) -->
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

    {#if activeVideoSource}
      {#if clipStore.layoutMode === 'fit-blur'}
        <!-- Ambient Blurred Background + Sharp Centered Video -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="w-full h-full relative overflow-hidden flex items-center justify-center bg-black cursor-pointer" onclick={togglePlay}>
          <video
            bind:this={secondaryVideoElement}
            src={activeVideoSource}
            class="absolute inset-0 w-full h-full object-cover filter blur-xl scale-125 opacity-50 pointer-events-none"
            playsinline
            muted={true}
          ></video>
          <video
            bind:this={videoElement}
            src={activeVideoSource}
            class="relative max-w-full max-h-full object-contain z-1 shadow-2xl rounded-lg"
            playsinline
            preload="auto"
            muted={isMuted}
            ontimeupdate={handleTimeUpdate}
            onplay={() => isPlaying = true}
            onpause={() => isPlaying = false}
            onwaiting={() => isBuffering = true}
            onplaying={() => isBuffering = false}
            onerror={() => hasPlaybackError = 'Gagal memuat video stream'}
          ></video>
        </div>
      {:else}
        <!-- Single Focus with Interactive Camera Pan -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="w-full h-full relative overflow-hidden flex items-center justify-center bg-black cursor-pointer" onclick={togglePlay}>
          <video
            bind:this={videoElement}
            src={activeVideoSource}
            class="w-full h-full object-cover transition-all duration-150"
            style="object-position: {clipStore.panOffset * 100}% center;"
            playsinline
            preload="auto"
            muted={isMuted}
            ontimeupdate={handleTimeUpdate}
            onplay={() => isPlaying = true}
            onpause={() => isPlaying = false}
            onwaiting={() => isBuffering = true}
            onplaying={() => isBuffering = false}
            onerror={() => hasPlaybackError = 'Gagal memuat video stream'}
          ></video>
        </div>
      {/if}

      <!-- Center Floating Play Icon (When Paused) -->
      {#if !isPlaying}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px] z-10 cursor-pointer transition-opacity"
          onclick={togglePlay}
        >
          <div class="w-14 h-14 rounded-full bg-[#fcf1d0] text-[#010736] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition">
            <Play size={24} class="fill-[#010736] ml-1" />
          </div>
        </div>
      {/if}

      <!-- Floating Sound / Mute Toggle Button -->
      <button
        type="button"
        onclick={toggleMute}
        class="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/70 hover:bg-black text-[#fcf1d0] border border-white/20 shadow-lg backdrop-blur-sm transition hover:scale-105 active:scale-95"
        title={isMuted ? 'Nyalakan Suara (Unmute)' : 'Matikan Suara (Mute)'}
      >
        {#if isMuted}
          <VolumeX size={14} class="text-red-400" />
        {:else}
          <Volume2 size={14} class="text-emerald-400" />
        {/if}
      </button>

      <!-- Buffering Indicator -->
      {#if isBuffering}
        <div class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div class="p-3 rounded-xl bg-black/80 text-[#fcf1d0] flex items-center gap-2 border border-[#22396f]/40 shadow-xl">
            <Loader2 size={18} class="animate-spin text-[#fcf1d0]" />
            <span class="text-xs font-mono">Memuat video...</span>
          </div>
        </div>
      {/if}

      <!-- Playback Error Banner -->
      {#if hasPlaybackError}
        <div class="absolute bottom-12 inset-x-4 p-2.5 rounded-xl bg-red-950/90 border border-red-700 text-red-200 text-xs font-mono z-30 flex items-center justify-between shadow-2xl">
          <div class="flex items-center gap-1.5">
            <AlertCircle size={15} class="text-red-400 flex-shrink-0" />
            <span>{hasPlaybackError}</span>
          </div>
          <button
            type="button"
            onclick={togglePlay}
            class="px-2.5 py-1 rounded bg-[#fcf1d0] text-black font-bold text-[10px]"
          >
            Putar
          </button>
        </div>
      {/if}
    {:else if videoId}
      <iframe
        id="preview-iframe"
        src="https://www.youtube-nocookie.com/embed/{videoId}?start={Math.floor(clipStart)}&controls=1&modestbranding=1&rel=0"
        title="YouTube Preview"
        class={iframeClass.replace('pointer-events-none', '')}
        style="transform: scale(1.25) translateX({(0.5 - clipStore.panOffset) * 35}%);"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
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
  </div>
</div>
