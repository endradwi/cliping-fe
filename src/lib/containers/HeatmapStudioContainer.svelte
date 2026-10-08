<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import VideoPreviewCanvas from '../components/player/VideoPreviewCanvas.svelte';
  import HeatmapCurve from '../components/timeline/HeatmapCurve.svelte';
  import ClipCarouselTray from '../components/timeline/ClipCarouselTray.svelte';
  import CaptionMoodPanel from '../components/caption/CaptionMoodPanel.svelte';
  import Badge from '../components/ui/Badge.svelte';
  import { triggerRenderClip } from '../services/api.client';
  import type { CandidateClip } from '../types';
  import { Sparkles, Layers, ArrowRight, ShieldCheck } from 'lucide-svelte';

  let currentTime = $state(0);
  let isPlaying = $state(false);

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
      clipStore.renderProgress = {
        id: res.jobId,
        status: 'queued',
        progressPercent: 10
      };
    } catch (err: any) {
      alert(`Render error: ${err.message}`);
      clipStore.isRendering = false;
      clipStore.renderProgress = null;
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if clipStore.analysisResult}
  <div class="w-full max-w-6xl mx-auto mt-2 sm:mt-4 flex flex-col gap-5 sm:gap-6">
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

    <!-- Center Stage: 9:16 Canvas with Floating Dock & Caption Mood Inspector -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left: Video Canvas (lg:col-span-5) -->
      <div class="lg:col-span-5 flex justify-center w-full">
        <VideoPreviewCanvas
          videoId={clipStore.analysisResult.videoId}
          {currentTime}
          {isPlaying}
          burnSubtitles={clipStore.burnSubtitles}
          aspectRatio={clipStore.aspectRatio}
          {activeTranscriptText}
          onTogglePlay={() => isPlaying = !isPlaying}
          onToggleSubtitles={() => clipStore.burnSubtitles = !clipStore.burnSubtitles}
          onSeekRelative={handleSeekRelative}
        />
      </div>

      <!-- Right: Caption Mood & Subtitle Style Inspector (lg:col-span-7) -->
      <div class="lg:col-span-7 flex flex-col gap-4 w-full">
        <CaptionMoodPanel
          {activeTranscriptText}
          onRender={handleExport}
        />
      </div>
    </div>

    <!-- Bottom Stage 1: Horizontal Clip Carousel Tray -->
    <ClipCarouselTray
      onSelectClip={handleSelectClip}
    />

    <!-- Bottom Stage 2: Heatmap Retention Curve & Scrubber -->
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
{/if}
