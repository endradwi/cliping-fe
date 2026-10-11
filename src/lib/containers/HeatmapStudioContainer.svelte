<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import VideoPreviewCanvas from '../components/player/VideoPreviewCanvas.svelte';
  import HeatmapCurve from '../components/timeline/HeatmapCurve.svelte';
  import ClipCarouselTray from '../components/timeline/ClipCarouselTray.svelte';
  import CaptionMoodPanel from '../components/caption/CaptionMoodPanel.svelte';
  import { triggerRenderClip } from '../services/api.client';
  import type { CandidateClip } from '../types';
  import { Layers, ArrowRight, Sparkles, Film, Crop, Check } from 'lucide-svelte';

  let currentTime = $state(0);
  let isPlaying = $state(false);
  let activeTab = $state<'caption' | 'clips' | 'format'>('caption');

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

  const aspectRatios = [
    { id: '9:16' as const, label: '9:16', desc: 'Shorts / TikTok / Reels' },
    { id: '4:5' as const, label: '4:5', desc: 'Instagram Portrait Feed' },
    { id: '1:1' as const, label: '1:1', desc: 'Square Post / Carousel' },
    { id: '16:9' as const, label: '16:9', desc: 'YouTube Standard Landscape' }
  ];
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if clipStore.analysisResult}
  <div class="w-full max-w-6xl mx-auto flex flex-col gap-4">
    <!-- Top Minimalist Breadcrumb Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#200202]/70 border border-[#757D6F]/25 rounded-2xl backdrop-blur-md font-mono text-xs shadow-lg">
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#150000] border border-[#D4FF00]/40 text-[#D4FF00] font-bold text-[10px]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#D4FF00]"></span>
          <span>READY</span>
        </span>
        <span class="text-[#EEEAD7] font-bold truncate max-w-md">{clipStore.analysisResult.title}</span>
        <span class="text-[#757D6F] hidden md:inline truncate">({clipStore.analysisResult.channel})</span>
      </div>

      <!-- Quick Batch Navigation -->
      <div class="flex items-center gap-1.5 p-1 bg-[#150000] border border-[#757D6F]/25 rounded-xl self-stretch sm:self-auto">
        <div class="flex items-center gap-1 px-1.5 text-[11px] text-[#A9B3A1]">
          <Layers size={13} class="text-[#EEEAD7]" />
          <span>BATCH:</span>
        </div>
        {#each Array.from({ length: clipStore.totalBatches }, (_, i) => i + 1) as b}
          <button
            type="button"
            onclick={() => {
              clipStore.setBatch(b);
              currentTime = clipStore.selectedStart;
            }}
            class="px-2 py-0.5 rounded-lg text-xs transition {clipStore.currentBatch === b ? 'bg-[#D4FF00] text-black font-bold shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
          >
            {b}
          </button>
        {/each}
        {#if clipStore.totalBatches > 1}
          <button
            type="button"
            onclick={() => {
              clipStore.nextBatch();
              currentTime = clipStore.selectedStart;
            }}
            class="p-1 rounded-lg text-[#EEEAD7] hover:bg-[#2D0000] transition"
            title="Next Batch"
          >
            <ArrowRight size={13} />
          </button>
        {/if}
      </div>
    </div>

    <!-- MAIN TWO-COLUMN STUDIO WORKSPACE (Balanced Widescreen Layout) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- LEFT STAGE: Video Canvas & Attached Timeline (lg:col-span-5) -->
      <div class="lg:col-span-5 flex flex-col items-center gap-3 p-3.5 sm:p-4 bg-[#200202]/80 border border-[#757D6F]/25 rounded-2xl shadow-xl w-full">
        <!-- Sleek Phone Canvas -->
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

        <!-- Attached In/Out Range Trimmer Bar -->
        <div class="w-full flex flex-col gap-2 p-2.5 bg-[#150000] border border-[#757D6F]/25 rounded-xl font-mono text-[11px]">
          <div class="flex items-center justify-between text-[#A9B3A1]">
            <div class="flex items-center gap-1.5">
              <span class="text-[#757D6F]">TRIM:</span>
              <span class="text-[#D4FF00] font-bold">{clipStore.selectedStart.toFixed(1)}s</span>
              <span>➔</span>
              <span class="text-[#D4FF00] font-bold">{clipStore.selectedEnd.toFixed(1)}s</span>
            </div>
            <span class="px-1.5 py-0.2 rounded bg-[#2D0000] text-[#EEEAD7] font-bold border border-[#757D6F]/30 text-[10px]">
              {clipStore.selectedDuration.toFixed(1)}s DURATION
            </span>
          </div>

          <!-- Micro Trim Adjusters -->
          <div class="grid grid-cols-2 gap-2 text-[10px]">
            <div class="flex items-center justify-between px-2 py-1 bg-[#200202] rounded-lg border border-[#757D6F]/20">
              <span class="text-[#757D6F]">START</span>
              <div class="flex gap-1">
                <button type="button" onclick={() => adjustInPoint(-1)} class="px-1.5 py-0.5 rounded bg-[#150000] text-white/80 hover:text-white">-1s</button>
                <button type="button" onclick={() => adjustInPoint(1)} class="px-1.5 py-0.5 rounded bg-[#150000] text-white/80 hover:text-white">+1s</button>
              </div>
            </div>
            <div class="flex items-center justify-between px-2 py-1 bg-[#200202] rounded-lg border border-[#757D6F]/20">
              <span class="text-[#757D6F]">END</span>
              <div class="flex gap-1">
                <button type="button" onclick={() => adjustOutPoint(-1)} class="px-1.5 py-0.5 rounded bg-[#150000] text-white/80 hover:text-white">-1s</button>
                <button type="button" onclick={() => adjustOutPoint(1)} class="px-1.5 py-0.5 rounded bg-[#150000] text-white/80 hover:text-white">+1s</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Attached Heatmap Retention Timeline Track -->
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

      <!-- RIGHT STAGE: Inspector & Studio Controls (lg:col-span-7) -->
      <div class="lg:col-span-7 flex flex-col gap-3 w-full">
        <!-- Studio Tab Switchers -->
        <div class="grid grid-cols-3 p-1 bg-[#150000] border border-[#757D6F]/30 rounded-2xl font-mono text-xs shadow-lg">
          <button
            type="button"
            onclick={() => activeTab = 'caption'}
            class="py-2.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 {activeTab === 'caption' ? 'bg-[#D4FF00] text-black font-bold shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
          >
            <Sparkles size={14} />
            <span>Caption Mood</span>
          </button>

          <button
            type="button"
            onclick={() => activeTab = 'clips'}
            class="py-2.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 {activeTab === 'clips' ? 'bg-[#D4FF00] text-black font-bold shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
          >
            <Film size={14} />
            <span>Clips ({clipStore.analysisResult.topClips.length})</span>
          </button>

          <button
            type="button"
            onclick={() => activeTab = 'format'}
            class="py-2.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 {activeTab === 'format' ? 'bg-[#D4FF00] text-black font-bold shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
          >
            <Crop size={14} />
            <span>Format ({clipStore.aspectRatio})</span>
          </button>
        </div>

        <!-- Tab 1: Caption Mood Studio -->
        {#if activeTab === 'caption'}
          <CaptionMoodPanel
            {activeTranscriptText}
            onRender={handleExport}
          />

        <!-- Tab 2: Detected Clips & Bulk Export -->
        {:else if activeTab === 'clips'}
          <div class="flex flex-col gap-3">
            <ClipCarouselTray
              onSelectClip={handleSelectClip}
            />
          </div>

        <!-- Tab 3: Aspect Ratio & Canvas Format -->
        {:else if activeTab === 'format'}
          <div class="p-5 bg-[#200202]/80 border border-[#757D6F]/30 rounded-2xl backdrop-blur-md shadow-xl flex flex-col gap-4 text-[#EEEAD7]">
            <div class="flex items-center justify-between pb-3 border-b border-[#757D6F]/20">
              <span class="text-xs font-mono font-bold tracking-wider uppercase">SELECT VIDEO ASPECT RATIO</span>
              <span class="text-xs font-mono text-[#D4FF00] font-bold">{clipStore.aspectRatio} ACTIVE</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each aspectRatios as fmt}
                <button
                  type="button"
                  onclick={() => clipStore.aspectRatio = fmt.id}
                  class="p-4 rounded-xl text-left font-mono transition-all border flex flex-col justify-between gap-2 {clipStore.aspectRatio === fmt.id ? 'bg-[#6D0808] border-[#D4FF00] text-[#EEEAD7] shadow-xl scale-[1.02]' : 'bg-[#150000] border-[#757D6F]/25 text-[#A9B3A1] hover:text-[#EEEAD7] hover:border-[#757D6F]/60'}"
                >
                  <div class="flex items-center justify-between w-full">
                    <span class="text-sm font-bold">{fmt.label}</span>
                    {#if clipStore.aspectRatio === fmt.id}
                      <Check size={16} class="text-[#D4FF00]" />
                    {/if}
                  </div>
                  <span class="text-xs opacity-80">{fmt.desc}</span>
                </button>
              {/each}
            </div>

            <button
              type="button"
              disabled={clipStore.isRendering}
              onclick={handleExport}
              class="w-full mt-2 py-3 px-4 rounded-xl font-bold font-mono text-sm tracking-wide flex items-center justify-center gap-2 transition shadow-xl bg-[#D4FF00] hover:bg-[#c7f000] text-black active:scale-[0.99] disabled:opacity-50"
            >
              <span>⬇ Render Clip ({clipStore.aspectRatio})</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
