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
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D0000] border border-[#757D6F]/40 text-[#EEEAD7] text-xs font-mono mb-4 shadow-inner">
        <Sparkles size={14} class="text-[#EEEAD7]" />
        <span>Audience Retention Telemetry Engine</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-black tracking-tight text-[#EEEAD7] mb-4">
        Turn Long Videos Into <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#EEEAD7] via-[#C7D0BF] to-[#6D0808]">Viral Short Clips</span>
      </h1>

      <p class="text-sm md:text-base text-[#A9B3A1] mb-8 leading-relaxed">
        Extract peak audience retention moments or AI spoken dialogue hooks from 2-hour podcasts, Twitch streams, and YouTube videos. Multi-aspect ratio, live kinetic captions, and bulk ZIP exports.
      </p>

      <!-- URL Input Field Container -->
      <UrlSubmitContainer />

      <!-- Feature Pill highlights -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto mt-12 text-left">
        <div class="p-3.5 bg-[#2D0000]/60 border border-[#757D6F]/30 rounded-xl">
          <Zap size={16} class="text-[#EEEAD7] mb-2" />
          <h2 class="text-xs font-bold text-[#EEEAD7] mb-1">Up to 2h VOD Support</h2>
          <p class="text-[11px] text-[#A9B3A1]">Intelligent audio chunking handles long podcasts seamlessly.</p>
        </div>
        <div class="p-3.5 bg-[#2D0000]/60 border border-[#757D6F]/30 rounded-xl">
          <Sparkles size={16} class="text-[#EEEAD7] mb-2" />
          <h2 class="text-xs font-bold text-[#EEEAD7] mb-1">Dual Video Source</h2>
          <p class="text-[11px] text-[#A9B3A1]">Zero-block direct R2 upload + YouTube telemetry curve.</p>
        </div>
        <div class="p-3.5 bg-[#2D0000]/60 border border-[#757D6F]/30 rounded-xl">
          <ShieldCheck size={16} class="text-[#EEEAD7] mb-2" />
          <h2 class="text-xs font-bold text-[#EEEAD7] mb-1">Bulk ZIP Download</h2>
          <p class="text-[11px] text-[#A9B3A1]">Package all rendered clips in 1 click right in browser.</p>
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
          class="text-xs font-mono text-[#A9B3A1] hover:text-[#EEEAD7] underline"
        >
          ← Process another video
        </button>
      </div>

      <HeatmapStudioContainer />
    </div>
  {/if}
</div>
