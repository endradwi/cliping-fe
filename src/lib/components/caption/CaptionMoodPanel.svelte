<script lang="ts">
  import { clipStore, type SubtitleAnimation } from '../../stores/clip.svelte';
  import { Sparkles, Crop, Film, Type, Sliders, Download, Check } from 'lucide-svelte';

  let {
    activeTranscriptText = '',
    onRender
  }: {
    activeTranscriptText: string;
    onRender: () => void;
  } = $props();

  const aspectRatios = [
    { id: '9:16' as const, label: '9:16', desc: 'Shorts/TikTok/Reels' },
    { id: '4:5' as const, label: '4:5', desc: 'IG Portrait Feed' },
    { id: '1:1' as const, label: '1:1', desc: 'Square Post' },
    { id: '16:9' as const, label: '16:9', desc: 'YouTube Landscape' }
  ];

  const colorPalette = [
    { label: 'Electric Lime', color: '#D4FF00' },
    { label: 'Pure White', color: '#FFFFFF' },
    { label: 'Cyber Gold', color: '#FFE600' },
    { label: 'Sunset Orange', color: '#FF6B00' },
    { label: 'Hot Pink', color: '#FF2A85' },
    { label: 'Ice Cyan', color: '#00F0FF' },
    { label: 'Emerald Green', color: '#10B981' }
  ];

  const animationList: SubtitleAnimation[] = [
    'POP', 'FADE', 'RISE', 'DROP', 'ZOOM', 'TYPE', 'OFF'
  ];

  const hookThemes = [
    { id: 'yellow' as const, label: 'Kuning Box', class: 'bg-[#FFE600] text-black border-black/20' },
    { id: 'red' as const, label: 'Merah Bold', class: 'bg-[#FF1E1E] text-white border-white/20' },
    { id: 'neon' as const, label: 'Neon Lime', class: 'bg-[#D4FF00] text-black border-black/20' },
    { id: 'dark' as const, label: 'Dark Minimal', class: 'bg-black/90 text-white border-white/30' }
  ];
</script>

