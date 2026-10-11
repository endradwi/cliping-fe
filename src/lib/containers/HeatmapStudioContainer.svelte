<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import VideoPreviewCanvas from '../components/player/VideoPreviewCanvas.svelte';
  import HeatmapCurve from '../components/timeline/HeatmapCurve.svelte';
  import CaptionMoodPanel from '../components/caption/CaptionMoodPanel.svelte';
  import { triggerRenderClip, API_BASE } from '../services/api.client';
  import type { CandidateClip } from '../types';
  import { Film, RotateCcw, CheckCircle2 } from 'lucide-svelte';
  import JSZip from 'jszip';

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

  async function handleExportSingle() {
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

  async function handleExportBulk() {
    const selectedIds = clipStore.selectedClipIdsForBulk;
    if (selectedIds.length === 0) return;

    const allClips = clipStore.analysisResult?.topClips || [];
    const targetClips = allClips.filter(c => selectedIds.includes(c.id));
    if (targetClips.length === 0) return;

    clipStore.isRendering = true;
    const zip = new JSZip();

    try {
      for (let i = 0; i < targetClips.length; i++) {
        const clip = targetClips[i];
        let downloadUrl = clipStore.getClipDownloadUrl(clip);
        let jobId = clip.id;

        if (!downloadUrl) {
          const res = await triggerRenderClip({
            url: clipStore.videoUrl,
            start: clip.start,
            end: clip.end,
            aspectRatio: clipStore.aspectRatio,
            layout: clipStore.layoutMode,
            panOffset: clipStore.panOffset,
            burnSubtitles: clipStore.burnSubtitles,
            title: `${clipStore.analysisResult?.title || 'Clip'} #${clip.rank}`,
            hookTitle: clipStore.showHookTitle ? (clip.label || clipStore.hookTitleText) : undefined,
            hookTitleTheme: clipStore.hookTitleTheme
          });
          jobId = res.jobId;

          if (res.r2Url && res.cached) {
            downloadUrl = res.r2Url;
          } else {
            let pollAttempts = 0;
            while (pollAttempts < 60) {
              await new Promise(r => setTimeout(r, 2000));
              pollAttempts++;
              const checkRes = await fetch(`${API_BASE}/api/v1/clips/${jobId}`);
              const checkData = await checkRes.json();
              if (checkData.success && checkData.data?.status === 'completed') {
                downloadUrl = checkData.data.r2Url;
                break;
              } else if (checkData.data?.status === 'failed') {
                throw new Error(`Klip #${clip.rank} gagal: ${checkData.data.error}`);
              }
            }
          }
        }

        const fileFetchUrl = `${API_BASE}/api/v1/clips/${jobId}/download`;
        const blobResp = await fetch(fileFetchUrl);
        if (!blobResp.ok) throw new Error(`Gagal download stream #${clip.rank}`);
        const blob = await blobResp.blob();

        const safeTitle = (clipStore.analysisResult?.title || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
        const fileName = `${safeTitle}_clip${clip.rank}_${Math.round(clip.start)}s-${Math.round(clip.end)}s.mp4`;
        zip.file(fileName, blob);

        if (downloadUrl) {
          clipStore.markClipDownloaded(clip.start, clip.end, jobId, downloadUrl);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const safeZipTitle = (clipStore.analysisResult?.title || 'clipping').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = URL.createObjectURL(zipBlob);
      downloadAnchor.download = `${safeZipTitle}_clips_bulk.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(downloadAnchor.href);
    } catch (err: any) {
      alert(`Export Bulk ZIP error: ${err.message}`);
    } finally {
      clipStore.isRendering = false;
    }
  }

  async function handleExport() {
    if (clipStore.exportMode === 'bulk') {
      await handleExportBulk();
    } else {
      await handleExportSingle();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if clipStore.analysisResult}
  <div class="w-full h-full flex flex-col gap-2 overflow-hidden">
    <!-- Top Studio Header (Fixed Height, Compact) -->
    <div class="flex-shrink-0 flex items-center justify-between gap-3 px-3 py-1.5 bg-[#0d1c42] border border-[#22396f]/50 rounded-xl backdrop-blur-md font-mono text-xs shadow-md">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#010736] border border-[#fcf1d0]/40 text-[#fcf1d0] font-bold text-[10px]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#fcf1d0]"></span>
          <span>READY</span>
        </span>
        <span class="text-[#fcf1d0] font-bold truncate max-w-xl">{clipStore.analysisResult.title}</span>
        <button
          type="button"
          onclick={() => clipStore.reset()}
          class="text-[10px] text-[#8fa2cb] hover:text-[#fcf1d0] underline ml-2 flex items-center gap-1"
          title="Muat video lain"
        >
          <RotateCcw size={11} />
          <span>Ganti Video</span>
        </button>
      </div>

      <!-- Quick Status Info -->
      <div class="flex items-center gap-2 text-[10px]">
        <span class="px-2 py-0.5 rounded bg-[#22396f] border border-[#22396f] text-[#fcf1d0] font-bold">
          {clipStore.analysisResult.topClips.length} Momen Dideteksi
        </span>
        <span class="px-2 py-0.5 rounded bg-[#010736] border border-[#22396f] text-[#fcf1d0]">
          Durasi: {formatTime(clipStore.analysisResult.duration)}
        </span>
      </div>
    </div>

    <!-- MAIN 3-ZONE CAPCUT ARCHITECTURE: Balanced 3 / 6 / 3 Proportion (Zero Body Scroll) -->
    <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden">
      <!-- ZONE 1: LEFT PANEL - UNIFIED CLIPS DRAWER (3 Cols - 1 Clean List with Checkboxes!) -->
      <div class="lg:col-span-3 xl:col-span-3 h-full flex flex-col bg-[#0d1c42] border border-[#22396f]/50 rounded-2xl p-2.5 overflow-hidden font-mono shadow-xl">
        <!-- Drawer Header -->
        <div class="flex-shrink-0 flex items-center justify-between pb-2 border-b border-[#22396f]/40 mb-2">
          <div class="flex items-center gap-1.5">
            <Film size={13} class="text-[#fcf1d0]" />
            <span class="text-xs font-bold text-[#fcf1d0] uppercase">DAFTAR KLIP ({clipStore.analysisResult.topClips.length})</span>
          </div>

          <button
            type="button"
            onclick={() => {
              if (clipStore.selectedClipIdsForBulk.length === (clipStore.analysisResult?.topClips.length || 0)) {
                clipStore.deselectAllClips();
              } else {
                clipStore.selectAllClips();
              }
            }}
            class="px-2 py-0.5 rounded text-[10px] font-bold transition border border-[#22396f]/60 bg-[#010736] text-[#fcf1d0] hover:border-[#fcf1d0]/50"
            title="Pilih semua klip untuk export ZIP"
          >
            {clipStore.selectedClipIdsForBulk.length === (clipStore.analysisResult?.topClips.length || 0) ? 'Batal' : 'Pilih Semua'}
          </button>
        </div>

        <!-- Scrollable Unified Clip Cards List with Checkboxes -->
        <div class="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {#each clipStore.analysisResult.topClips as clip}
            {@const isActive = clip.rank === clipStore.activeClipRank}
            {@const isChecked = clipStore.selectedClipIdsForBulk.includes(clip.id)}
            {@const isDownloaded = clipStore.isClipDownloaded(clip)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="w-full text-left p-2 rounded-xl border transition-all flex items-start gap-2 cursor-pointer {isActive ? 'bg-[#22396f] border-[#fcf1d0] text-[#fcf1d0] shadow-lg ring-1 ring-[#fcf1d0]/40' : 'bg-[#010736]/80 border-[#22396f]/50 text-[#8fa2cb] hover:text-[#fcf1d0] hover:border-[#fcf1d0]/40'}"
              onclick={() => handleSelectClip(clip)}
            >
              <!-- Checkbox (Toggles Bulk Export Selection) -->
              <input
                type="checkbox"
                checked={isChecked}
                onclick={(e) => {
                  e.stopPropagation();
                  clipStore.toggleBulkSelect(clip.id);
                }}
                class="mt-1 w-3.5 h-3.5 rounded border-[#22396f] bg-[#0d1c42] accent-[#fcf1d0] cursor-pointer flex-shrink-0"
                title="Pilih untuk export ZIP"
              />

              <!-- Card Content Body -->
              <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-bold {isActive ? 'bg-[#fcf1d0] text-[#010736]' : 'bg-[#22396f] text-[#fcf1d0]'}">
                      #{clip.rank}
                    </span>
                    <span class="text-[11px] font-bold {isActive ? 'text-[#fcf1d0]' : 'text-[#fcf1d0]/90'}">
                      {clip.score}% Skor
                    </span>
                    {#if clip.category}
                      <span class="text-[8px] px-1 py-0.2 rounded bg-black/50 text-[#fcf1d0]">
                        {clip.category}
                      </span>
                    {/if}
                  </div>

                  {#if isDownloaded}
                    <span class="text-[9px] text-[#fcf1d0] flex items-center gap-0.5 font-bold">
                      <CheckCircle2 size={11} />
                      <span>Ready</span>
                    </span>
                  {/if}
                </div>

                <div class="flex items-center justify-between text-[10px] text-[#8fa2cb]">
                  <span>{formatTime(clip.start)} - {formatTime(clip.end)}</span>
                  <span class="font-bold text-[#c7d5f5]">{clip.duration.toFixed(1)}s</span>
                </div>

                {#if clip.label}
                  <p class="text-[10px] leading-tight line-clamp-1 {isActive ? 'text-[#fcf1d0]' : 'text-[#8fa2cb]'}">
                    "{clip.label}"
                  </p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- ZONE 2: CENTER PANEL - EXPANDED DOMINANT MONITOR & TIMELINE (6 Cols - 50% Screen Width!) -->
      <div class="lg:col-span-6 xl:col-span-6 h-full flex flex-col items-center justify-between gap-2 p-2.5 bg-[#0d1c42] border border-[#22396f]/50 rounded-2xl shadow-xl overflow-hidden">
        <!-- Video Monitor Canvas (Spacious & Clean - Transport Controls Moved Outside!) -->
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
        <div class="flex-shrink-0 w-full flex flex-col gap-1 p-2 bg-[#010736] border border-[#22396f]/50 rounded-xl font-mono text-[10px]">
          <div class="flex items-center justify-between text-[#8fa2cb]">
            <div class="flex items-center gap-1.5">
              <span class="text-[#8fa2cb]/70">RENTANG:</span>
              <span class="text-[#fcf1d0] font-bold">{clipStore.selectedStart.toFixed(1)}s</span>
              <span>➔</span>
              <span class="text-[#fcf1d0] font-bold">{clipStore.selectedEnd.toFixed(1)}s</span>
            </div>
            <span class="px-1.5 py-0.2 rounded bg-[#22396f] text-[#fcf1d0] font-bold border border-[#22396f] text-[9px]">
              {clipStore.selectedDuration.toFixed(1)}s DURASI
            </span>
          </div>

          <!-- Micro Trim Adjusters -->
          <div class="grid grid-cols-2 gap-1.5 text-[10px]">
            <div class="flex items-center justify-between px-2 py-0.5 bg-[#0d1c42] rounded-lg border border-[#22396f]/50">
              <span class="text-[#8fa2cb]">START</span>
              <div class="flex gap-1">
                <button type="button" onclick={() => adjustInPoint(-1)} class="px-1.5 py-0.2 rounded bg-[#22396f] text-[#fcf1d0]/80 hover:text-[#fcf1d0]">-1s</button>
                <button type="button" onclick={() => adjustInPoint(1)} class="px-1.5 py-0.2 rounded bg-[#22396f] text-[#fcf1d0]/80 hover:text-[#fcf1d0]">+1s</button>
              </div>
            </div>
            <div class="flex items-center justify-between px-2 py-0.5 bg-[#0d1c42] rounded-lg border border-[#22396f]/50">
              <span class="text-[#8fa2cb]">END</span>
              <div class="flex gap-1">
                <button type="button" onclick={() => adjustOutPoint(-1)} class="px-1.5 py-0.2 rounded bg-[#22396f] text-[#fcf1d0]/80 hover:text-[#fcf1d0]">-1s</button>
                <button type="button" onclick={() => adjustOutPoint(1)} class="px-1.5 py-0.2 rounded bg-[#22396f] text-[#fcf1d0]/80 hover:text-[#fcf1d0]">+1s</button>
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

      <!-- ZONE 3: RIGHT PANEL - STUDIO PROPERTIES INSPECTOR (3 Cols - Dedicated Settings) -->
      <div class="lg:col-span-3 xl:col-span-3 h-full flex flex-col bg-[#0d1c42] border border-[#22396f]/50 rounded-2xl p-2.5 overflow-hidden shadow-xl">
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
