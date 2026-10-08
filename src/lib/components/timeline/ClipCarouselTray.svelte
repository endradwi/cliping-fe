<script lang="ts">
  import { clipStore } from '../../stores/clip.svelte';
  import type { CandidateClip } from '../../types';
  import { Flame, CheckCircle, ExternalLink, Sparkles, Play } from 'lucide-svelte';

  let {
    onSelectClip
  }: {
    onSelectClip: (clip: CandidateClip) => void;
  } = $props();

  function getCategoryColor(cat?: string) {
    switch (cat) {
      case 'EDU':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'CTRL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'INSP':
      default:
        return 'bg-[#D4FF00]/20 text-[#D4FF00] border-[#D4FF00]/40';
    }
  }
</script>

<div class="w-full flex flex-col gap-3 p-4 bg-[#150000]/90 border border-[#757D6F]/30 rounded-2xl backdrop-blur-md shadow-2xl">
  <!-- Top Bar: Filter Tabs -->
  <div class="flex items-center justify-between pb-2 border-b border-[#757D6F]/20">
    <div class="flex items-center gap-2 overflow-x-auto">
      <button
        type="button"
        onclick={() => clipStore.clipFilter = 'all'}
        class="px-3 py-1 rounded-full text-xs font-mono transition {clipStore.clipFilter === 'all' ? 'bg-[#D4FF00] text-black font-bold' : 'bg-[#2D0000] text-[#A9B3A1] hover:text-[#EEEAD7]'}"
      >
        All {clipStore.analysisResult?.topClips.length || 0}
      </button>

      <button
        type="button"
        onclick={() => clipStore.clipFilter = 'hot'}
        class="px-3 py-1 rounded-full text-xs font-mono transition flex items-center gap-1 {clipStore.clipFilter === 'hot' ? 'bg-[#6D0808] text-[#EEEAD7] font-bold border border-[#870E0E]' : 'bg-[#2D0000] text-[#A9B3A1] hover:text-[#EEEAD7]'}"
      >
        <Flame size={12} class="text-[#EEEAD7]" />
        <span>Hot Peaks</span>
      </button>

      <button
        type="button"
        onclick={() => clipStore.clipFilter = 'rendered'}
        class="px-3 py-1 rounded-full text-xs font-mono transition flex items-center gap-1 {clipStore.clipFilter === 'rendered' ? 'bg-[#757D6F] text-[#EEEAD7] font-bold' : 'bg-[#2D0000] text-[#A9B3A1] hover:text-[#EEEAD7]'}"
      >
        <CheckCircle size={12} />
        <span>Rendered</span>
      </button>
    </div>

    <div class="hidden sm:flex items-center gap-2 text-xs font-mono text-[#A9B3A1]">
      <span class="text-[#D4FF00]">● 9:16 VERTICAL AUTO-HOOK</span>
    </div>
  </div>

  <!-- Horizontal Scrollable Cards Strip -->
  <div class="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-[#757D6F]/30">
    {#each clipStore.filteredClips as clip}
      {@const isSelected = clipStore.activeClipRank === clip.rank}
      {@const cat = clip.category || (clip.rank % 3 === 1 ? 'EDU' : (clip.rank % 3 === 2 ? 'CTRL' : 'INSP'))}
      <button
        type="button"
        onclick={() => onSelectClip(clip)}
        class="flex-shrink-0 w-44 sm:w-48 p-3 rounded-xl text-left font-mono transition-all relative flex flex-col justify-between gap-2 border {isSelected ? 'bg-[#2D0000] border-[#D4FF00] shadow-lg shadow-[#D4FF00]/10 scale-[1.02]' : 'bg-[#1a0000] border-[#757D6F]/25 hover:border-[#757D6F]/60'}"
      >
        <!-- Card Header: Badges -->
        <div class="flex items-center justify-between w-full">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border {getCategoryColor(cat)}">
            {cat}
          </span>
          <span class="text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded border border-white/10">
            ★ {clip.score}%
          </span>
        </div>

        <!-- Middle: Title & Time Slice -->
        <div>
          <div class="text-xs font-bold text-[#EEEAD7] line-clamp-1 flex items-center gap-1">
            {#if isSelected}
              <Play size={11} class="text-[#D4FF00] fill-[#D4FF00]" />
            {/if}
            <span>Clip #{clip.rank}</span>
          </div>
          <span class="text-[11px] text-[#A9B3A1]">
            {clip.start}s – {clip.end}s ({clip.duration}s)
          </span>
        </div>

        <!-- Footer: 9:16 Aspect Pill -->
        <div class="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-[#757D6F]">
          <span class="px-1 bg-black/40 rounded text-white/50">9:16</span>
          <span class="text-[#D4FF00] font-bold">{isSelected ? 'ACTIVE' : 'SELECT ➔'}</span>
        </div>
      </button>
    {/each}

    {#if clipStore.filteredClips.length === 0}
      <div class="p-4 text-xs font-mono text-[#757D6F]">
        No clips found for this filter.
      </div>
    {/if}
  </div>
</div>
