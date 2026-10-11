<script lang="ts">
  import '../app.css';
  import ExportProgressContainer from '$lib/containers/ExportProgressContainer.svelte';
  import { Clapperboard, Github, Sparkles } from 'lucide-svelte';

  let { children } = $props();
</script>

<div class="h-screen w-screen overflow-hidden bg-[#010736] text-[#fcf1d0] flex flex-col selection:bg-[#22396f] selection:text-[#fcf1d0]">
  <!-- Top Navigation Bar -->
  <header class="w-full h-12 flex-shrink-0 border-b border-[#22396f]/40 bg-[#0d1c42]/90 backdrop-blur-xl z-40">
    <div class="max-w-[1760px] w-full mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2 font-bold tracking-tight text-[#fcf1d0] hover:opacity-90 transition">
        <div class="w-7 h-7 rounded-lg bg-[#22396f] flex items-center justify-center text-[#fcf1d0] shadow-lg border border-[#22396f]/80">
          <Clapperboard size={15} />
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-sm tracking-wider uppercase font-black">Clipping</span>
          <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#010736] border border-[#22396f] text-[#fcf1d0] font-semibold">PRO</span>
        </div>
      </a>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <!-- Human-Friendly System Status Badge -->
        <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0d1c42] border border-[#22396f]/60 text-[10px] font-mono text-[#fcf1d0]/80">
          <span class="w-1.5 h-1.5 rounded-full bg-[#fcf1d0] animate-pulse"></span>
          <span class="text-[#fcf1d0] font-semibold">Cloud Engine Active</span>
        </div>

        <a
          href="https://github.com/endradwi"
          target="_blank"
          rel="noreferrer"
          class="p-1.5 rounded-lg bg-[#0d1c42] border border-[#22396f]/50 text-[#fcf1d0]/70 hover:text-[#fcf1d0] hover:border-[#fcf1d0]/40 transition"
          title="GitHub Repository"
        >
          <Github size={16} />
        </a>
      </div>
    </div>
  </header>

  <!-- Main Viewport (Zero Window Scroll) -->
  <main class="flex-1 min-h-0 w-full overflow-hidden flex flex-col max-w-[1760px] mx-auto px-3 sm:px-5 py-2">
    {@render children()}
  </main>

  <!-- Modals -->
  <ExportProgressContainer />
</div>
