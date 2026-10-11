<script lang="ts">
  import { clipStore, type SubtitleAnimation } from '../../stores/clip.svelte';
  import { Sparkles, Crop, Film, Type, Download, PackageCheck, Loader2 } from 'lucide-svelte';

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
    { label: 'Electric Lime', color: '#fcf1d0' },
    { label: 'Pure White', color: '#FFFFFF' },
    { label: 'Cyber Gold', color: '#FFE600' },
    { label: 'Sunset Orange', color: '#FF6B00' },
    { label: 'Hot Pink', color: '#FF2A85' },
    { label: 'Ice Cyan', color: '#fcf1d0' },
    { label: 'Emerald Green', color: '#10B981' }
  ];

  const animationList: SubtitleAnimation[] = [
    'POP', 'FADE', 'RISE', 'DROP', 'ZOOM', 'TYPE', 'OFF'
  ];

  const hookThemes = [
    { id: 'yellow' as const, label: 'Kuning Box', class: 'bg-[#FFE600] text-black border-black/20' },
    { id: 'red' as const, label: 'Merah Bold', class: 'bg-[#FF1E1E] text-white border-white/20' },
    { id: 'neon' as const, label: 'Neon Lime', class: 'bg-[#fcf1d0] text-black border-black/20' },
    { id: 'dark' as const, label: 'Dark Minimal', class: 'bg-black/90 text-white border-white/30' }
  ];

  const transcriptWords = $derived.by(() => {
    if (!activeTranscriptText) return [];
    return activeTranscriptText.trim().split(/\s+/).filter(Boolean).slice(0, 80);
  });
</script>

