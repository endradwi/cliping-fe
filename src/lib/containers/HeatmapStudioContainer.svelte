<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import VideoPreviewCanvas from '../components/player/VideoPreviewCanvas.svelte';
  import CaptionMoodPanel from '../components/caption/CaptionMoodPanel.svelte';
  import { triggerRenderClip, API_BASE } from '../services/api.client';
  import type { CandidateClip } from '../types';
  import { Film, RotateCcw, RotateCw, Play, Pause, CheckCircle2 } from 'lucide-svelte';
  import JSZip from 'jszip';

  let currentTime = $state(0);
  let isPlaying = $state(false);

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

  let playedRatio = $derived(
    clipStore.selectedDuration > 0
      ? Math.max(0, Math.min(1, (currentTime - clipStore.selectedStart) / clipStore.selectedDuration))
      : 0
  );

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
    currentTime = Math.max(clipStore.selectedStart, Math.min(clipStore.selectedEnd, currentTime + delta));
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
        clipStore.renderProgress = { id: res.jobId, status: 'completed', progressPercent: 100, r2Url: res.r2Url, cached: true };
        clipStore.isRendering = false;
        clipStore.markClipDownloaded(clipStore.selectedStart, clipStore.selectedEnd, res.jobId, res.r2Url);
      } else {
        clipStore.renderProgress = { id: res.jobId, status: 'queued', progressPercent: 10 };
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
        zip.file(`${safeTitle}_clip${clip.rank}_${Math.round(clip.start)}s-${Math.round(clip.end)}s.mp4`, blob);
        if (downloadUrl) clipStore.markClipDownloaded(clip.start, clip.end, jobId, downloadUrl);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const safeZipTitle = (clipStore.analysisResult?.title || 'clipping').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${safeZipTitle}_clips_bulk.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err: any) {
      alert(`Export Bulk ZIP error: ${err.message}`);
    } finally {
      clipStore.isRendering = false;
    }
  }

  async function handleExport() {
    if (clipStore.exportMode === 'bulk') await handleExportBulk();
    else await handleExportSingle();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if clipStore.analysisResult}
  <div class="w-full h-full flex flex-col gap-2 overflow-hidden font-mono">
    <!-- Top status strip -->
    <div class="flex-shrink-0 flex items-center justify-between gap-3 px-3 py-1.5 bg-[#0d1c42] border border-[#22396f]/50 rounded-xl text-xs shadow-md">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#010736] border border-[#fcf1d0]/40 text-[#fcf1d0] font-bold text-[10px]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#fcf1d0]"></span>
          <span>READY</span>
        </span>
        <span class="text-[#fcf1d0] font-bold truncate max-w-xl">{clipStore.analysisResult.title}</span>
        <button type="button" onclick={() => clipStore.reset()} class="text-[10px] text-[#8fa2cb] hover:text-[#fcf1d0] underline ml-2 flex items-center gap-1" title="Muat video lain">
          <RotateCcw size={11} />
          <span>Ganti Video</span>
        </button>
      </div>
      <div class="flex items-center gap-2 text-[10px]">
        <span class="px-2 py-0.5 rounded bg-[#22396f] text-[#fcf1d0] font-bold">{clipStore.analysisResult.topClips.length} Momen</span>
        <span class="px-2 py-0.5 rounded bg-[#010736] border border-[#22396f] text-[#fcf1d0]">Durasi: {formatTime(clipStore.analysisResult.duration)}</span>
      </div>
    </div>

    <!-- UPPER: video kiri + fitur edit kanan -->
    <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
      <!-- KIRI: video monitor -->
      <div class="lg:col-span-7 h-full flex flex-col gap-2 p-2.5 bg-[#0d1c42] border border-[#22396f]/50 rounded-2xl shadow-xl overflow-hidden">
        <div class="flex-1 min-h-0 w-full flex items-center justify-center bg-[#010736]/70 rounded-xl overflow-hidden border border-[#22396f]/30">
          <VideoPreviewCanvas
            videoId={clipStore.analysisResult.videoId}
            {currentTime}
            {isPlaying}
            burnSubtitles={clipStore.burnSubtitles}
            aspectRatio={clipStore.aspectRatio}
            clipStart={clipStore.selectedStart}
            clipEnd={clipStore.selectedEnd}
            onTimeUpdate={(t) => currentTime = t}
          />
        </div>

        <!-- Docked full-width transport + trimmer + local scrubber -->
        <div class="flex-shrink-0 w-full flex flex-col gap-1.5 p-2 bg-[#010736] border border-[#22396f]/50 rounded-xl">
          <div class="flex items-center justify-between text-[11px] text-[#fcf1d0]">
            <div class="flex items-center gap-1.5">
              <span class="font-bold">{formatTime(Math.max(0, currentTime - clipStore.selectedStart))}</span>
              <span class="text-[#8fa2cb]/60">/</span>
              <span class="text-[#8fa2cb]">{formatTime(clipStore.selectedDuration)}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-[#22396f] text-[#fcf1d0] ml-1">KLIP #{clipStore.activeClipRank}</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick={() => handleSeekRelative(-5)} class="p-1 rounded-lg bg-[#0d1c42] hover:bg-[#22396f] text-[#8fa2cb] hover:text-[#fcf1d0] transition" title="Mundur 5 detik (J)">
                <RotateCcw size={13} />
              </button>
              <button type="button" onclick={() => isPlaying = !isPlaying} class="w-7 h-7 rounded-full bg-[#fcf1d0] text-[#010736] font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition" title="Play / Pause (Space)">
                {#if isPlaying}<Pause size={13} class="fill-[#010736]" />{:else}<Play size={13} class="fill-[#010736] ml-0.5" />{/if}
              </button>
              <button type="button" onclick={() => handleSeekRelative(5)} class="p-1 rounded-lg bg-[#0d1c42] hover:bg-[#22396f] text-[#8fa2cb] hover:text-[#fcf1d0] transition" title="Maju 5 detik (L)">
                <RotateCw size={13} />
              </button>
            </div>
            <div class="flex items-center gap-2 text-[10px]">
              <div class="flex items-center gap-1">
                <span class="text-[#8fa2cb]">IN:</span>
                <button type="button" onclick={() => adjustInPoint(-1)} class="px-1 rounded bg-[#0d1c42] text-[#fcf1d0] hover:bg-[#22396f]">-1s</button>
                <span class="text-[#fcf1d0] font-bold">{clipStore.selectedStart.toFixed(1)}s</span>
                <button type="button" onclick={() => adjustInPoint(1)} class="px-1 rounded bg-[#0d1c42] text-[#fcf1d0] hover:bg-[#22396f]">+1s</button>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[#8fa2cb]">OUT:</span>
                <button type="button" onclick={() => adjustOutPoint(-1)} class="px-1 rounded bg-[#0d1c42] text-[#fcf1d0] hover:bg-[#22396f]">-1s</button>
                <span class="text-[#fcf1d0] font-bold">{clipStore.selectedEnd.toFixed(1)}s</span>
                <button type="button" onclick={() => adjustOutPoint(1)} class="px-1 rounded bg-[#0d1c42] text-[#fcf1d0] hover:bg-[#22396f]">+1s</button>
              </div>
            </div>
          </div>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            role="slider" tabindex="0" aria-valuenow={currentTime} aria-valuemin={clipStore.selectedStart} aria-valuemax={clipStore.selectedEnd}
            onclick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              currentTime = clipStore.selectedStart + (ratio * clipStore.selectedDuration);
            }}
            class="relative h-6 w-full cursor-pointer bg-[#0d1c42] rounded-lg border border-[#22396f]/40 overflow-hidden"
          >
            <div class="absolute left-0 top-0 bottom-0 bg-[#fcf1d0]/15 border-r-2 border-[#fcf1d0] pointer-events-none" style="width: {playedRatio * 100}%;"></div>
            <div class="absolute top-0 bottom-0 w-2.5 -ml-1 flex items-center justify-center pointer-events-none z-10" style="left: {playedRatio * 100}%;">
              <div class="w-2.5 h-4 rounded bg-[#fcf1d0] border border-black/40"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- KANAN: fitur edit inspector -->
      <div class="lg:col-span-5 h-full flex flex-col bg-[#0d1c42] border border-[#22396f]/50 rounded-2xl p-2.5 overflow-hidden shadow-xl">
        <CaptionMoodPanel {activeTranscriptText} onRender={handleExport} />
      </div>
    </div>

    <!-- BAWAH: full-width hook editing tray -->
    <div class="h-36 flex-shrink-0 flex flex-col bg-[#0d1c42] border border-[#22396f]/50 rounded-2xl p-2.5 overflow-hidden shadow-xl">
      <div class="flex-shrink-0 flex items-center justify-between pb-1.5 border-b border-[#22396f]/40 mb-1.5">
        <div class="flex items-center gap-2">
          <Film size={13} class="text-[#fcf1d0]" />
          <span class="text-xs font-bold text-[#fcf1d0] uppercase">HOOK EDITING DARI SEMUA VIDEO ({clipStore.analysisResult.topClips.length} KLIP)</span>
          <span class="text-[10px] text-[#8fa2cb]">{clipStore.exportMode === 'bulk' ? `(${clipStore.selectedClipIdsForBulk.length} dipilih)` : '• Klik untuk edit'}</span>
        </div>
        {#if clipStore.exportMode === 'bulk'}
          <button type="button" onclick={() => {
            if (clipStore.selectedClipIdsForBulk.length === (clipStore.analysisResult?.topClips.length || 0)) clipStore.deselectAllClips();
            else clipStore.selectAllClips();
          }} class="px-2.5 py-0.5 rounded text-[10px] font-bold border border-[#22396f] bg-[#010736] text-[#fcf1d0] hover:border-[#fcf1d0]/50">
            {clipStore.selectedClipIdsForBulk.length === (clipStore.analysisResult?.topClips.length || 0) ? 'Batal Semua' : 'Pilih Semua'}
          </button>
        {/if}
      </div>
      <div class="flex-1 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {#each clipStore.analysisResult.topClips as clip}
          {@const isActive = clip.rank === clipStore.activeClipRank}
          {@const isChecked = clipStore.selectedClipIdsForBulk.includes(clip.id)}
          {@const isDownloaded = clipStore.isClipDownloaded(clip)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="h-full w-56 flex-shrink-0 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all {isActive ? 'bg-[#22396f] border-[#fcf1d0] text-[#fcf1d0] shadow-lg ring-1 ring-[#fcf1d0]/50' : 'bg-[#010736] border-[#22396f]/40 text-[#8fa2cb] hover:text-[#fcf1d0] hover:border-[#fcf1d0]/40'}" onclick={() => handleSelectClip(clip)}>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                {#if clipStore.exportMode === 'bulk'}
                  <input type="checkbox" checked={isChecked} onclick={(e) => { e.stopPropagation(); clipStore.toggleBulkSelect(clip.id); }} class="w-3.5 h-3.5 rounded bg-[#0d1c42] accent-[#fcf1d0] cursor-pointer" />
                {/if}
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold {isActive ? 'bg-[#fcf1d0] text-[#010736]' : 'bg-[#22396f] text-[#fcf1d0]'}">#{clip.rank}</span>
                <span class="text-[10px] font-bold">{clip.score}%</span>
                {#if clip.category}<span class="text-[8px] px-1 rounded bg-black/50 text-[#fcf1d0]">{clip.category}</span>{/if}
              </div>
              {#if isDownloaded}<span class="text-[9px] flex items-center gap-0.5 font-bold text-[#fcf1d0]"><CheckCircle2 size={11} /><span>Ready</span></span>{/if}
            </div>
            <p class="text-[10px] leading-tight line-clamp-2 my-1 {isActive ? 'text-[#fcf1d0]' : 'text-[#8fa2cb]'}">"{clip.label || 'Spoken Hook'}"</p>
            <div class="flex items-center justify-between text-[9px] text-[#8fa2cb]/80 pt-1 border-t border-[#22396f]/30">
              <span>{formatTime(clip.start)} - {formatTime(clip.end)}</span>
              <span class="font-bold text-[#c7d5f5]">{clip.duration.toFixed(1)}s</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
