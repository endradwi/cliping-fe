<script lang="ts">
  import UrlSubmitContainer from '$lib/containers/UrlSubmitContainer.svelte';
  import HeatmapStudioContainer from '$lib/containers/HeatmapStudioContainer.svelte';
  import { clipStore } from '$lib/stores/clip.svelte';
  import { Sparkles, Zap, ShieldCheck } from 'lucide-svelte';
</script>

<div class="h-full w-full flex flex-col overflow-hidden">
  {#if !clipStore.hasVideo}
    <!-- Hero Header (Scrollable on small screens) -->
    <div class="flex-1 overflow-y-auto flex flex-col items-center justify-center py-8">
      <div class="text-center max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d1c42] border border-[#22396f] text-[#fcf1d0] text-xs font-mono mb-4 shadow-inner">
          <Sparkles size={14} class="text-[#fcf1d0]" />
          <span>AI Viral Clipper Studio</span>
        </div>

        <h1 class="text-3xl md:text-5xl font-black tracking-tight text-[#fcf1d0] mb-3">
          Turn Long Videos Into <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fcf1d0] via-[#c7d5f5] to-[#8fa2cb]">Viral Short Clips</span>
        </h1>

        <p class="text-xs md:text-sm text-[#8fa2cb] mb-6 leading-relaxed">
          Ubah podcast dan video panjang menjadi puluhan klip vertikal siap upload ke TikTok, Reels, dan Shorts. Otomatis crop wajah, subtitle kinetic dinamis, dan hook judul viral.
        </p>

        <!-- URL Input Field Container -->
        <UrlSubmitContainer />

        <!-- Feature Pill highlights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-xl mx-auto mt-8 text-left">
          <div class="p-3 bg-[#0d1c42]/80 border border-[#22396f]/50 rounded-xl">
            <Zap size={15} class="text-[#fcf1d0] mb-1.5" />
            <h2 class="text-xs font-bold text-[#fcf1d0] mb-0.5">Mendukung Video 2 Jam</h2>
            <p class="text-[10px] text-[#8fa2cb]">Dukungan penuh untuk video panjang, podcast, dan recording.</p>
          </div>
          <div class="p-3 bg-[#0d1c42]/80 border border-[#22396f]/50 rounded-xl">
            <Sparkles size={15} class="text-[#fcf1d0] mb-1.5" />
            <h2 class="text-xs font-bold text-[#fcf1d0] mb-0.5">Otomatis Deteksi Hook</h2>
            <p class="text-[10px] text-[#8fa2cb]">AI menemukan momen terbaik dan percakapan paling menarik.</p>
          </div>
          <div class="p-3 bg-[#0d1c42]/80 border border-[#22396f]/50 rounded-xl">
            <ShieldCheck size={15} class="text-[#fcf1d0] mb-1.5" />
            <h2 class="text-xs font-bold text-[#fcf1d0] mb-0.5">Export Cepat HD 1080p</h2>
            <p class="text-[10px] text-[#8fa2cb]">Format 9:16 portrait, pan kamera fleksibel, atau ambient blur.</p>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Active Video Studio Workspace (Locked to 100% Height, Zero Body Scroll) -->
    <div class="flex-1 min-h-0 w-full h-full overflow-hidden flex flex-col">
      <HeatmapStudioContainer />
    </div>
  {/if}
</div>
