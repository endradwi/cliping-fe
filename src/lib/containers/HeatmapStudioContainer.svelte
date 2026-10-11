<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import VideoPreviewCanvas from '../components/player/VideoPreviewCanvas.svelte';
  import HeatmapCurve from '../components/timeline/HeatmapCurve.svelte';
  import ClipCarouselTray from '../components/timeline/ClipCarouselTray.svelte';
  import CaptionMoodPanel from '../components/caption/CaptionMoodPanel.svelte';
  import { triggerRenderClip } from '../services/api.client';
  import type { CandidateClip } from '../types';
  import { Film, Flame, RotateCcw, PackageCheck, CheckCircle2, Sliders } from 'lucide-svelte';

  let currentTime = $state(0);
  let isPlaying = $state(false);
  let leftPanelMode = $state<'clips' | 'bulk'>('clips');

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

  function formatTime(sec: number): string {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}`;
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
    <!-- Top Studio Header (Fixed Height, Compact) -->
    <div class="flex-shrink-0 flex items-center justify-between gap-3 px-3 py-1.5 bg-[#200202]/80 border border-[#757D6F]/25 rounded-xl backdrop-blur-md font-mono text-xs shadow-md">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#150000] border border-[#D4FF00]/40 text-[#D4FF00] font-bold text-[10px]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#D4FF00]"></span>
          <span>READY</span>
        </span>
        <span class="text-[#EEEAD7] font-bold truncate max-w-xl">{clipStore.analysisResult.title}</span>
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

      <!-- Quick Status Info -->
      <div class="flex items-center gap-2 text-[10px] text-[#A9B3A1]">
        <span class="px-2 py-0.5 rounded bg-[#150000] border border-[#757D6F]/25 text-[#D4FF00] font-bold">
          {clipStore.analysisResult.topClips.length} Momen Dideteksi
        </span>
        <span class="px-2 py-0.5 rounded bg-[#150000] border border-[#757D6F]/25 text-[#EEEAD7]">
          Durasi: {formatTime(clipStore.analysisResult.duration)}
        </span>
      </div>
    </div>

    <!-- MAIN 3-ZONE CAPCUT ARCHITECTURE (100% Height, Zero Body Scroll) -->
    <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden">
      <!-- ZONE 1: LEFT PANEL - CLIPS DRAWER (col-span-3) -->
      <div class="lg:col-span-3 h-full flex flex-col bg-[#200202]/70 border border-[#757D6F]/25 rounded-2xl p-2.5 overflow-hidden font-mono shadow-xl">
        <!-- Drawer Header & Tabs -->
        <div class="flex-shrink-0 flex items-center justify-between pb-2 border-b border-[#757D6F]/20 mb-2">
          <div class="flex items-center gap-1.5">
            <Film size={13} class="text-[#D4FF00]" />
            <span class="text-xs font-bold text-[#EEEAD7] uppercase">DAFTAR KLIP</span>
          </div>

          <div class="flex items-center gap-1 bg-[#150000] p-0.5 rounded-lg border border-[#757D6F]/20 text-[10px]">
            <button
              type="button"
              onclick={() => leftPanelMode = 'clips'}
              class="px-2 py-0.5 rounded font-bold transition {leftPanelMode === 'clips' ? 'bg-[#D4FF00] text-black' : 'text-[#A9B3A1]'}"
            >
              Klip
            </button>
            <button
              type="button"
              onclick={() => leftPanelMode = 'bulk'}
              class="px-2 py-0.5 rounded font-bold transition {leftPanelMode === 'bulk' ? 'bg-[#D4FF00] text-black' : 'text-[#A9B3A1]'}"
              title="Bulk Export ZIP"
            >
              Bulk ZIP
            </button>
          </div>
        </div>

        {#if leftPanelMode === 'clips'}
          <!-- Scrollable Clip Cards List (CapCut Media Pool Style) -->
          <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {#each clipStore.analysisResult.topClips as clip}
              {@const isActive = clip.rank === clipStore.activeClipRank}
              {@const isDownloaded = clipStore.isClipDownloaded(clip)}
              <button
                type="button"
                onclick={() => handleSelectClip(clip)}
                class="w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1.5 {isActive ? 'bg-[#6D0808]/90 border-[#D4FF00] text-[#EEEAD7] shadow-lg ring-1 ring-[#D4FF00]/50' : 'bg-[#150000] border-[#757D6F]/20 text-[#A9B3A1] hover:text-[#EEEAD7] hover:border-[#757D6F]/50'}"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-bold {isActive ? 'bg-[#D4FF00] text-black' : 'bg-[#2D0000] text-[#EEEAD7]'}">
                      #{clip.rank}
                    </span>
                    <span class="text-[11px] font-bold {isActive ? 'text-[#D4FF00]' : 'text-[#EEEAD7]'}">
                      {clip.score}% Skor
                    </span>
                    {#if clip.category}
                      <span class="text-[9px] px-1 py-0.2 rounded bg-black/60 text-[#D4FF00]">
                        {clip.category}
                      </span>
                    {/if}
                  </div>

                  {#if isDownloaded}
                    <span class="text-[9px] text-[#D4FF00] flex items-center gap-0.5 font-bold">
                      <CheckCircle2 size={11} />
                      <span>Ready</span>
                    </span>
                  {/if}
                </div>

                <div class="flex items-center justify-between text-[10px] text-[#757D6F]">
                  <span>{formatTime(clip.start)} - {formatTime(clip.end)}</span>
                  <span class="font-bold text-[#A9B3A1]">{clip.duration.toFixed(1)}s</span>
                </div>

                {#if clip.label}
                  <p class="text-[10px] leading-tight line-clamp-2 {isActive ? 'text-white' : 'text-[#A9B3A1]'}">
                    "{clip.label}"
                  </p>
                {/if}
              </button>
            {/each}
          </div>
        {:else}
          <!-- Bulk ZIP Download Manager in Left Drawer -->
          <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <ClipCarouselTray
              onSelectClip={(c) => {
                handleSelectClip(c);
                leftPanelMode = 'clips';
              }}
            />
          </div>
        {/if}
      </div>

      <!-- ZONE 2: CENTER PANEL - MONITOR PLAYER & TIMELINE (col-span-5) -->
      <div class="lg:col-span-5 h-full flex flex-col items-center justify-between gap-2.5 p-2.5 bg-[#200202]/80 border border-[#757D6F]/25 rounded-2xl shadow-xl overflow-hidden">
        <!-- Video Monitor Canvas (Takes dominant height, scaled to fit) -->
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

        <!-- In/Out Range Trimmer Bar -->
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

        <!-- Heatmap Timeline Curve -->
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

      <!-- ZONE 3: RIGHT PANEL - STUDIO PROPERTIES INSPECTOR (col-span-4) -->
      <div class="lg:col-span-4 h-full flex flex-col bg-[#200202]/70 border border-[#757D6F]/25 rounded-2xl p-2.5 overflow-hidden shadow-xl">
        <!-- Inspector Scrollable Area (Only this panel scrolls!) -->
        <div class="flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
          <CaptionMoodPanel
            {activeTranscriptText}
            onRender={handleExport}
          />
        </div>
      </div>
    </div>
  </div>
{/if}