<div class="flex flex-col gap-4 text-[#fcf1d0]">
  <!-- SECTION 1: PODCAST FRAMING & TATA LETAK -->
  <div class="p-4 bg-[#0d1c42]/80 border border-[#22396f]/30 rounded-2xl backdrop-blur-md shadow-lg flex flex-col gap-3">
    <div class="flex items-center justify-between pb-2 border-b border-[#22396f]/20 text-[11px] font-mono">
      <span class="font-bold text-[#fcf1d0] flex items-center gap-1.5 uppercase">
        <Film size={14} class="text-[#fcf1d0]" />
        <span>1. FRAMING & FORMAT VIDEO</span>
      </span>
      <span class="text-[#fcf1d0] font-bold">{clipStore.aspectRatio} • {clipStore.layoutMode.toUpperCase()}</span>
    </div>

    <!-- 3 Quick Layout Cards -->
    <div class="grid grid-cols-3 gap-2">
      <button
        type="button"
        onclick={() => clipStore.layoutMode = 'single'}
        class="p-2.5 rounded-xl text-left font-mono transition-all border flex flex-col justify-between {clipStore.layoutMode === 'single' ? 'bg-[#22396f] border-[#fcf1d0] text-[#fcf1d0] shadow-lg' : 'bg-[#010736] border-[#22396f]/25 text-[#8fa2cb] hover:text-[#fcf1d0]'}"
      >
        <span class="text-xs font-bold">Single Camera</span>
        <span class="text-[9px] opacity-75 mt-0.5">1 Kamera</span>
      </button>

      <button
        type="button"
        onclick={() => clipStore.layoutMode = 'split'}
        class="p-2.5 rounded-xl text-left font-mono transition-all border flex flex-col justify-between {clipStore.layoutMode === 'split' ? 'bg-[#22396f] border-[#fcf1d0] text-[#fcf1d0] shadow-lg' : 'bg-[#010736] border-[#22396f]/25 text-[#8fa2cb] hover:text-[#fcf1d0]'}"
        title="Podcast Split 50/50"
      >
        <span class="text-xs font-bold">Split 50/50</span>
        <span class="text-[9px] opacity-75 mt-0.5">Host & Guest</span>
      </button>

      <button
        type="button"
        onclick={() => clipStore.layoutMode = 'fit-blur'}
        class="p-2.5 rounded-xl text-left font-mono transition-all border flex flex-col justify-between {clipStore.layoutMode === 'fit-blur' ? 'bg-[#22396f] border-[#fcf1d0] text-[#fcf1d0] shadow-lg' : 'bg-[#010736] border-[#22396f]/25 text-[#8fa2cb] hover:text-[#fcf1d0]'}"
        title="Full video dengan blur background"
      >
        <span class="text-xs font-bold">Fit Blur</span>
        <span class="text-[9px] opacity-75 mt-0.5">Latar Blur</span>
      </button>
    </div>

    <!-- If Single Mode: Presets Host/Center/Guest & Pan Slider -->
    {#if clipStore.layoutMode === 'single'}
      <div class="flex flex-col gap-2 p-2.5 bg-[#010736] rounded-xl border border-[#22396f]/20 font-mono text-[11px]">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="text-[#8fa2cb]">FOKUS KAMERA:</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick={() => clipStore.panOffset = 0.15}
              class="px-2 py-0.5 rounded text-[10px] font-bold border transition {Math.abs(clipStore.panOffset - 0.15) < 0.05 ? 'bg-[#fcf1d0] text-black border-[#fcf1d0]' : 'bg-[#0d1c42] text-[#8fa2cb] border-[#22396f]/30'}"
            >
              Host (Kiri)
            </button>
            <button
              type="button"
              onclick={() => clipStore.panOffset = 0.5}
              class="px-2 py-0.5 rounded text-[10px] font-bold border transition {Math.abs(clipStore.panOffset - 0.5) < 0.05 ? 'bg-[#fcf1d0] text-black border-[#fcf1d0]' : 'bg-[#0d1c42] text-[#8fa2cb] border-[#22396f]/30'}"
            >
              Tengah
            </button>
            <button
              type="button"
              onclick={() => clipStore.panOffset = 0.85}
              class="px-2 py-0.5 rounded text-[10px] font-bold border transition {Math.abs(clipStore.panOffset - 0.85) < 0.05 ? 'bg-[#fcf1d0] text-black border-[#fcf1d0]' : 'bg-[#0d1c42] text-[#8fa2cb] border-[#22396f]/30'}"
            >
              Guest (Kanan)
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[9px] text-[#22396f]">L</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={clipStore.panOffset}
            class="accent-[#fcf1d0] h-1.5 w-full bg-[#0d1c42] rounded-lg cursor-pointer"
          />
          <span class="text-[9px] text-[#22396f]">R</span>
          <span class="text-[10px] text-[#fcf1d0] font-bold w-9 text-right font-mono">
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
          class="py-1.5 px-2 rounded-lg text-center font-mono text-[11px] transition border {clipStore.aspectRatio === fmt.id ? 'bg-[#22396f] border-[#fcf1d0] text-[#fcf1d0] font-bold' : 'bg-[#010736] border-[#22396f]/20 text-[#8fa2cb] hover:text-[#fcf1d0]'}"
        >
          {fmt.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- SECTION 2: JUDUL HOOK ATAS & POSISI (Restored Positioning Controls) -->
  <div class="p-4 bg-[#0d1c42]/80 border border-[#22396f]/30 rounded-2xl backdrop-blur-md shadow-lg flex flex-col gap-3 font-mono">
    <div class="flex items-center justify-between pb-2 border-b border-[#22396f]/20 text-[11px]">
      <span class="font-bold text-[#fcf1d0] flex items-center gap-1.5 uppercase">
        <Type size={14} class="text-[#fcf1d0]" />
        <span>2. JUDUL HOOK ATAS</span>
      </span>
      <button
        type="button"
        onclick={() => clipStore.showHookTitle = !clipStore.showHookTitle}
        class="px-2 py-0.5 rounded text-[10px] font-bold transition {clipStore.showHookTitle ? 'bg-[#fcf1d0] text-black' : 'bg-[#010736] text-[#22396f] border border-[#22396f]/30'}"
      >
        {clipStore.showHookTitle ? 'AKTIF' : 'NONAKTIF'}
      </button>
    </div>

    {#if clipStore.showHookTitle}
      <div class="flex flex-col gap-2.5">
        <input
          type="text"
          placeholder="Tulis hook pembuka video di sini..."
          bind:value={clipStore.hookTitleText}
          class="w-full px-3 py-2 bg-[#010736] border border-[#22396f]/40 rounded-xl text-xs font-bold text-[#fcf1d0] placeholder-[#22396f] focus:border-[#fcf1d0] focus:outline-none"
        />

        <div class="grid grid-cols-4 gap-1.5">
          {#each hookThemes as theme}
            <button
              type="button"
              onclick={() => clipStore.hookTitleTheme = theme.id}
              class="py-1 px-1.5 rounded-lg text-[10px] font-bold border transition text-center truncate {clipStore.hookTitleTheme === theme.id ? 'ring-2 ring-[#fcf1d0] scale-[1.02]' : 'opacity-80 hover:opacity-100'} {theme.class}"
            >
              {theme.label}
            </button>
          {/each}
        </div>

        <div class="flex flex-col gap-1 p-2.5 bg-[#010736] rounded-xl border border-[#22396f]/20 text-[10px]">
          <div class="flex justify-between items-center text-[#8fa2cb]">
            <span>POSISI JUDUL (ATAS ↔ TENGAH)</span>
            <span class="text-[#fcf1d0] font-bold">{clipStore.hookTitlePosY}%</span>
          </div>
          <div class="flex items-center gap-2">
            <span>Atas</span>
            <input
              type="range"
              min="2"
              max="40"
              step="1"
              bind:value={clipStore.hookTitlePosY}
              class="accent-[#fcf1d0] h-1.5 w-full cursor-pointer"
            />
            <span>Bawah</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- SECTION 3: SUBTITLE & CAPTION MOOD (Style, Position & Freshness Balance Controls) -->
  <div class="p-4 bg-[#0d1c42]/80 border border-[#22396f]/30 rounded-2xl backdrop-blur-md shadow-lg flex flex-col gap-3 font-mono">
    <div class="flex items-center justify-between pb-2 border-b border-[#22396f]/20 text-[11px]">
      <span class="font-bold text-[#fcf1d0] flex items-center gap-1.5 uppercase">
        <Sparkles size={14} class="text-[#fcf1d0]" />
        <span>3. STYLE & ANIMASI SUBTITLE</span>
      </span>
      <button
        type="button"
        onclick={() => clipStore.burnSubtitles = !clipStore.burnSubtitles}
        class="px-2 py-0.5 rounded text-[10px] font-bold transition {clipStore.burnSubtitles ? 'bg-[#fcf1d0] text-black' : 'bg-[#010736] text-[#22396f] border border-[#22396f]/30'}"
      >
        {clipStore.burnSubtitles ? 'ON' : 'OFF'}
      </button>
    </div>

    {#if clipStore.burnSubtitles}
      <!-- Highlight Style: Box Highlight vs Glow Text -->
      <div class="flex flex-col gap-1.5">
        <span class="text-[10px] text-[#8fa2cb] uppercase">GAYA HIGHLIGHT KATA</span>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onclick={() => clipStore.captionHighlightStyle = 'box'}
            class="py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center {clipStore.captionHighlightStyle === 'box' ? 'bg-[#fcf1d0] text-black border-[#fcf1d0] shadow' : 'bg-[#010736] text-[#8fa2cb] border-[#22396f]/20'}"
          >
            Box Highlight
          </button>
          <button
            type="button"
            onclick={() => clipStore.captionHighlightStyle = 'glow'}
            class="py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center {clipStore.captionHighlightStyle === 'glow' ? 'bg-[#fcf1d0] text-black border-[#fcf1d0] shadow' : 'bg-[#010736] text-[#8fa2cb] border-[#22396f]/20'}"
          >
            Glow Text
          </button>
          <button
            type="button"
            onclick={() => clipStore.captionHighlightStyle = 'classic'}
            class="py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center {clipStore.captionHighlightStyle === 'classic' ? 'bg-[#fcf1d0] text-black border-[#fcf1d0] shadow' : 'bg-[#010736] text-[#8fa2cb] border-[#22396f]/20'}"
          >
            Clean Outline
          </button>
        </div>
      </div>

      <!-- Palette Color Swatches -->
      <div class="flex flex-col gap-1.5">
        <span class="text-[10px] text-[#8fa2cb] uppercase">WARNA HIGHLIGHT</span>
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          {#each colorPalette as item}
            <button
              type="button"
              onclick={() => clipStore.subtitleColor = item.color}
              title={item.label}
              class="w-7 h-7 rounded-full flex-shrink-0 transition-all border-2 relative flex items-center justify-center {clipStore.subtitleColor === item.color ? 'scale-110 border-white ring-2 ring-[#fcf1d0]' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}"
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
        <span class="text-[10px] text-[#8fa2cb] uppercase">ANIMASI KATA (KINETIC)</span>
        <div class="grid grid-cols-4 gap-1.5">
          {#each animationList as anim}
            <button
              type="button"
              onclick={() => clipStore.subtitleAnimation = anim}
              class="py-1 px-2 rounded-lg text-[11px] transition text-center {clipStore.subtitleAnimation === anim ? 'bg-[#fcf1d0] text-black font-bold shadow' : 'bg-[#010736] text-[#8fa2cb] hover:text-[#fcf1d0] border border-[#22396f]/20'}"
            >
              {anim}
            </button>
          {/each}
        </div>
      </div>

      <!-- Words per chunk + Sliders -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-[#010736] rounded-xl border border-[#22396f]/20 text-[10px]">
        <div class="flex flex-col gap-1">
          <div class="flex justify-between items-center text-[#8fa2cb]">
            <span>KATA PER BARIS</span>
            <span class="font-bold text-[#fcf1d0]">{clipStore.wordsPerChunk} Kata</span>
          </div>
          <div class="grid grid-cols-4 gap-1 mt-0.5">
            {#each [1, 2, 3, 4] as num}
              <button
                type="button"
                onclick={() => clipStore.wordsPerChunk = num}
                class="py-0.5 rounded text-center font-bold {clipStore.wordsPerChunk === num ? 'bg-[#fcf1d0] text-black' : 'bg-[#0d1c42] text-[#8fa2cb]'}"
              >
                {num}W
              </button>
            {/each}
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <div class="flex justify-between items-center text-[#8fa2cb]">
            <span>UKURAN FONT SUBTITLE</span>
            <span class="text-[#fcf1d0] font-bold">{clipStore.subtitleFontSize}px</span>
          </div>
          <input
            type="range"
            min="18"
            max="38"
            step="1"
            bind:value={clipStore.subtitleFontSize}
            class="accent-[#fcf1d0] h-1.5 bg-[#0d1c42] rounded-lg cursor-pointer"
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- SECTION 4: PER-WORD STYLING EDITOR (Competitor-Style Scrollable Transcript) -->
  {#if clipStore.burnSubtitles && transcriptWords.length > 0}
    <div class="p-4 bg-[#0d1c42]/80 border border-[#22396f]/30 rounded-2xl backdrop-blur-md shadow-lg flex flex-col gap-2.5 font-mono">
      <div class="flex items-center justify-between pb-2 border-b border-[#22396f]/20 text-[11px]">
        <span class="font-bold text-[#fcf1d0] flex items-center gap-1.5 uppercase">
          <Crop size={14} class="text-[#fcf1d0]" />
          <span>4. EDITOR KATA (KLIK UNTUK HIGHLIGHT)</span>
        </span>
        <span class="text-[#fcf1d0] font-bold">{clipStore.highlightedWords.length} KATA</span>
      </div>

      <p class="text-[10px] text-[#8fa2cb]">Klik kata mana saja untuk menonjolkannya di video hasil render.</p>

      <!-- Scrollable word list (max 200px, like the competitor) -->
      <div class="flex flex-wrap gap-1.5 p-2.5 bg-[#010736] border border-[#22396f]/20 rounded-xl max-h-[200px] overflow-y-auto">
        {#each transcriptWords as word}
          {@const clean = word.toLowerCase().replace(/[^a-z0-9]/gi, '')}
          {@const isActive = clipStore.highlightedWords.includes(clean)}
          <button
            type="button"
            onclick={() => clipStore.toggleWordHighlight(word)}
            class="px-2 py-0.5 rounded-lg text-[11px] font-bold border transition {isActive ? 'bg-[#fcf1d0] text-black border-[#fcf1d0] shadow-md scale-105' : 'bg-[#0d1c42] text-[#8fa2cb] border-[#22396f]/25 hover:text-[#fcf1d0]'}"
          >
            {word}
          </button>
        {/each}
      </div>

      {#if clipStore.highlightedWords.length > 0}
        <button
          type="button"
          onclick={() => clipStore.highlightedWords = []}
          class="text-[10px] text-[#22396f] hover:text-[#fcf1d0] underline self-start"
        >
          Reset semua highlight
        </button>
      {/if}
    </div>
  {/if}

  <!-- SECTION 5: FINE-TUNING & SYNC (Restored Position + Freshness Balance) -->
  <div class="p-4 bg-[#0d1c42]/80 border border-[#22396f]/30 rounded-2xl backdrop-blur-md shadow-lg flex flex-col gap-3 font-mono">
    <div class="flex items-center justify-between pb-2 border-b border-[#22396f]/20 text-[11px]">
      <span class="font-bold text-[#fcf1d0] flex items-center gap-1.5 uppercase">
        <Sparkles size={14} class="text-[#fcf1d0]" />
        <span>5. POSISI & SINKRONISASI</span>
      </span>
      <span class="text-[#fcf1d0] font-bold">{clipStore.subtitleSyncOffset > 0 ? '+' : ''}{clipStore.subtitleSyncOffset.toFixed(2)}s</span>
    </div>

    <!-- Subtitle Y Position (Restored) -->
    <div class="flex flex-col gap-1 p-2.5 bg-[#010736] rounded-xl border border-[#22396f]/20 text-[10px]">
      <div class="flex justify-between items-center text-[#8fa2cb]">
        <span>POSISI SUBTITLE (ATAS ↔ BAWAH)</span>
        <span class="text-[#fcf1d0] font-bold">{clipStore.subtitlePosY}%</span>
      </div>
      <div class="flex items-center gap-2">
        <span>Atas</span>
        <input
          type="range"
          min="50"
          max="90"
          step="1"
          bind:value={clipStore.subtitlePosY}
          class="accent-[#fcf1d0] h-1.5 w-full cursor-pointer"
        />
        <span>Bawah</span>
      </div>
    </div>

    <!-- Subtitle Sync Offset Nudge (Competitor-Style) -->
    <div class="flex flex-col gap-1.5 p-2.5 bg-[#010736] rounded-xl border border-[#22396f]/20 text-[10px]">
      <div class="flex justify-between items-center text-[#8fa2cb]">
        <span>SINKRONISASI SUBTITLE (GESER WAKTU)</span>
        <span class="text-[#fcf1d0] font-bold">
          {clipStore.subtitleSyncOffset > 0 ? '+' : ''}{clipStore.subtitleSyncOffset.toFixed(2)}s
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          onclick={() => clipStore.nudgeSync(-0.1)}
          class="flex-1 py-1.5 rounded-lg bg-[#0d1c42] border border-[#22396f]/30 text-[#fcf1d0] font-bold hover:border-[#fcf1d0] transition"
        >
          -0.1s
        </button>
        <button
          type="button"
          onclick={() => clipStore.subtitleSyncOffset = 0}
          class="flex-1 py-1.5 rounded-lg bg-[#010736] border border-[#22396f]/20 text-[#22396f] font-bold hover:text-[#fcf1d0] transition"
        >
          Reset
        </button>
        <button
          type="button"
          onclick={() => clipStore.nudgeSync(0.1)}
          class="flex-1 py-1.5 rounded-lg bg-[#0d1c42] border border-[#22396f]/30 text-[#fcf1d0] font-bold hover:border-[#fcf1d0] transition"
        >
          +0.1s
        </button>
      </div>
    </div>

    <!-- Hide Subtitles Toggle (Restored) -->
    <div class="flex items-center justify-between p-2.5 bg-[#010736] rounded-xl border border-[#22396f]/20 text-[10px]">
      <span class="text-[#8fa2cb]">SEMBUNYIKAN SUBTITLE DI RENDER</span>
      <button
        type="button"
        onclick={() => clipStore.burnSubtitles = !clipStore.burnSubtitles}
        class="px-3 py-1 rounded-lg font-bold transition {clipStore.burnSubtitles ? 'bg-[#fcf1d0] text-black' : 'bg-[#0d1c42] text-[#22396f] border border-[#22396f]/30'}"
      >
        {clipStore.burnSubtitles ? 'SUBTITLE ON' : 'SUBTITLE OFF'}
      </button>
    </div>
  </div>

  <!-- EXPORT SETTINGS: SINGLE VS PAKET BORONGAN ZIP (Direct Mode Trigger) -->
  <div class="p-3 bg-[#010736] border border-[#22396f]/50 rounded-2xl flex flex-col gap-2 font-mono">
    <div class="flex items-center justify-between text-[11px]">
      <span class="text-[#8fa2cb] font-bold uppercase">MODE EXPORT HASIL:</span>
      <span class="font-bold text-[#fcf1d0]">
        {clipStore.exportMode === 'single' ? `SINGLE KLIP (#${clipStore.activeClipRank})` : `PAKET ZIP (${clipStore.selectedClipIdsForBulk.length} KLIP)`}
      </span>
    </div>

    <div class="grid grid-cols-2 gap-1.5 p-1 bg-[#0d1c42] rounded-xl border border-[#22396f]/40 text-xs">
      <button
        type="button"
        onclick={() => clipStore.exportMode = 'single'}
        class="py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 {clipStore.exportMode === 'single' ? 'bg-[#fcf1d0] text-[#010736] shadow-md' : 'text-[#8fa2cb] hover:text-[#fcf1d0]'}"
      >
        <span>🎯 Single Klip</span>
      </button>

      <button
        type="button"
        onclick={() => {
          clipStore.exportMode = 'bulk';
          if (clipStore.selectedClipIdsForBulk.length === 0) {
            clipStore.selectAllClips();
          }
        }}
        class="py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 {clipStore.exportMode === 'bulk' ? 'bg-[#fcf1d0] text-[#010736] shadow-md' : 'text-[#8fa2cb] hover:text-[#fcf1d0]'}"
      >
        <span>📦 Paket ZIP</span>
      </button>
    </div>

    {#if clipStore.exportMode === 'bulk'}
      <div class="flex items-center justify-between text-[10px] text-[#8fa2cb] pt-0.5">
        <span>{clipStore.selectedClipIdsForBulk.length} klip dicentang dari total {clipStore.analysisResult?.topClips.length || 0}</span>
        <button
          type="button"
          onclick={() => {
            if (clipStore.selectedClipIdsForBulk.length === (clipStore.analysisResult?.topClips.length || 0)) {
              clipStore.deselectAllClips();
            } else {
              clipStore.selectAllClips();
            }
          }}
          class="text-[#fcf1d0] hover:underline font-bold"
        >
          {clipStore.selectedClipIdsForBulk.length === (clipStore.analysisResult?.topClips.length || 0) ? 'Batal Semua' : 'Pilih Semua'}
        </button>
      </div>
    {/if}
  </div>

  <!-- BIG ACTION CTA: RENDER & DOWNLOAD -->
  <button
    type="button"
    disabled={clipStore.isRendering || (clipStore.exportMode === 'bulk' && clipStore.selectedClipIdsForBulk.length === 0)}
    onclick={onRender}
    class="w-full py-3.5 px-4 rounded-xl font-bold font-mono text-sm tracking-wide flex items-center justify-center gap-2 transition shadow-xl bg-[#fcf1d0] hover:bg-[#e9dfb8] text-[#010736] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed sticky bottom-3 z-30"
  >
    {#if clipStore.isRendering}
      <Loader2 size={17} class="animate-spin text-[#010736]" />
      <span>{clipStore.exportMode === 'bulk' ? 'Memproses & Mengompres ZIP...' : 'Sedang merender video...'}</span>
    {:else if clipStore.exportMode === 'bulk'}
      <PackageCheck size={17} class="text-[#010736]" />
      <span>Render & Download ZIP ({clipStore.selectedClipIdsForBulk.length} Klip)</span>
    {:else}
      <Download size={17} class="text-[#010736]" />
      <span>Render & Download Klip #{clipStore.activeClipRank} ({clipStore.aspectRatio} • {clipStore.layoutMode.toUpperCase()})</span>
    {/if}
  </button>
</div>
