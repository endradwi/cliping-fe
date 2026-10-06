<script lang="ts">
  import '../app.css';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import SettingsModalContainer from '$lib/containers/SettingsModalContainer.svelte';
  import ExportProgressContainer from '$lib/containers/ExportProgressContainer.svelte';
  import { Settings, Clapperboard, Github } from 'lucide-svelte';

  let { children } = $props();
</script>

<div class="min-h-screen bg-black text-slate-100 flex flex-col">
  <!-- Top Navigation Bar -->
  <header class="w-full border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90 transition">
        <div class="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
          <Clapperboard size={18} />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-base tracking-wider uppercase font-black">Cheat-Clip</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-rose-400 font-semibold">PRO LEAN</span>
        </div>
      </a>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          onclick={() => settingsStore.toggle()}
          class="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
          title="AI & Storage Settings"
        >
          <Settings size={18} />
        </button>

        <a
          href="https://github.com/endradwi"
          target="_blank"
          rel="noreferrer"
          class="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
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
