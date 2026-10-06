<script lang="ts">
  import UrlInputField from '../components/input/UrlInputField.svelte';
  import { analyzeVideoUrl } from '../services/api.client';
  import { clipStore } from '../stores/clip.svelte';

  let inputUrl = $state('');
  let errorMsg = $state<string | null>(null);

  async function handleAnalyze(url: string) {
    errorMsg = null;
    clipStore.isAnalyzing = true;
    try {
      const data = await analyzeVideoUrl(url);
      clipStore.setAnalysis(data, url);
    } catch (err: any) {
      errorMsg = err.message || 'Failed to fetch YouTube retention telemetry';
    } finally {
      clipStore.isAnalyzing = false;
    }
  }
</script>

<div class="w-full flex flex-col items-center">
  <UrlInputField
    bind:value={inputUrl}
    loading={clipStore.isAnalyzing}
    onsubmit={handleAnalyze}
  />

  {#if errorMsg}
    <div class="mt-3 px-4 py-2 bg-[#2D0000] border border-[#6D0808] text-[#EEEAD7] text-xs rounded-xl flex items-center gap-2">
      <span class="font-bold text-red-400">Error:</span> {errorMsg}
    </div>
  {/if}
</div>
