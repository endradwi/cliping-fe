<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import VideoPreviewCanvas from '../components/player/VideoPreviewCanvas.svelte';
  import HeatmapCurve from '../components/timeline/HeatmapCurve.svelte';
  import ClipCarouselTray from '../components/timeline/ClipCarouselTray.svelte';
  import CaptionMoodPanel from '../components/caption/CaptionMoodPanel.svelte';
  import { triggerRenderClip } from '../services/api.client';
  import type { CandidateClip } from '../types';
  import { Film, SlidersHorizontal, Flame, RotateCcw } from 'lucide-svelte';

  let currentTime = $state(0);
  let isPlaying = $state(false);
  let activeTab = $state<'editor' | 'gallery'>('editor');

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
        layout: clipStore.layoutMode,
        panOffset: clipStore.panOffset,
        burnSubtitles: clipStore.burnSubtitles,
        title: clipStore.analysisResult.title,
        hookTitle: clipStore.showHookTitle ? (clipStore.hookTitleText || clipStore.analysisResult.title) : undefined,
        hookTitleTheme: clipStore.hookTitleTheme
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

<svelte:window onkeydown={handleKeyDown} />

{#if clipStore.analysisResult}
  <div class="w-full h-full flex flex-col gap-2 overflow-hidden">
    <!-- Top Minimalist Studio Header & Clip Switcher Strip (Zero Window Scroll) -->
    <div class="flex-shrink-0 flex flex-col gap-1.5 p-2.5 bg-[#200202]/70 border border-[#757D6F]/25 rounded-2xl backdrop-blur-md font-mono text-xs shadow-md">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#150000] border border-[#D4FF00]/40 text-[#D4FF00] font-bold text-[10px]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#D4FF00]"></span>
            <span>READY</span>
          </span>
          <span class="text-[#EEEAD7] font-bold truncate max-w-md">{clipStore.analysisResult.title}</span>
          <button
            type="button"
            onclick={() => clipStore.reset()}
            class="text-[10px] text-[#A9B3A1] hover:text-[#EEEAD7] underline ml-2 flex items-center gap-1"
            title="Muat video lain"
          >
            <RotateCcw size={11} />
            <span>Ganti Video</span>
          </button>
        </div>

        <!-- Studio Mode Selector -->
        <div class="flex items-center gap-1 p-0.5 bg-[#150000] border border-[#757D6F]/25 rounded-xl">
          <button
            type="button"
            onclick={() => activeTab = 'editor'}
            class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 {activeTab === 'editor' ? 'bg-[#D4FF00] text-black shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
          >
            <SlidersHorizontal size={12} />
            <span>Editor Studio</span>
          </button>
          <button
            type="button"
            onclick={() => activeTab = 'gallery'}
            class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 {activeTab === 'gallery' ? 'bg-[#D4FF00] text-black shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
          >
            <Film size={12} />
            <span>Semua Klip ({clipStore.analysisResult.topClips.length})</span>
          </button>
        </div>
      </div>

      <!-- Quick One-Click Clip Selector Strip (SOCL Visuals Style) -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 border-t border-[#757D6F]/15">
        <span class="text-[10px] text-[#A9B3A1] font-bold flex-shrink-0 flex items-center gap-1">
          <Flame size={12} class="text-[#D4FF00]" />
          <span>PILIH KLIP:</span>
        </span>
        {#each clipStore.analysisResult.topClips as clip}
          {@const isActive = clip.rank === clipStore.activeClipRank}
          <button
            type="button"
            onclick={() => handleSelectClip(clip)}
            class="px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0 transition border flex items-center gap-1 {isActive ? 'bg-[#D4FF00] text-black border-[#D4FF00] shadow-md scale-105' : 'bg-[#150000] text-[#A9B3A1] hover:text-[#EEEAD7] border-[#757D6F]/30 hover:border-[#757D6F]/60'}"
          >
            <span>#{clip.rank}</span>
            <span class="opacity-80">({clip.score})</span>
            {#if clip.category}
              <span class="text-[8px] px-1 py-0.2 rounded {isActive ? 'bg-black text-[#D4FF00]' : 'bg-[#2D0000] text-white/80'} font-mono">
                {clip.category}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    {#if activeTab === 'editor'}
      <!-- MAIN TWO-COLUMN STUDIO WORKSPACE (Strict Viewport Boundary, Zero Body Scroll) -->
      <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">
        <!-- LEFT COLUMN: Stage (Canvas & Timeline) -->
        <div class="lg:col-span-5 xl:col-span-5 h-full flex flex-col items-center justify-between gap-2 p-2.5 bg-[#200202]/80 border border-[#757D6F]/25 rounded-2xl shadow-xl overflow-hidden">
          <!-- Video Preview Canvas (Dynamically scaled within available stage height) -->
          <div class="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
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

          <!-- Precision Trimmer Bar -->
          <div class="flex-shrink-0 w-full flex flex-col gap-1 p-2 bg-[#150000] border border-[#757D6F]/25 rounded-xl font-mono text-[10px]">
            <div class="flex items-center justify-between text-[#A9B3A1]">
              <div class="flex items-center gap-1.5">
                <span class="text-[#757D6F]">RENTANG:</span>
                <span class="text-[#D4FF00] font-bold">{clipStore.selectedStart.toFixed(1)}s</span>
                <span>➔</span>
                <span class="text-[#D4FF00] font-bold">{clipStore.selectedEnd.toFixed(1)}s</span>
              </div>
              <span class="px-1.5 py-0.2 rounded bg-[#2D0000] text-[#EEEAD7] font-bold border border-[#757D6F]/30 text-[9px]">
                {clipStore.selectedDuration.toFixed(1)}s DURASI
              </span>
            </div>

            <!-- Micro Trim Adjusters -->
            <div class="grid grid-cols-2 gap-1.5 text-[10px]">
              <div class="flex items-center justify-between px-2 py-0.5 bg-[#200202] rounded-lg border border-[#757D6F]/20">
                <span class="text-[#757D6F]">START</span>
                <div class="flex gap-1">
                  <button type="button" onclick={() => adjustInPoint(-1)} class="px-1.5 py-0.2 rounded bg-[#150000] text-white/80 hover:text-white">-1s</button>
                  <button type="button" onclick={() => adjustInPoint(1)} class="px-1.5 py-0.2 rounded bg-[#150000] text-white/80 hover:text-white">+1s</button>
                </div>
              </div>
              <div class="flex items-center justify-between px-2 py-0.5 bg-[#200202] rounded-lg border border-[#757D6F]/20">
                <span class="text-[#757D6F]">END</span>
                <div class="flex gap-1">
                  <button type="button" onclick={() => adjustOutPoint(-1)} class="px-1.5 py-0.2 rounded bg-[#150000] text-white/80 hover:text-white">-1s</button>
                  <button type="button" onclick={() => adjustOutPoint(1)} class="px-1.5 py-0.2 rounded bg-[#150000] text-white/80 hover:text-white">+1s</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Heatmap Timeline -->
          <div class="flex-shrink-0 w-full">
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

        <!-- RIGHT COLUMN: Inspector Studio Controls (Scrolls independently!) -->
        <div class="lg:col-span-7 xl:col-span-7 h-full flex flex-col overflow-hidden bg-[#200202]/30 border border-[#757D6F]/20 rounded-2xl p-2.5">
          <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <CaptionMoodPanel
              {activeTranscriptText}
              onRender={handleExport}
            />
          </div>
        </div>
      </div>
    {:else}
      <!-- ALL CLIPS GALLERY & BULK EXPORT VIEW -->
      <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <ClipCarouselTray
          onSelectClip={(c) => {
            handleSelectClip(c);
            activeTab = 'editor';
          }}
        />
      </div>
    {/if}
  </div>
{/if}