<div class="flex flex-col gap-4 text-[#EEEAD7]">
  <!-- SECTION 1: PODCAST FRAMING & TATA LETAK -->
  <div class="p-4 bg-[#200202]/80 border border-[#757D6F]/30 rounded-2xl backdrop-blur-md shadow-lg flex flex-col gap-3">
    <div class="flex items-center justify-between pb-2 border-b border-[#757D6F]/20 text-[11px] font-mono">
      <span class="font-bold text-[#EEEAD7] flex items-center gap-1.5 uppercase">
        <Film size={14} class="text-[#D4FF00]" />
        <span>1. FRAMING & FORMAT VIDEO</span>
      </span>
      <span class="text-[#D4FF00] font-bold">{clipStore.aspectRatio} • {clipStore.layoutMode.toUpperCase()}</span>
    </div>

    <!-- 3 Quick Layout Cards -->
    <div class="grid grid-cols-3 gap-2">
      <button
        type="button"
        onclick={() => clipStore.layoutMode = 'single'}
        class="p-2.5 rounded-xl text-left font-mono transition-all border flex flex-col justify-between {clipStore.layoutMode === 'single' ? 'bg-[#6D0808] border-[#D4FF00] text-[#EEEAD7] shadow-lg' : 'bg-[#150000] border-[#757D6F]/25 text-[#A9B3A1] hover:text-[#EEEAD7]'}"
      >
        <span class="text-xs font-bold">📱 Single</span>
        <span class="text-[9px] opacity-75 mt-0.5">1 Kamera</span>
      </button>

      <button
        type="button"
        onclick={() => clipStore.layoutMode = 'split'}
        class="p-2.5 rounded-xl text-left font-mono transition-all border flex flex-col justify-between {clipStore.layoutMode === 'split' ? 'bg-[#6D0808] border-[#D4FF00] text-[#EEEAD7] shadow-lg' : 'bg-[#150000] border-[#757D6F]/25 text-[#A9B3A1] hover:text-[#EEEAD7]'}"
        title="Podcast Split 50/50"
      >
        <span class="text-xs font-bold">🎙️ Split 50/50</span>
        <span class="text-[9px] opacity-75 mt-0.5">Host & Guest</span>
      </button>

      <button
        type="button"
        onclick={() => clipStore.layoutMode = 'fit-blur'}
        class="p-2.5 rounded-xl text-left font-mono transition-all border flex flex-col justify-between {clipStore.layoutMode === 'fit-blur' ? 'bg-[#6D0808] border-[#D4FF00] text-[#EEEAD7] shadow-lg' : 'bg-[#150000] border-[#757D6F]/25 text-[#A9B3A1] hover:text-[#EEEAD7]'}"
        title="Full video dengan blur background"
      >
        <span class="text-xs font-bold">🌫️ Fit Blur</span>
        <span class="text-[9px] opacity-75 mt-0.5">Latar Blur</span>
      </button>
    </div>

    <!-- If Single Mode: Presets Host/Center/Guest & Pan Slider -->
    {#if clipStore.layoutMode === 'single'}
      <div class="flex flex-col gap-2 p-2.5 bg-[#150000] rounded-xl border border-[#757D6F]/20 font-mono text-[11px]">
        <div class="flex items-center justify-between">
          <span class="text-[#A9B3A1]">FOKUS KAMERA:</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick={() => clipStore.panOffset = 0.15}
              class="px-2 py-0.5 rounded text-[10px] font-bold border transition {Math.abs(clipStore.panOffset - 0.15) < 0.05 ? 'bg-[#D4FF00] text-black border-[#D4FF00]' : 'bg-[#2D0000] text-[#A9B3A1] border-[#757D6F]/30'}"
            >
              👈 Host (Kiri)
            </button>
            <button
              type="button"
              onclick={() => clipStore.panOffset = 0.5}
              class="px-2 py-0.5 rounded text-[10px] font-bold border transition {Math.abs(clipStore.panOffset - 0.5) < 0.05 ? 'bg-[#D4FF00] text-black border-[#D4FF00]' : 'bg-[#2D0000] text-[#A9B3A1] border-[#757D6F]/30'}"
            >
              🎯 Tengah
            </button>
            <button
              type="button"
              onclick={() => clipStore.panOffset = 0.85}
              class="px-2 py-0.5 rounded text-[10px] font-bold border transition {Math.abs(clipStore.panOffset - 0.85) < 0.05 ? 'bg-[#D4FF00] text-black border-[#D4FF00]' : 'bg-[#2D0000] text-[#A9B3A1] border-[#757D6F]/30'}"
            >
              👉 Guest (Kanan)
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[9px] text-[#757D6F]">L</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={clipStore.panOffset}
            class="accent-[#D4FF00] h-1.5 w-full bg-[#2D0000] rounded-lg cursor-pointer"
          />
          <span class="text-[9px] text-[#757D6F]">R</span>
          <span class="text-[10px] text-[#D4FF00] font-bold w-9 text-right font-mono">
            {Math.round(clipStore.panOffset * 100)}%
          </span>
        </div>
      </div>
    {/if}

    <!-- Aspect Ratio Pills -->
    <div class="grid grid-cols-4 gap-1.5 pt-1">
      {#each aspectRatios as fmt}
        <button
          type="button"
          onclick={() => clipStore.aspectRatio = fmt.id}
          class="py-1.5 px-2 rounded-lg text-center font-mono text-[11px] transition border {clipStore.aspectRatio === fmt.id ? 'bg-[#6D0808] border-[#D4FF00] text-[#EEEAD7] font-bold' : 'bg-[#150000] border-[#757D6F]/20 text-[#A9B3A1] hover:text-[#EEEAD7]'}"
        >
          {fmt.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- SECTION 2: JUDUL HOOK ATAS (SOCL Visuals Style) -->
  <div class="p-4 bg-[#200202]/80 border border-[#757D6F]/30 rounded-2xl backdrop-blur-md shadow-lg flex flex-col gap-3 font-mono">
    <div class="flex items-center justify-between pb-2 border-b border-[#757D6F]/20 text-[11px]">
      <span class="font-bold text-[#EEEAD7] flex items-center gap-1.5 uppercase">
        <Type size={14} class="text-[#D4FF00]" />
        <span>2. JUDUL HOOK ATAS</span>
      </span>
      <button
        type="button"
        onclick={() => clipStore.showHookTitle = !clipStore.showHookTitle}
        class="px-2 py-0.5 rounded text-[10px] font-bold transition {clipStore.showHookTitle ? 'bg-[#D4FF00] text-black' : 'bg-[#150000] text-[#757D6F] border border-[#757D6F]/30'}"
      >
        {clipStore.showHookTitle ? 'AKTIF' : 'NONAKTIF'}
      </button>
    </div>

    {#if clipStore.showHookTitle}
      <div class="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Tulis hook pembuka video di sini..."
          bind:value={clipStore.hookTitleText}
          class="w-full px-3 py-2 bg-[#150000] border border-[#757D6F]/40 rounded-xl text-xs font-bold text-[#EEEAD7] placeholder-[#757D6F] focus:border-[#D4FF00] focus:outline-none"
        />

        <div class="grid grid-cols-4 gap-1.5">
          {#each hookThemes as theme}
            <button
              type="button"
              onclick={() => clipStore.hookTitleTheme = theme.id}
              class="py-1 px-1.5 rounded-lg text-[10px] font-bold border transition text-center truncate {clipStore.hookTitleTheme === theme.id ? 'ring-2 ring-[#D4FF00] scale-[1.02]' : 'opacity-80 hover:opacity-100'} {theme.class}"
            >
              {theme.label}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- SECTION 3: SUBTITLE & CAPTION MOOD -->
  <div class="p-4 bg-[#200202]/80 border border-[#757D6F]/30 rounded-2xl backdrop-blur-md shadow-lg flex flex-col gap-3 font-mono">
    <div class="flex items-center justify-between pb-2 border-b border-[#757D6F]/20 text-[11px]">
      <span class="font-bold text-[#EEEAD7] flex items-center gap-1.5 uppercase">
        <Sparkles size={14} class="text-[#D4FF00]" />
        <span>3. STYLE & ANIMASI SUBTITLE</span>
      </span>
      <button
        type="button"
        onclick={() => clipStore.burnSubtitles = !clipStore.burnSubtitles}
        class="px-2 py-0.5 rounded text-[10px] font-bold transition {clipStore.burnSubtitles ? 'bg-[#D4FF00] text-black' : 'bg-[#150000] text-[#757D6F] border border-[#757D6F]/30'}"
      >
        {clipStore.burnSubtitles ? 'ON' : 'OFF'}
      </button>
    </div>

    {#if clipStore.burnSubtitles}
      <!-- Highlight Style: Box Highlight vs Glow Text -->
      <div class="flex flex-col gap-1.5">
        <span class="text-[10px] text-[#A9B3A1] uppercase">GAYA HIGHLIGHT KATA</span>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onclick={() => clipStore.captionHighlightStyle = 'box'}
            class="py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center {clipStore.captionHighlightStyle === 'box' ? 'bg-[#D4FF00] text-black border-[#D4FF00] shadow' : 'bg-[#150000] text-[#A9B3A1] border-[#757D6F]/20'}"
          >
            🟨 Box Highlight
          </button>
          <button
            type="button"
            onclick={() => clipStore.captionHighlightStyle = 'glow'}
            class="py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center {clipStore.captionHighlightStyle === 'glow' ? 'bg-[#D4FF00] text-black border-[#D4FF00] shadow' : 'bg-[#150000] text-[#A9B3A1] border-[#757D6F]/20'}"
          >
            ✨ Glow Text
          </button>
          <button
            type="button"
            onclick={() => clipStore.captionHighlightStyle = 'classic'}
            class="py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center {clipStore.captionHighlightStyle === 'classic' ? 'bg-[#D4FF00] text-black border-[#D4FF00] shadow' : 'bg-[#150000] text-[#A9B3A1] border-[#757D6F]/20'}"
          >
            🔲 Clean Outline
          </button>
        </div>
      </div>

      <!-- Palette Color Swatches -->
      <div class="flex flex-col gap-1.5">
        <span class="text-[10px] text-[#A9B3A1] uppercase">WARNA HIGHLIGHT</span>
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          {#each colorPalette as item}
            <button
              type="button"
              onclick={() => clipStore.subtitleColor = item.color}
              title={item.label}
              class="w-7 h-7 rounded-full flex-shrink-0 transition-all border-2 relative flex items-center justify-center {clipStore.subtitleColor === item.color ? 'scale-110 border-white ring-2 ring-[#D4FF00]' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}"
              style="background-color: {item.color};"
            >
              {#if clipStore.subtitleColor === item.color}
                <div class="w-1.5 h-1.5 rounded-full bg-black"></div>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Animation Presets -->
      <div class="flex flex-col gap-1.5">
        <span class="text-[10px] text-[#A9B3A1] uppercase">ANIMASI KATA (KINETIC)</span>
        <div class="grid grid-cols-4 gap-1.5">
          {#each animationList as anim}
            <button
              type="button"
              onclick={() => clipStore.subtitleAnimation = anim}
              class="py-1 px-2 rounded-lg text-[11px] transition text-center {clipStore.subtitleAnimation === anim ? 'bg-[#D4FF00] text-black font-bold shadow' : 'bg-[#150000] text-[#A9B3A1] hover:text-[#EEEAD7] border border-[#757D6F]/20'}"
            >
              {anim}
            </button>
          {/each}
        </div>
      </div>

      <!-- Words per chunk + Sliders -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-[#150000] rounded-xl border border-[#757D6F]/20 text-[10px]">
        <div class="flex flex-col gap-1">
          <div class="flex justify-between items-center text-[#A9B3A1]">
            <span>KATA PER BARIS</span>
            <span class="font-bold text-[#D4FF00]">{clipStore.wordsPerChunk} Kata</span>
          </div>
          <div class="grid grid-cols-4 gap-1 mt-0.5">
            {#each [1, 2, 3, 4] as num}
              <button
                type="button"
                onclick={() => clipStore.wordsPerChunk = num}
                class="py-0.5 rounded text-center font-bold {clipStore.wordsPerChunk === num ? 'bg-[#D4FF00] text-black' : 'bg-[#200202] text-[#A9B3A1]'}"
              >
                {num}W
              </button>
            {/each}
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <div class="flex justify-between items-center text-[#A9B3A1]">
            <span>UKURAN FONT & POSISI</span>
            <span class="text-[#EEEAD7] font-bold">{clipStore.subtitleFontSize}px • {clipStore.subtitlePosY}%</span>
          </div>
          <input
            type="range"
            min="18"
            max="38"
            step="1"
            bind:value={clipStore.subtitleFontSize}
            class="accent-[#D4FF00] h-1.5 bg-[#200202] rounded-lg cursor-pointer"
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- BIG ACTION CTA: RENDER & DOWNLOAD -->
  <button
    type="button"
    disabled={clipStore.isRendering}
    onclick={onRender}
    class="w-full py-3.5 px-4 rounded-xl font-bold font-mono text-sm tracking-wide flex items-center justify-center gap-2 transition shadow-xl bg-[#D4FF00] hover:bg-[#c7f000] text-black active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Download size={17} class="text-black" />
    <span>⬇ Render & Download Klip ({clipStore.aspectRatio} • {clipStore.layoutMode.toUpperCase()})</span>
  </button>
</div>
