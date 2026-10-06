<script lang="ts">
  import '../app.css';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import SettingsModalContainer from '$lib/containers/SettingsModalContainer.svelte';
  import ExportProgressContainer from '$lib/containers/ExportProgressContainer.svelte';
  import { Settings, Clapperboard, Github } from 'lucide-svelte';

  let { children } = $props();
</script>

<div class="min-h-screen bg-[#150000] text-[#EEEAD7] flex flex-col selection:bg-[#6D0808] selection:text-[#EEEAD7]">
  <!-- Top Navigation Bar -->
  <header class="w-full border-b border-[#757D6F]/30 bg-[#2D0000]/80 backdrop-blur-xl sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2.5 font-bold tracking-tight text-[#EEEAD7] hover:opacity-90 transition">
        <div class="w-8 h-8 rounded-lg bg-[#6D0808] flex items-center justify-center text-[#EEEAD7] shadow-lg shadow-black/60 border border-[#870E0E]/50">
          <Clapperboard size={18} />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-base tracking-wider uppercase font-black">Clipping</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#150000] border border-[#757D6F]/40 text-[#EEEAD7] font-semibold">PRO</span>
        </div>
      </a>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          onclick={() => settingsStore.toggle()}
          class="p-2 rounded-lg bg-[#2D0000] border border-[#757D6F]/40 text-[#A9B3A1] hover:text-[#EEEAD7] hover:border-[#EEEAD7]/40 transition"
          title="AI & Storage Settings"
        >
          <Settings size={18} />
        </button>

        <a
          href="https://github.com/endradwi"
          target="_blank"
          rel="noreferrer"
          class="p-2 rounded-lg bg-[#2D0000] border border-[#757D6F]/40 text-[#A9B3A1] hover:text-[#EEEAD7] hover:border-[#EEEAD7]/40 transition"
        >
          <Github size={18} />
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
    {@render children()}
  </main>

  <!-- Modals -->
  <SettingsModalContainer />
  <ExportProgressContainer />
</div>
