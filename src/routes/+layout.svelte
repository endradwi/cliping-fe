<script lang="ts">
  import '../app.css';
  import ExportProgressContainer from '$lib/containers/ExportProgressContainer.svelte';
  import { Clapperboard, Github, Sparkles } from 'lucide-svelte';

  let { children } = $props();
</script>

<div class="h-screen w-screen overflow-hidden bg-[#150000] text-[#EEEAD7] flex flex-col selection:bg-[#6D0808] selection:text-[#EEEAD7]">
  <!-- Top Navigation Bar -->
  <header class="w-full h-12 flex-shrink-0 border-b border-[#757D6F]/30 bg-[#2D0000]/80 backdrop-blur-xl z-40">
    <div class="max-w-[1760px] w-full mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2 font-bold tracking-tight text-[#EEEAD7] hover:opacity-90 transition">
        <div class="w-7 h-7 rounded-lg bg-[#6D0808] flex items-center justify-center text-[#EEEAD7] shadow-lg shadow-black/60 border border-[#870E0E]/50">
          <Clapperboard size={15} />
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-sm tracking-wider uppercase font-black">Clipping</span>
          <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#150000] border border-[#757D6F]/40 text-[#EEEAD7] font-semibold">PRO</span>
        </div>
      </a>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <!-- Human-Friendly System Status Badge -->
        <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#150000] border border-[#757D6F]/30 text-[10px] font-mono text-[#A9B3A1]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-pulse"></span>
          <span class="text-[#EEEAD7] font-semibold">Cloud Engine Active</span>
        </div>

        <a
          href="https://github.com/endradwi"
          target="_blank"
          rel="noreferrer"
          class="p-1.5 rounded-lg bg-[#2D0000] border border-[#757D6F]/40 text-[#A9B3A1] hover:text-[#EEEAD7] hover:border-[#EEEAD7]/40 transition"
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
