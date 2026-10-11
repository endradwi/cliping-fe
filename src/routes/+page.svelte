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
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D0000] border border-[#757D6F]/40 text-[#D4FF00] text-xs font-mono mb-4 shadow-inner">
        <Sparkles size={14} class="text-[#D4FF00]" />
        <span>AI Viral Clipper Studio</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-black tracking-tight text-[#EEEAD7] mb-4">
        Turn Long Videos Into <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#D4FF00] via-[#EEEAD7] to-[#A9B3A1]">Viral Short Clips</span>
      </h1>

      <p class="text-sm md:text-base text-[#A9B3A1] mb-8 leading-relaxed">
        Ubah podcast dan video panjang menjadi puluhan klip vertikal siap upload ke TikTok, Reels, dan Shorts. Otomatis crop wajah, subtitle kinetic dinamis, dan hook judul viral.
      </p>

      <!-- URL Input Field Container -->
      <UrlSubmitContainer />

      <!-- Feature Pill highlights -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto mt-12 text-left">
        <div class="p-3.5 bg-[#2D0000]/60 border border-[#757D6F]/30 rounded-xl">
          <Zap size={16} class="text-[#D4FF00] mb-2" />
          <h2 class="text-xs font-bold text-[#EEEAD7] mb-1">Mendukung Video 2 Jam</h2>
          <p class="text-[11px] text-[#A9B3A1]">Dukungan penuh untuk video panjang, podcast, dan recording.</p>
        </div>
        <div class="p-3.5 bg-[#2D0000]/60 border border-[#757D6F]/30 rounded-xl">
          <Sparkles size={16} class="text-[#D4FF00] mb-2" />
          <h2 class="text-xs font-bold text-[#EEEAD7] mb-1">Otomatis Deteksi Hook</h2>
          <p class="text-[11px] text-[#A9B3A1]">AI menemukan momen terbaik dan percakapan paling menarik.</p>
        </div>
        <div class="p-3.5 bg-[#2D0000]/60 border border-[#757D6F]/30 rounded-xl">
          <ShieldCheck size={16} class="text-[#D4FF00] mb-2" />
          <h2 class="text-xs font-bold text-[#EEEAD7] mb-1">Export Cepat HD 1080p</h2>
          <p class="text-[11px] text-[#A9B3A1]">Format 9:16 portrait, split podcast 50/50, atau ambient blur.</p>
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
