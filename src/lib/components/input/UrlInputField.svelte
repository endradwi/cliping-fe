<script lang="ts">
  import Button from '../ui/Button.svelte';
  import { Search, Loader2 } from 'lucide-svelte';

  let {
    value = $bindable(''),
    loading = false,
    onsubmit
  }: {
    value: string;
    loading: boolean;
    onsubmit: (url: string) => void;
  } = $props();

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (value.trim()) onsubmit(value.trim());
  }
</script>

<form
  onsubmit={handleSubmit}
  class="w-full max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-[#2D0000]/80 border border-[#757D6F]/40 rounded-2xl shadow-2xl backdrop-blur-xl transition-all focus-within:border-[#6D0808] focus-within:ring-2 focus-within:ring-[#6D0808]/30"
>
  <div class="flex items-center flex-1 min-w-0 px-2">
    <div class="pl-2 pr-1 text-[#757D6F]">
      <Search size={18} />
    </div>
    <input
      type="url"
      bind:value
      disabled={loading}
      placeholder="Paste YouTube URL..."
      class="w-full bg-transparent px-2 py-2.5 text-sm text-[#EEEAD7] placeholder:text-[#757D6F] focus:outline-none"
      required
    />
  </div>
  <Button
    type="submit"
    disabled={loading || !value.trim()}
    size="md"
    variant="primary"
    class="w-full sm:w-auto h-11 sm:h-10 text-sm font-semibold whitespace-nowrap"
  >
    {#if loading}
      <Loader2 size={16} class="animate-spin" />
      <span>Analyzing...</span>
    {:else}
      <span>Extract Hotspots</span>
    {/if}
  </Button>
</form>
