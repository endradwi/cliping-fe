<script lang="ts">
  import { clipStore } from '../stores/clip.svelte';
  import { subscribeToProgress } from '../services/sse.client';
  import { Download, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-svelte';
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
      if (unsubscribe) unsubscribe();
    };
  });
</script>

{#if clipStore.renderProgress}
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
      {#if clipStore.renderProgress.status === 'completed'}
        <div class="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 flex items-center justify-center mb-3 shadow-lg">
          <CheckCircle2 size={28} />
        </div>
        <h3 class="text-lg font-bold text-white mb-1">Clip Rendered Successfully!</h3>
        <p class="text-xs text-neutral-400 mb-5">Uploaded to Cloudflare R2 with 7-day auto-expiry.</p>

        <div class="w-full flex gap-3">
          <a
            href={clipStore.renderProgress.r2Url}
            target="_blank"
            download
            class="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition"
          >
            <Download size={16} />
            <span>Download MP4</span>
          </a>
          <Button variant="outline" onclick={() => clipStore.renderProgress = null}>
            Close
          </Button>
        </div>
      {:else if clipStore.renderProgress.status === 'failed'}
        <div class="w-12 h-12 rounded-full bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mb-3">
          <AlertCircle size={28} />
        </div>
        <h3 class="text-lg font-bold text-white mb-1">Render Failed</h3>
        <p class="text-xs text-red-300 mb-5">{clipStore.renderProgress.error || 'Unknown pipeline failure'}</p>
        <Button variant="outline" onclick={() => clipStore.renderProgress = null}>
          Close
        </Button>
      {:else}
        <!-- In Progress -->
        <div class="w-12 h-12 rounded-full bg-rose-950/50 border border-rose-800/60 text-rose-400 flex items-center justify-center mb-3">
          <Loader2 size={26} class="animate-spin" />
        </div>
        <h3 class="text-lg font-bold text-white mb-1 capitalize">
          {clipStore.renderProgress.status}...
        </h3>
        <p class="text-xs text-neutral-400 mb-4 font-mono">
          {clipStore.renderProgress.progressPercent}% Completed
        </p>

        <!-- Progress bar -->
        <div class="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 mb-2">
          <div
            class="h-full bg-rose-600 transition-all duration-300 rounded-full"
            style="width: {clipStore.renderProgress.progressPercent}%"
          ></div>
        </div>
        <span class="text-[11px] text-neutral-500 font-mono">
          Zero-disk FFmpeg slicing & R2 upload in progress
        </span>
      {/if}
    </div>
  </div>
{/if}
