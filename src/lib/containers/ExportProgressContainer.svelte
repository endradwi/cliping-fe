<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import { subscribeToProgress } from '../services/sse.client';
  import { API_BASE } from '../services/api.client';
  import { Download, CheckCircle2, AlertCircle, Loader2, ExternalLink, Copy, Check, Sparkles } from 'lucide-svelte';
  import Button from '../components/ui/Button.svelte';

  let unsubscribe: (() => void) | null = null;
  let copiedMeta = $state(false);

  function copyCompletedMeta() {
    const rec = clipStore.getRecommendationForActiveClip();
    if (!rec) return;
    const text = `${rec.tiktok.title}\n\n${rec.tiktok.caption}\n\n${rec.tiktok.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    copiedMeta = true;
    setTimeout(() => copiedMeta = false, 2500);
  }

  $effect(() => {
    if (clipStore.activeJobId && clipStore.isRendering) {
      unsubscribe = subscribeToProgress(clipStore.activeJobId, (data) => {
        clipStore.renderProgress = data;
        if (data.status === 'completed' || data.status === 'failed') {
          clipStore.isRendering = false;
          if (data.status === 'completed' && data.r2Url) {
            clipStore.markClipDownloaded(clipStore.selectedStart, clipStore.selectedEnd, data.id, data.r2Url);
          }
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  });

  function handleClose() {
    clipStore.isRendering = false;
    clipStore.renderProgress = null;
    clipStore.activeJobId = null;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }
</script>

{#if clipStore.renderProgress}
  <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-[#0d1c42] border border-[#22396f]/50 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
      {#if clipStore.renderProgress.status === 'completed'}
        <div class="w-12 h-12 rounded-full bg-[#22396f]/30 border border-[#22396f] text-[#fcf1d0] flex items-center justify-center mb-3 shadow-lg">
          <CheckCircle2 size={28} />
        </div>
        <h3 class="text-lg font-bold text-[#fcf1d0] mb-1">Clip Rendered Successfully!</h3>
        <p class="text-xs text-[#8fa2cb] mb-5">High-definition 9:16 vertical video ready to save.</p>

        <div class="w-full flex flex-col gap-2.5">
          <!-- Primary Direct Stream Download (bypasses ISP blocks on *.r2.dev) -->
          <a
            href={`${API_BASE}/api/v1/clips/${clipStore.renderProgress.id}/download`}
            download
            class="w-full py-2.5 px-4 bg-[#22396f] hover:bg-[#22396f] text-[#fcf1d0] font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg border border-[#fcf1d0]/20"
          >
            <Download size={16} />
            <span>Download MP4</span>
          </a>

          {#if clipStore.getRecommendationForActiveClip()}
            <button
              type="button"
              onclick={copyCompletedMeta}
              class="w-full py-2 px-3 rounded-xl bg-[#010736] hover:bg-[#0d1c42] border border-[#22396f]/50 text-[#fcf1d0] text-xs font-mono flex items-center justify-center gap-1.5 transition"
            >
              {#if copiedMeta}
                <Check size={14} class="text-emerald-400" />
                <span class="text-emerald-300 font-bold">Caption & Hashtags Tersalin!</span>
              {:else}
                <Copy size={14} class="text-[#fcf1d0]" />
                <span>Salin Caption & Hashtags TikTok</span>
              {/if}
            </button>
          {/if}

          <!-- Secondary options -->
          <div class="flex items-center gap-2 w-full">
            {#if clipStore.renderProgress.r2Url}
              <a
                href={clipStore.renderProgress.r2Url}
                target="_blank"
                rel="noreferrer"
                class="flex-1 py-2 px-3 bg-[#010736] hover:bg-[#0d1c42] text-[#8fa2cb] hover:text-[#fcf1d0] border border-[#22396f]/30 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition truncate"
              >
                <ExternalLink size={13} />
                <span>Link Cadangan</span>
              </a>
            {/if}
            <Button variant="outline" size="sm" class="flex-1 py-2 text-xs" onclick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      {:else if clipStore.renderProgress.status === 'failed'}
        <div class="w-12 h-12 rounded-full bg-red-950 border border-red-800 text-red-300 flex items-center justify-center mb-3">
          <AlertCircle size={28} />
        </div>
        <h3 class="text-lg font-bold text-[#fcf1d0] mb-1">Render Failed</h3>
        <p class="text-xs text-red-300 mb-5">{clipStore.renderProgress.error || 'Unknown pipeline failure'}</p>
        <Button variant="outline" onclick={handleClose}>
          Close
        </Button>
      {:else}
        <!-- In Progress -->
        <div class="w-12 h-12 rounded-full bg-[#22396f]/40 border border-[#22396f] text-[#fcf1d0] flex items-center justify-center mb-3">
          <Loader2 size={26} class="animate-spin" />
        </div>
        <h3 class="text-lg font-bold text-[#fcf1d0] mb-1 capitalize">
          {clipStore.renderProgress.status === 'queued' ? 'Menyiapkan Render' : (clipStore.renderProgress.status === 'downloading' ? 'Memproses Video' : (clipStore.renderProgress.status === 'slicing' ? 'Memotong & Merender Klip' : 'Menyimpan Hasil'))}...
        </h3>
        <p class="text-xs text-[#8fa2cb] mb-4 font-mono">
          {clipStore.renderProgress.progressPercent}% Selesai
        </p>

        <!-- Progress bar -->
        <div class="w-full h-2.5 bg-[#010736] rounded-full overflow-hidden border border-[#22396f]/30 mb-2">
          <div
            class="h-full bg-[#fcf1d0] transition-all duration-300 rounded-full"
            style="width: {clipStore.renderProgress.progressPercent}%"
          ></div>
        </div>
        <span class="text-[11px] text-[#8fa2cb] font-mono">
          Sedang memproses & merender video HD...
        </span>
      {/if}
    </div>
  </div>
{/if}
