<script lang="ts">
  import UrlSubmitContainer from '$lib/containers/UrlSubmitContainer.svelte';
  import HeatmapStudioContainer from '$lib/containers/HeatmapStudioContainer.svelte';
  import { clipStore } from '$lib/stores/clip.svelte';
  import { Sparkles, Zap, ShieldCheck } from 'lucide-svelte';
</script>

<div class="flex flex-col items-center">
  {#if !clipStore.hasVideo}
    <!-- Hero Header -->
    <div class="text-center max-w-2xl mx-auto my-12">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-mono mb-4 shadow-inner">
        <Sparkles size={14} class="text-rose-400" />
        <span>Audience Retention Telemetry Engine</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
        Turn YouTube Videos Into <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400">Viral 9:16 Clips</span>
      </h1>

      <p class="text-sm md:text-base text-neutral-400 mb-8 leading-relaxed">
        Extract the exact moments audiences replayed most. Zero-disk stream slicing, automated 9:16 vertical cropping, and instant Cloudflare R2 delivery.
      </p>

      <!-- URL Input Field Container -->
      <UrlSubmitContainer />

      <!-- Feature Pill highlights -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto mt-12 text-left">
        <div class="p-3.5 bg-neutral-950 border border-neutral-900 rounded-xl">
          <Zap size={16} class="text-rose-400 mb-2" />
          <h2 class="text-xs font-bold text-white mb-1">Top 3 Batch Slicing</h2>
          <p class="text-[11px] text-neutral-400">3 peak retention highlights ready in seconds.</p>
        </div>
        <div class="p-3.5 bg-neutral-950 border border-neutral-900 rounded-xl">
          <Sparkles size={16} class="text-amber-400 mb-2" />
          <h2 class="text-xs font-bold text-white mb-1">Zero-Disk Stream</h2>
          <p class="text-[11px] text-neutral-400">FFmpeg cuts directly without saving 1GB files.</p>
        </div>
        <div class="p-3.5 bg-neutral-950 border border-neutral-900 rounded-xl">
          <ShieldCheck size={16} class="text-emerald-400 mb-2" />
          <h2 class="text-xs font-bold text-white mb-1">Pure Telemetry (RPI)</h2>
          <p class="text-[11px] text-neutral-400">Mathematical retention curve, zero AI hallucination.</p>
        </div>
      </div>
    </div>
  {:else}
    <!-- Active Video Studio Workspace -->
    <div class="w-full">
      <div class="w-full flex justify-end mb-2">
        <button
          type="button"
          onclick={() => clipStore.reset()}
          class="text-xs font-mono text-neutral-500 hover:text-rose-400 underline"
        >
          ← Process another video
        </button>
      </div>

      <HeatmapStudioContainer />
    </div>
  {/if}
</div>
