<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import { subscribeToProgress } from '../services/sse.client';
  import { Download, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-svelte';
  import Button from '../components/ui/Button.svelte';

  let unsubscribe: (() => void) | null = null;

  $effect(() => {
    if (clipStore.activeJobId && clipStore.isRendering) {
      unsubscribe = subscribeToProgress(clipStore.activeJobId, (data) => {
        clipStore.renderProgress = data;
        if (data.status === 'completed' || data.status === 'failed') {
          clipStore.isRendering = false;
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
    <div class="w-full max-w-md bg-[#2D0000] border border-[#757D6F]/50 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
      {#if clipStore.renderProgress.status === 'completed'}
        <div class="w-12 h-12 rounded-full bg-[#757D6F]/30 border border-[#757D6F] text-[#EEEAD7] flex items-center justify-center mb-3 shadow-lg">
          <CheckCircle2 size={28} />
        </div>
        <h3 class="text-lg font-bold text-[#EEEAD7] mb-1">Clip Rendered Successfully!</h3>
        <p class="text-xs text-[#A9B3A1] mb-5">High-definition 9:16 vertical video ready to save.</p>

        <div class="w-full flex flex-col gap-2.5">
          <!-- Primary Direct Stream Download (bypasses ISP blocks on *.r2.dev) -->
          <a
            href={`/api/v1/clips/${clipStore.renderProgress.id}/download`}
            download
            class="w-full py-2.5 px-4 bg-[#6D0808] hover:bg-[#870E0E] text-[#EEEAD7] font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg border border-[#EEEAD7]/20"
          >
            <Download size={16} />
            <span>Download MP4</span>
          </a>

          <!-- Secondary options -->
          <div class="flex items-center gap-2 w-full">
            {#if clipStore.renderProgress.r2Url}
              <a
                href={clipStore.renderProgress.r2Url}
                target="_blank"
                rel="noreferrer"
                class="flex-1 py-2 px-3 bg-[#150000] hover:bg-[#2D0000] text-[#A9B3A1] hover:text-[#EEEAD7] border border-[#757D6F]/30 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition truncate"
              >
                <ExternalLink size={13} />
                <span>R2 Mirror</span>
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
        <h3 class="text-lg font-bold text-[#EEEAD7] mb-1">Render Failed</h3>
        <p class="text-xs text-red-300 mb-5">{clipStore.renderProgress.error || 'Unknown pipeline failure'}</p>
        <Button variant="outline" onclick={handleClose}>
          Close
        </Button>
      {:else}
        <!-- In Progress -->
        <div class="w-12 h-12 rounded-full bg-[#6D0808]/40 border border-[#6D0808] text-[#EEEAD7] flex items-center justify-center mb-3">
          <Loader2 size={26} class="animate-spin" />
        </div>
        <h3 class="text-lg font-bold text-[#EEEAD7] mb-1 capitalize">
          {clipStore.renderProgress.status}...
        </h3>
        <p class="text-xs text-[#A9B3A1] mb-4 font-mono">
          {clipStore.renderProgress.progressPercent}% Completed
        </p>

        <!-- Progress bar -->
        <div class="w-full h-2.5 bg-[#150000] rounded-full overflow-hidden border border-[#757D6F]/30 mb-2">
          <div
            class="h-full bg-[#6D0808] transition-all duration-300 rounded-full"
            style="width: {clipStore.renderProgress.progressPercent}%"
          ></div>
        </div>
        <span class="text-[11px] text-[#757D6F] font-mono">
          Zero-disk FFmpeg stream-slicing & R2 upload in progress
        </span>
      {/if}
    </div>
  </div>
{/if}
