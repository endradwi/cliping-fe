<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import VideoPreviewCanvas from '../components/player/VideoPreviewCanvas.svelte';
  import HeatmapCurve from '../components/timeline/HeatmapCurve.svelte';
  import Button from '../components/ui/Button.svelte';
  import Badge from '../components/ui/Badge.svelte';
  import { triggerRenderClip } from '../services/api.client';
  import { Sparkles, Scissors, Subtitles, Flame } from 'lucide-svelte';

  let currentTime = $state(0);
  let isPlaying = $state(false);

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
      currentTime = Math.max(0, currentTime - 5);
    } else if (e.code === 'KeyL') {
      e.preventDefault();
      currentTime = Math.min(clipStore.analysisResult?.duration || 100, currentTime + 5);
    }
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
    } catch (err: any) {
      alert(`Render error: ${err.message}`);
      clipStore.isRendering = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if clipStore.analysisResult}
  <div class="w-full max-w-5xl mx-auto mt-4 sm:mt-6 flex flex-col gap-5 sm:gap-6">
    <!-- Video Header Details -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl backdrop-blur-md">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 mb-1">
          <Badge variant="hot">
            <Flame size={12} class="mr-1 text-rose-400" />
            <span>Telemetry Analyzed</span>
          </Badge>
          <span class="text-xs text-neutral-400 font-mono truncate">{clipStore.analysisResult.channel}</span>
        </div>
        <h2 class="text-sm sm:text-base font-bold text-white line-clamp-1">{clipStore.analysisResult.title}</h2>
      </div>

      <!-- Top 3 Presets (SOP: 1 Batch = 3 Videos) -->
      <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        {#each clipStore.analysisResult.topClips as clip}
          <button
            type="button"
            onclick={() => {
              clipStore.selectClip(clip);
              currentTime = clip.start;
            }}
            class="px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[40px] {clipStore.activeClipRank === clip.rank ? 'bg-rose-600 text-white font-bold shadow-lg shadow-rose-950/50 scale-105' : 'bg-neutral-800 text-neutral-400 hover:text-white'}"
          >
            <span>Clip #{clip.rank}</span>
            <span class="text-[10px] opacity-75">({clip.score}%)</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Center Stage: Video Preview (9:16) & Controls -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- 9:16 Canvas Mockup Viewport -->
      <div class="lg:col-span-5 flex justify-center w-full">
        <VideoPreviewCanvas
          videoId={clipStore.analysisResult.videoId}
          {currentTime}
          {isPlaying}
          burnSubtitles={clipStore.burnSubtitles}
          aspectRatio={clipStore.aspectRatio}
          onTogglePlay={() => isPlaying = !isPlaying}
          onToggleSubtitles={() => clipStore.burnSubtitles = !clipStore.burnSubtitles}
        />
      </div>

      <!-- Controls & Export Options -->
      <div class="lg:col-span-7 flex flex-col gap-4 sm:gap-5 bg-neutral-900/40 border border-neutral-800/60 p-4 sm:p-6 rounded-2xl w-full">
        <h3 class="text-sm font-bold text-neutral-200 flex items-center gap-2">
          <Scissors size={16} class="text-rose-500" />
          <span>Clip Export Controls</span>
        </h3>

        <!-- Duration & Aspect Ratio Switcher -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div class="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl">
            <span class="text-[11px] text-neutral-500 font-mono block mb-1">ASPECT RATIO</span>
            <div class="flex gap-1.5">
              {#each ['9:16', '1:1', '16:9'] as ratio}
                <button
                  type="button"
                  onclick={() => clipStore.aspectRatio = ratio as any}
                  class="flex-1 py-1.5 rounded-md text-xs font-mono transition min-h-[36px] {clipStore.aspectRatio === ratio ? 'bg-rose-950 border border-rose-800 text-rose-300 font-bold' : 'bg-neutral-900 text-neutral-400'}"
                >
                  {ratio}
                </button>
              {/each}
            </div>
          </div>

          <div class="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl">
            <span class="text-[11px] text-neutral-500 font-mono block mb-1">SUBTITLES</span>
            <button
              type="button"
              onclick={() => clipStore.burnSubtitles = !clipStore.burnSubtitles}
              class="w-full py-1.5 rounded-md text-xs font-mono transition flex items-center justify-center gap-1.5 min-h-[36px] {clipStore.burnSubtitles ? 'bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold' : 'bg-neutral-900 text-neutral-400'}"
            >
              <Subtitles size={14} />
              <span>{clipStore.burnSubtitles ? 'Karaoke Sub (ON)' : 'Plain Video (OFF)'}</span>
            </button>
          </div>
        </div>

        <!-- Precise Time Range Indicator -->
        <div class="p-3 sm:p-4 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-center justify-between font-mono text-xs">
          <div>
            <span class="text-neutral-500 block text-[10px]">IN-POINT</span>
            <span class="text-white font-bold">{clipStore.selectedStart.toFixed(1)}s</span>
          </div>
          <div class="text-rose-500 font-bold text-sm">➔</div>
          <div>
            <span class="text-neutral-500 block text-[10px]">OUT-POINT</span>
            <span class="text-white font-bold">{clipStore.selectedEnd.toFixed(1)}s</span>
          </div>
          <div class="text-right">
            <span class="text-neutral-500 block text-[10px]">DURATION</span>
            <span class="text-amber-400 font-bold">{clipStore.selectedDuration.toFixed(1)}s</span>
          </div>
        </div>

        <!-- CTA Action -->
        <Button
          variant="primary"
          size="lg"
          disabled={clipStore.isRendering}
          onclick={handleExport}
          class="w-full mt-1 min-h-[48px] text-sm sm:text-base"
        >
          <Sparkles size={18} />
          <span>Render Vertical Clip (Fast 9:16)</span>
        </Button>
      </div>
    </div>

    <!-- Timeline Scrubber with SVG Heatmap Curve -->
    <HeatmapCurve
      points={clipStore.analysisResult.heatmapPoints}
      duration={clipStore.analysisResult.duration}
      {currentTime}
      selectedStart={clipStore.selectedStart}
      selectedEnd={clipStore.selectedEnd}
      topClips={clipStore.analysisResult.topClips}
      onSeek={(t) => currentTime = t}
    />
  </div>
{/if}
