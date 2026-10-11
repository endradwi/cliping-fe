<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import VideoPreviewCanvas from '../components/player/VideoPreviewCanvas.svelte';
  import HeatmapCurve from '../components/timeline/HeatmapCurve.svelte';
  import ClipCarouselTray from '../components/timeline/ClipCarouselTray.svelte';
  import CaptionMoodPanel from '../components/caption/CaptionMoodPanel.svelte';
  import { triggerRenderClip } from '../services/api.client';
  import type { CandidateClip } from '../types';
  import { Layers, ArrowRight, Play, Pause, ChevronUp, Sliders } from 'lucide-svelte';

  let currentTime = $state(0);
  let isPlaying = $state(false);
  let showStickyMini = $state(false);
  let mainPlayerRef = $state<HTMLElement | null>(null);

  // Compute live spoken dialogue transcript for the active clip range
  let activeTranscriptLines = $derived.by(() => {
    const all = clipStore.analysisResult?.transcript || [];
    return all.filter(line => {
      const lineEnd = line.start + (line.duration || 2.5);
      return lineEnd >= clipStore.selectedStart && line.start <= clipStore.selectedEnd;
    });
  });

  let activeTranscriptText = $derived(
    activeTranscriptLines.map(l => l.text).join(' ').trim()
  );

  // Track scroll position to auto-dock sticky mini player when scrolling down
  function handleScroll() {
    if (!mainPlayerRef) return;
    const rect = mainPlayerRef.getBoundingClientRect();
    showStickyMini = rect.bottom < 120;
  }

  function scrollToPlayer() {
    mainPlayerRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Global Keyboard Shortcuts (Linear Style)
  function handleKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.code === 'Space') {
      e.preventDefault();
      isPlaying = !isPlaying;
    } else if (e.code === 'KeyI') {
      e.preventDefault();
      clipStore.setManualRange(currentTime, clipStore.selectedEnd);
    } else if (e.code === 'KeyO') {
      e.preventDefault();
      clipStore.setManualRange(clipStore.selectedStart, currentTime);
    } else if (e.code === 'KeyJ') {
      e.preventDefault();
      handleSeekRelative(-5);
    } else if (e.code === 'KeyL') {
      e.preventDefault();
      handleSeekRelative(5);
    }
  }

  function handleSeekRelative(delta: number) {
    const maxDur = clipStore.analysisResult?.duration || 100;
    currentTime = Math.max(0, Math.min(maxDur, currentTime + delta));
  }

  function handleSelectClip(clip: CandidateClip) {
    clipStore.selectClip(clip);
    currentTime = clip.start;
  }

  // Quick In/Out trim adjustment helpers
  function adjustInPoint(delta: number) {
    const newStart = Math.max(0, Math.min(clipStore.selectedEnd - 2, clipStore.selectedStart + delta));
    clipStore.setManualRange(newStart, clipStore.selectedEnd);
    currentTime = newStart;
  }

  function adjustOutPoint(delta: number) {
    const maxDur = clipStore.analysisResult?.duration || 7200;
    const newEnd = Math.min(maxDur, Math.max(clipStore.selectedStart + 2, clipStore.selectedEnd + delta));
    clipStore.setManualRange(clipStore.selectedStart, newEnd);
    currentTime = newEnd;
  }

  async function handleExport() {
    if (!clipStore.analysisResult) return;
    clipStore.isRendering = true;
    try {
      const res = await triggerRenderClip({
        url: clipStore.videoUrl,
        start: clipStore.selectedStart,
        end: clipStore.selectedEnd,
        aspectRatio: clipStore.aspectRatio,
        burnSubtitles: clipStore.burnSubtitles,
        title: clipStore.analysisResult.title
      });
      clipStore.activeJobId = res.jobId;
      if (res.cached && res.r2Url) {
        clipStore.renderProgress = {
          id: res.jobId,
          status: 'completed',
          progressPercent: 100,
          r2Url: res.r2Url,
          cached: true
        };
        clipStore.isRendering = false;
        clipStore.markClipDownloaded(clipStore.selectedStart, clipStore.selectedEnd, res.jobId, res.r2Url);
      } else {
        clipStore.renderProgress = {
          id: res.jobId,
          status: 'queued',
          progressPercent: 10
        };
      }
    } catch (err: any) {
      alert(`Render error: ${err.message}`);
      clipStore.isRendering = false;
      clipStore.renderProgress = null;
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} onscroll={handleScroll} />

{#if clipStore.analysisResult}
  <div class="w-full max-w-5xl mx-auto mt-2 sm:mt-4 flex flex-col gap-6">
    <!-- Top Header Bar: DETECTED CLIPS & STATUS BADGE -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#200202]/80 border border-[#757D6F]/30 rounded-2xl backdrop-blur-md">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 mb-1">
          <!-- Licensed / Telemetry Ready Badge -->
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#150000] border border-[#D4FF00]/40 text-[#D4FF00] text-[11px] font-mono font-bold">
            <span class="w-2 h-2 rounded-full bg-[#D4FF00]"></span>
            <span>● LICENSED</span>
          </div>

          <span class="text-xs text-[#A9B3A1] font-mono truncate">{clipStore.analysisResult.channel}</span>
        </div>

        <div class="flex items-center gap-3">
          <h2 class="text-base sm:text-lg font-black tracking-tight text-[#EEEAD7] font-mono uppercase">
            DETECTED CLIPS {clipStore.analysisResult.topClips.length}
          </h2>
          <span class="text-xs text-[#757D6F] font-mono hidden md:inline truncate max-w-md">
            · {clipStore.analysisResult.title}
          </span>
        </div>
      </div>

      <!-- Batch Switcher -->
      <div class="flex items-center gap-1.5 p-1 bg-[#150000] border border-[#757D6F]/30 rounded-xl overflow-x-auto self-stretch sm:self-auto">
        <div class="flex items-center gap-1 px-2 text-[11px] font-mono text-[#A9B3A1]">
          <Layers size={13} class="text-[#EEEAD7]" />
          <span class="hidden sm:inline">BATCH:</span>
        </div>
        {#each Array.from({ length: clipStore.totalBatches }, (_, i) => i + 1) as b}
          <button
            type="button"
            onclick={() => {
              clipStore.setBatch(b);
              currentTime = clipStore.selectedStart;
            }}
            class="px-2.5 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap {clipStore.currentBatch === b ? 'bg-[#D4FF00] text-black font-bold shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
          >
            Batch {b}
          </button>
        {/each}
        {#if clipStore.totalBatches > 1}
          <button
            type="button"
            onclick={() => {
              clipStore.nextBatch();
              currentTime = clipStore.selectedStart;
            }}
            class="p-1 rounded-lg text-xs font-mono text-[#EEEAD7] hover:bg-[#2D0000] transition ml-1"
            title="Jump to Next Batch"
          >
            <ArrowRight size={14} />
          </button>
        {/if}
      </div>
    </div>

    <!-- ================= STAGE 1 (ATAS): THEATER VIDEO & PRECISION TIMELINE ================= -->
    <div
      bind:this={mainPlayerRef}
      class="w-full flex flex-col items-center gap-5 p-4 sm:p-6 bg-[#200202]/90 border border-[#757D6F]/30 rounded-3xl backdrop-blur-xl shadow-2xl relative"
    >
      <!-- Large Theater Video Canvas -->
      <div class="w-full flex justify-center">
        <VideoPreviewCanvas
          videoId={clipStore.analysisResult.videoId}
          {currentTime}
          {isPlaying}
          burnSubtitles={clipStore.burnSubtitles}
          aspectRatio={clipStore.aspectRatio}
          clipStart={clipStore.selectedStart}
          clipEnd={clipStore.selectedEnd}
          onTogglePlay={() => isPlaying = !isPlaying}
          onToggleSubtitles={() => clipStore.burnSubtitles = !clipStore.burnSubtitles}
          onSeekRelative={handleSeekRelative}
          onTimeUpdate={(t) => currentTime = t}
        />
      </div>

      <!-- Precision Range Trimmer Controller (directly underneath video) -->
      <div class="w-full max-w-2xl flex flex-col gap-2.5 p-3.5 bg-[#150000] border border-[#757D6F]/30 rounded-2xl shadow-inner font-mono text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#D4FF00]"></span>
            <span class="text-[#A9B3A1] font-bold">TIMELINE IN/OUT CONTROLLER</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[#757D6F] text-[11px]">CLIP DURATION:</span>
            <span class="px-2 py-0.5 rounded bg-[#2D0000] text-[#D4FF00] font-bold border border-[#D4FF00]/30">
              {clipStore.selectedDuration.toFixed(1)}s
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- In-Point Adjuster -->
          <div class="flex items-center justify-between p-2.5 bg-[#200202] rounded-xl border border-[#757D6F]/25">
            <div>
              <span class="text-[10px] text-[#757D6F] block">START TRIM (IN-POINT)</span>
              <span class="text-sm font-bold text-[#EEEAD7]">{clipStore.selectedStart.toFixed(1)}s</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                type="button"
                onclick={() => adjustInPoint(-1)}
                class="px-2 py-1 rounded bg-[#150000] text-[#A9B3A1] hover:text-white border border-[#757D6F]/30 hover:border-white/40"
              >-1s</button>
              <button
                type="button"
                onclick={() => adjustInPoint(1)}
                class="px-2 py-1 rounded bg-[#150000] text-[#A9B3A1] hover:text-white border border-[#757D6F]/30 hover:border-white/40"
              >+1s</button>
            </div>
          </div>

          <!-- Out-Point Adjuster -->
          <div class="flex items-center justify-between p-2.5 bg-[#200202] rounded-xl border border-[#757D6F]/25">
            <div>
              <span class="text-[10px] text-[#757D6F] block">END TRIM (OUT-POINT)</span>
              <span class="text-sm font-bold text-[#EEEAD7]">{clipStore.selectedEnd.toFixed(1)}s</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                type="button"
                onclick={() => adjustOutPoint(-1)}
                class="px-2 py-1 rounded bg-[#150000] text-[#A9B3A1] hover:text-white border border-[#757D6F]/30 hover:border-white/40"
              >-1s</button>
              <button
                type="button"
                onclick={() => adjustOutPoint(1)}
                class="px-2 py-1 rounded bg-[#150000] text-[#A9B3A1] hover:text-white border border-[#757D6F]/30 hover:border-white/40"
              >+1s</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Retention Heatmap Scrubber (Directly attached below range controller) -->
      <div class="w-full">
        <HeatmapCurve
          points={clipStore.analysisResult.heatmapPoints}
          duration={clipStore.analysisResult.duration}
          {currentTime}
          selectedStart={clipStore.selectedStart}
          selectedEnd={clipStore.selectedEnd}
          topClips={clipStore.currentBatchClips}
          onSeek={(t) => currentTime = t}
        />
      </div>
    </div>

    <!-- ================= STAGE 2 (BAWAH): CLIPS CAROUSEL TRAY ================= -->
    <ClipCarouselTray
      onSelectClip={handleSelectClip}
    />

    <!-- ================= STAGE 3 (BAWAH): EDITING & CAPTION MOOD STUDIO ================= -->
    <CaptionMoodPanel
      {activeTranscriptText}
      onRender={handleExport}
    />
  </div>

  <!-- STICKY FLOATING MINI-DOCK (Appears when scrolling down to customize captions) -->
  {#if showStickyMini}
    <div class="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div class="w-56 sm:w-64 bg-black/95 rounded-2xl overflow-hidden border-2 border-[#D4FF00] shadow-2xl backdrop-blur-xl p-2.5 flex flex-col gap-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-[10px] font-mono text-[#D4FF00] font-bold">● LIVE MINI PREVIEW</span>
          <button
            type="button"
            onclick={scrollToPlayer}
            class="text-[10px] font-mono text-white/70 hover:text-white flex items-center gap-0.5 hover:underline"
            title="Scroll back to main player"
          >
            <span>Top</span>
            <ChevronUp size={12} />
          </button>
        </div>

        <!-- Mini Live Subtitle Display -->
        <div class="p-3 bg-[#150000] rounded-xl border border-white/10 text-center select-none">
          <span
            class="inline-block font-black text-xs uppercase leading-tight"
            style="color: {clipStore.subtitleColor}; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.9));"
          >
            {activeTranscriptText.slice(0, 35) || 'LIVE SUBTITLE STREAM'}
          </span>
          <span class="block text-[9px] font-mono text-white/50 mt-1">
            Format: {clipStore.aspectRatio} • {clipStore.subtitleAnimation}
          </span>
        </div>

        <div class="flex items-center justify-between px-1">
          <button
            type="button"
            onclick={() => isPlaying = !isPlaying}
            class="w-6 h-6 rounded-full bg-[#D4FF00] text-black font-bold flex items-center justify-center hover:scale-105"
          >
            {#if isPlaying}
              <Pause size={12} class="fill-black" />
            {:else}
              <Play size={12} class="fill-black ml-0.5" />
            {/if}
          </button>
          <span class="text-[10px] font-mono text-white/70">
            {currentTime.toFixed(0)}s / {clipStore.selectedDuration.toFixed(0)}s
          </span>
        </div>
      </div>
    </div>
  {/if}
{/if}
