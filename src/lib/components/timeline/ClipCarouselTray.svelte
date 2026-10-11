<script lang="ts">
  import { clipStore } from '../../stores/clip.svelte';
  import type { CandidateClip } from '../../types';
  import { triggerRenderClip } from '../../services/api.client';
  import { Flame, CheckCircle, Download, CheckSquare, Square, Loader2, Play, PackageCheck } from 'lucide-svelte';
  import JSZip from 'jszip';

  let {
    onSelectClip
  }: {
    onSelectClip: (clip: CandidateClip) => void;
  } = $props();

  let isBulkProcessing = $state(false);
  let bulkStatusText = $state('');

  function getCategoryColor(cat?: string) {
    switch (cat) {
      case 'EDU':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'CTRL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'INSP':
      default:
        return 'bg-[#D4FF00]/20 text-[#D4FF00] border-[#D4FF00]/40';
    }
  }

  async function handleBulkDownload() {
    const selectedIds = clipStore.selectedClipIdsForBulk;
    if (selectedIds.length === 0) return;

    const allClips = clipStore.analysisResult?.topClips || [];
    const targetClips = allClips.filter(c => selectedIds.includes(c.id));
    if (targetClips.length === 0) return;

    isBulkProcessing = true;
    const zip = new JSZip();

    try {
      for (let i = 0; i < targetClips.length; i++) {
        const clip = targetClips[i];
        bulkStatusText = `Processing clip ${i + 1}/${targetClips.length} (#${clip.rank})...`;

        let downloadUrl = clipStore.getClipDownloadUrl(clip);
        let jobId = clip.id;

        // Render clip sequentially if not rendered yet (keeps server CPU calm)
        if (!downloadUrl) {
          const res = await triggerRenderClip({
            url: clipStore.videoUrl,
            start: clip.start,
            end: clip.end,
            aspectRatio: clipStore.aspectRatio,
            burnSubtitles: clipStore.burnSubtitles,
            title: `${clipStore.analysisResult?.title || 'Clip'} #${clip.rank}`
          });

          jobId = res.jobId;

          if (res.r2Url && res.cached) {
            downloadUrl = res.r2Url;
          } else {
            // Wait for sequential render to complete via polling
            let pollAttempts = 0;
            while (pollAttempts < 60) {
              await new Promise(r => setTimeout(r, 2000));
              pollAttempts++;
              const checkRes = await fetch(`/api/v1/clips/${jobId}`);
              const checkData = await checkRes.json();
              if (checkData.success && checkData.data?.status === 'completed') {
                downloadUrl = checkData.data.r2Url;
                break;
              } else if (checkData.data?.status === 'failed') {
                throw new Error(`Clip #${clip.rank} render failed: ${checkData.data.error}`);
              }
            }
          }
        }

        // Fetch clip stream blob directly
        const fileFetchUrl = `/api/v1/clips/${jobId}/download`;
        const blobResp = await fetch(fileFetchUrl);
        if (!blobResp.ok) {
          throw new Error(`Failed to download clip #${clip.rank} stream`);
        }
        const blob = await blobResp.blob();

        const safeTitle = (clipStore.analysisResult?.title || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
        const fileName = `${safeTitle}_clip${clip.rank}_${clip.start}s-${clip.end}s.mp4`;
        zip.file(fileName, blob);

        // Mark clip as downloaded in store
        if (downloadUrl) {
          clipStore.markClipDownloaded(clip.start, clip.end, jobId, downloadUrl);
        }
      }

      // Generate ZIP blob directly in client browser memory (zero server compression load)
      bulkStatusText = 'Zipping files in browser...';
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        bulkStatusText = `Compressing ZIP: ${Math.round(metadata.percent)}%`;
      });

      // Trigger instant client download
      const safeZipTitle = (clipStore.analysisResult?.title || 'clipping').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = URL.createObjectURL(zipBlob);
      downloadAnchor.download = `${safeZipTitle}_clips_bulk.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(downloadAnchor.href);

      bulkStatusText = 'Done!';
      setTimeout(() => {
        isBulkProcessing = false;
        bulkStatusText = '';
      }, 2000);
    } catch (err: any) {
      alert(`Bulk download error: ${err.message}`);
      isBulkProcessing = false;
      bulkStatusText = '';
    }
  }
</script>

<div class="w-full flex flex-col gap-3 p-4 bg-[#150000]/90 border border-[#757D6F]/30 rounded-2xl backdrop-blur-md shadow-2xl">
  <!-- Top Bar: Filter Tabs & Bulk Actions -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#757D6F]/20">
    <!-- Filter Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto">
      <button
        type="button"
        onclick={() => clipStore.clipFilter = 'all'}
        class="px-3 py-1 rounded-full text-xs font-mono transition {clipStore.clipFilter === 'all' ? 'bg-[#D4FF00] text-black font-bold' : 'bg-[#2D0000] text-[#A9B3A1] hover:text-[#EEEAD7]'}"
      >
        All {clipStore.analysisResult?.topClips.length || 0}
      </button>

      <button
        type="button"
        onclick={() => clipStore.clipFilter = 'hot'}
        class="px-3 py-1 rounded-full text-xs font-mono transition flex items-center gap-1 {clipStore.clipFilter === 'hot' ? 'bg-[#6D0808] text-[#EEEAD7] font-bold border border-[#870E0E]' : 'bg-[#2D0000] text-[#A9B3A1] hover:text-[#EEEAD7]'}"
      >
        <Flame size={12} class="text-[#EEEAD7]" />
        <span>Hot Peaks</span>
      </button>

      <button
        type="button"
        onclick={() => clipStore.clipFilter = 'downloaded'}
        class="px-3 py-1 rounded-full text-xs font-mono transition flex items-center gap-1 {clipStore.clipFilter === 'downloaded' ? 'bg-emerald-600 text-white font-bold' : 'bg-[#2D0000] text-[#A9B3A1] hover:text-[#EEEAD7]'}"
      >
        <CheckCircle size={12} />
        <span>Downloaded</span>
      </button>
    </div>

    <!-- Bulk Actions (Select All + ZIP Download) -->
    <div class="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
      {#if clipStore.selectedClipIdsForBulk.length === (clipStore.analysisResult?.topClips.length || 0)}
        <button
          type="button"
          onclick={() => clipStore.deselectAllClips()}
          class="text-xs font-mono text-[#A9B3A1] hover:text-[#EEEAD7] underline"
        >
          Deselect All
        </button>
      {:else}
        <button
          type="button"
          onclick={() => clipStore.selectAllClips()}
          class="text-xs font-mono text-[#D4FF00] hover:underline"
        >
          Select All ({clipStore.analysisResult?.topClips.length || 0})
        </button>
      {/if}

      <!-- BULK DOWNLOAD BUTTON -->
      <button
        type="button"
        disabled={isBulkProcessing || clipStore.selectedClipIdsForBulk.length === 0}
        onclick={handleBulkDownload}
        class="px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg bg-[#D4FF00] text-black hover:bg-[#c7f000] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {#if isBulkProcessing}
          <Loader2 size={13} class="animate-spin" />
          <span>{bulkStatusText || 'Packaging...'}</span>
        {:else}
          <Download size={13} />
          <span>Download ZIP ({clipStore.selectedClipIdsForBulk.length})</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Horizontal Scrollable Cards Strip -->
  <div class="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-[#757D6F]/30">
    {#each clipStore.filteredClips as clip}
      {@const isSelected = clipStore.activeClipRank === clip.rank}
      {@const isChecked = clipStore.selectedClipIdsForBulk.includes(clip.id)}
      {@const isDownloaded = clipStore.isClipDownloaded(clip)}
      {@const cat = clip.category || (clip.rank % 3 === 1 ? 'EDU' : (clip.rank % 3 === 2 ? 'CTRL' : 'INSP'))}

      <div
        class="flex-shrink-0 w-48 sm:w-52 p-3 rounded-xl text-left font-mono transition-all relative flex flex-col justify-between gap-2.5 border {isDownloaded ? 'bg-[#18281a]/90 border-emerald-500/60 shadow-md shadow-emerald-950/40' : (isSelected ? 'bg-[#2D0000] border-[#D4FF00] shadow-lg shadow-[#D4FF00]/10' : 'bg-[#1a0000] border-[#757D6F]/25 hover:border-[#757D6F]/60')}"
      >
        <!-- Card Header: Checkbox + Badges -->
        <div class="flex items-center justify-between w-full">
          <button
            type="button"
            onclick={(e) => { e.stopPropagation(); clipStore.toggleBulkSelect(clip.id); }}
            class="text-[#D4FF00] hover:scale-110 transition-transform p-0.5"
            title="Select for bulk ZIP"
          >
            {#if isChecked}
              <CheckSquare size={16} class="fill-[#D4FF00] text-black" />
            {:else}
              <Square size={16} class="text-[#757D6F]" />
            {/if}
          </button>

          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border {getCategoryColor(cat)}">
              {cat}
            </span>
            <span class="text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded border border-white/10">
              ★ {clip.score}%
            </span>
          </div>
        </div>

        <!-- Middle: Title, Timeslice & Download Status Indicator -->
        <button
          type="button"
          onclick={() => onSelectClip(clip)}
          class="text-left w-full cursor-pointer focus:outline-none"
        >
          <div class="text-xs font-bold text-[#EEEAD7] line-clamp-1 flex items-center gap-1">
            {#if isSelected}
              <Play size={11} class="text-[#D4FF00] fill-[#D4FF00]" />
            {/if}
            <span>Clip #{clip.rank}</span>
          </div>

          <div class="text-[11px] text-[#A9B3A1] mt-0.5">
            {clip.start}s – {clip.end}s ({clip.duration}s)
          </div>

          <!-- Download Status Indicator -->
          <div class="mt-2">
            {#if isDownloaded}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                <PackageCheck size={11} />
                <span>DOWNLOADED ✓</span>
              </span>
            {:else}
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 text-[#A9B3A1] text-[10px]">
                <span>NEW CLIP</span>
              </span>
            {/if}
          </div>
        </button>

        <!-- Footer: 9:16 Aspect Pill & Selection Trigger -->
        <div class="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-[#757D6F]">
          <span class="px-1.5 py-0.2 bg-black/40 rounded text-white/50">9:16</span>
          <button
            type="button"
            onclick={() => onSelectClip(clip)}
            class="text-[#D4FF00] font-bold hover:underline"
          >
            {isSelected ? 'ACTIVE' : 'PREVIEW ➔'}
          </button>
        </div>
      </div>
    {/each}

    {#if clipStore.filteredClips.length === 0}
      <div class="p-6 text-xs font-mono text-[#757D6F] text-center w-full">
        No clips found matching "{clipStore.clipFilter}" filter.
      </div>
    {/if}
  </div>
</div>
