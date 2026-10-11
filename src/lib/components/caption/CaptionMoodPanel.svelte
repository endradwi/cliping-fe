<script lang="ts">
  import { clipStore, type SubtitleAnimation } from '../../stores/clip.svelte';
  import { Sparkles, Crop, Film, Type, Download, PackageCheck, Loader2, ChevronDown, ChevronRight } from 'lucide-svelte';

  let {
    activeTranscriptText = '',
    onRender
  }: {
    activeTranscriptText: string;
    onRender: () => void;
  } = $props();

  let openSections = $state<Record<string, boolean>>({
    framing: true,
    hook: false,
    subtitle: true,
    words: false,
    sync: false
  });

  function toggleSection(sec: string) {
    openSections[sec] = !openSections[sec];
  }

  const aspectRatios = [
    { id: '9:16' as const, label: '9:16', desc: 'Shorts/TikTok/Reels' },
    { id: '4:5' as const, label: '4:5', desc: 'IG Portrait Feed' },
    { id: '1:1' as const, label: '1:1', desc: 'Square Post' },
    { id: '16:9' as const, label: '16:9', desc: 'YouTube Landscape' }
  ];

  const colorPalette = [
    { label: 'Cyber Gold', color: '#FFE600' },
    { label: 'Warm Cream', color: '#FCF1D0' },
    { label: 'Electric Cyan', color: '#00E5FF' },
    { label: 'Sunset Orange', color: '#FF6B00' },
    { label: 'Hot Pink', color: '#FF2A85' },
    { label: 'Emerald Green', color: '#10B981' },
    { label: 'Pure White', color: '#FFFFFF' }
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

<div class="h-full flex flex-col justify-between overflow-hidden text-[#fcf1d0] font-mono">
  <!-- SCROLLABLE ACCORDION LIST (Independent Scroll, Zero Collision with Button) -->
  <div class="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar pb-2">
    <!-- ACCORDION 1: FRAMING & FORMAT -->
    <div class="bg-[#0d1c42]/90 border border-[#22396f]/40 rounded-xl overflow-hidden shadow-md">
      <button
        type="button"
        onclick={() => toggleSection('framing')}
        class="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#22396f]/20 transition"
      >
        <div class="flex items-center gap-2">
          {#if openSections.framing}
            <ChevronDown size={14} class="text-[#fcf1d0]" />
          {:else}
            <ChevronRight size={14} class="text-[#8fa2cb]" />
          {/if}
          <Film size={13} class="text-[#fcf1d0]" />
          <span class="text-xs font-bold uppercase">1. Framing & Format</span>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded bg-[#010736] border border-[#22396f] text-[#fcf1d0] font-bold">
          {clipStore.aspectRatio} • {clipStore.layoutMode.toUpperCase()}
        </span>
      </button>

      {#if openSections.framing}
        <div class="p-3 border-t border-[#22396f]/30 flex flex-col gap-2.5 bg-[#010736]/30">
          <!-- 2 Framing Options (Single & Fit-Blur) -->
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => clipStore.layoutMode = 'single'}
              class="p-2.5 rounded-lg text-left transition-all border flex flex-col justify-between {clipStore.layoutMode === 'single' ? 'bg-[#22396f] border-[#fcf1d0] text-[#fcf1d0] shadow' : 'bg-[#010736] border-[#22396f]/30 text-[#8fa2cb] hover:text-[#fcf1d0]'}"
            >
              <span class="text-xs font-bold">📱 Single Camera</span>
              <span class="text-[9px] opacity-75">Fokus wajah pembicara (Pan)</span>
            </button>

            <button
              type="button"
              onclick={() => clipStore.layoutMode = 'fit-blur'}
              class="p-2.5 rounded-lg text-left transition-all border flex flex-col justify-between {clipStore.layoutMode === 'fit-blur' ? 'bg-[#22396f] border-[#fcf1d0] text-[#fcf1d0] shadow' : 'bg-[#010736] border-[#22396f]/30 text-[#8fa2cb] hover:text-[#fcf1d0]'}"
              title="Full video dengan blur background"
            >
              <span class="text-xs font-bold">🌫️ Fit Blur</span>
              <span class="text-[9px] opacity-75">Video utuh latar blur (Podcast)</span>
            </button>
          </div>

          <!-- If Single Mode: Presets Host/Center/Guest & Pan Slider -->
          {#if clipStore.layoutMode === 'single'}
            <div class="flex flex-col gap-2 p-2 bg-[#010736] rounded-lg border border-[#22396f]/30 text-[10px]">
              <div class="flex items-center justify-between flex-wrap gap-1">
                <span class="text-[#8fa2cb]">FOKUS KAMERA:</span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    onclick={() => clipStore.panOffset = 0.15}
                    class="px-1.5 py-0.5 rounded text-[9px] font-bold border transition {Math.abs(clipStore.panOffset - 0.15) < 0.05 ? 'bg-[#fcf1d0] text-black border-[#fcf1d0]' : 'bg-[#0d1c42] text-[#8fa2cb] border-[#22396f]/30'}"
                  >
                    Host (Kiri)
                  </button>
                  <button
                    type="button"
                    onclick={() => clipStore.panOffset = 0.5}
                    class="px-1.5 py-0.5 rounded text-[9px] font-bold border transition {Math.abs(clipStore.panOffset - 0.5) < 0.05 ? 'bg-[#fcf1d0] text-black border-[#fcf1d0]' : 'bg-[#0d1c42] text-[#8fa2cb] border-[#22396f]/30'}"
                  >
                    Tengah
                  </button>
                  <button
                    type="button"
                    onclick={() => clipStore.panOffset = 0.85}
                    class="px-1.5 py-0.5 rounded text-[9px] font-bold border transition {Math.abs(clipStore.panOffset - 0.85) < 0.05 ? 'bg-[#fcf1d0] text-black border-[#fcf1d0]' : 'bg-[#0d1c42] text-[#8fa2cb] border-[#22396f]/30'}"
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
                <span class="text-[10px] text-[#fcf1d0] font-bold w-7 text-right">
                  {Math.round(clipStore.panOffset * 100)}%
                </span>
              </div>
            </div>
          {/if}

          <!-- Aspect Ratio Pills -->
          <div class="grid grid-cols-4 gap-1">
            {#each aspectRatios as fmt}
              <button
                type="button"
                onclick={() => clipStore.aspectRatio = fmt.id}
                class="py-1 px-1.5 rounded-lg text-center text-[10px] transition border {clipStore.aspectRatio === fmt.id ? 'bg-[#22396f] border-[#fcf1d0] text-[#fcf1d0] font-bold' : 'bg-[#010736] border-[#22396f]/20 text-[#8fa2cb] hover:text-[#fcf1d0]'}"
              >
                {fmt.label}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- ACCORDION 2: JUDUL HOOK ATAS -->
    <div class="bg-[#0d1c42]/90 border border-[#22396f]/40 rounded-xl overflow-hidden shadow-md">
      <button
        type="button"
        onclick={() => toggleSection('hook')}
        class="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#22396f]/20 transition"
      >
        <div class="flex items-center gap-2">
          {#if openSections.hook}
            <ChevronDown size={14} class="text-[#fcf1d0]" />
          {:else}
            <ChevronRight size={14} class="text-[#8fa2cb]" />
          {/if}
          <Type size={13} class="text-[#fcf1d0]" />
          <span class="text-xs font-bold uppercase">2. Judul Hook Atas</span>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded bg-[#010736] border border-[#22396f] text-[#fcf1d0] font-bold">
          {clipStore.showHookTitle ? 'AKTIF' : 'OFF'}
        </span>
      </button>

      {#if openSections.hook}
        <div class="p-3 border-t border-[#22396f]/30 flex flex-col gap-2.5 bg-[#010736]/30">
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-[#8fa2cb]">STATUS JUDUL:</span>
            <button
              type="button"
              onclick={() => clipStore.showHookTitle = !clipStore.showHookTitle}
              class="px-2 py-0.5 rounded text-[10px] font-bold transition {clipStore.showHookTitle ? 'bg-[#fcf1d0] text-black' : 'bg-[#010736] text-[#22396f] border border-[#22396f]/30'}"
            >
              {clipStore.showHookTitle ? 'AKTIF' : 'NONAKTIF'}
            </button>
          </div>

          {#if clipStore.showHookTitle}
            <input
              type="text"
              placeholder="Tulis hook pembuka video..."
              bind:value={clipStore.hookTitleText}
              class="w-full px-2.5 py-1.5 bg-[#010736] border border-[#22396f]/40 rounded-lg text-xs font-bold text-[#fcf1d0] placeholder-[#22396f] focus:border-[#fcf1d0] focus:outline-none"
            />

            <div class="grid grid-cols-4 gap-1">
              {#each hookThemes as theme}
                <button
                  type="button"
                  onclick={() => clipStore.hookTitleTheme = theme.id}
                  class="py-1 px-1 rounded-md text-[9px] font-bold border transition text-center truncate {clipStore.hookTitleTheme === theme.id ? 'ring-2 ring-[#fcf1d0] scale-[1.02]' : 'opacity-80 hover:opacity-100'} {theme.class}"
                >
                  {theme.label}
                </button>
              {/each}
            </div>

            <div class="flex flex-col gap-1 p-2 bg-[#010736] rounded-lg border border-[#22396f]/20 text-[10px]">
              <div class="flex justify-between items-center text-[#8fa2cb]">
                <span>POSISI VERTIKAL</span>
                <span class="text-[#fcf1d0] font-bold">{clipStore.hookTitlePosY}%</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[9px]">Atas</span>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  bind:value={clipStore.hookTitlePosY}
                  class="accent-[#fcf1d0] h-1.5 w-full cursor-pointer"
                />
                <span class="text-[9px]">Bawah</span>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- ACCORDION 3: STYLE & ANIMASI SUBTITLE -->
    <div class="bg-[#0d1c42]/90 border border-[#22396f]/40 rounded-xl overflow-hidden shadow-md">
      <button
        type="button"
        onclick={() => toggleSection('subtitle')}
        class="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#22396f]/20 transition"
      >
        <div class="flex items-center gap-2">
          {#if openSections.subtitle}
            <ChevronDown size={14} class="text-[#fcf1d0]" />
          {:else}
            <ChevronRight size={14} class="text-[#8fa2cb]" />
          {/if}
          <Sparkles size={13} class="text-[#fcf1d0]" />
          <span class="text-xs font-bold uppercase">3. Subtitle & Animasi</span>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded bg-[#010736] border border-[#22396f] text-[#fcf1d0] font-bold">
          {clipStore.burnSubtitles ? `${clipStore.captionHighlightStyle.toUpperCase()} • ${clipStore.subtitleFontSize}px` : 'OFF'}
        </span>
      </button>

      {#if openSections.subtitle}
        <div class="p-3 border-t border-[#22396f]/30 flex flex-col gap-2.5 bg-[#010736]/30">
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-[#8fa2cb]">BURN SUBTITLE:</span>
            <button
              type="button"
              onclick={() => clipStore.burnSubtitles = !clipStore.burnSubtitles}
              class="px-2 py-0.5 rounded text-[10px] font-bold transition {clipStore.burnSubtitles ? 'bg-[#fcf1d0] text-black' : 'bg-[#010736] text-[#22396f] border border-[#22396f]/30'}"
            >
              {clipStore.burnSubtitles ? 'ON' : 'OFF'}
            </button>
          </div>

          {#if clipStore.burnSubtitles}
            <!-- Highlight Style -->
            <div class="grid grid-cols-3 gap-1">
              <button
                type="button"
                onclick={() => clipStore.captionHighlightStyle = 'box'}
                class="py-1 px-1.5 rounded-md text-[10px] font-bold border transition text-center {clipStore.captionHighlightStyle === 'box' ? 'bg-[#fcf1d0] text-black border-[#fcf1d0] shadow' : 'bg-[#010736] text-[#8fa2cb] border-[#22396f]/20'}"
              >
                Box Highlight
              </button>
              <button
                type="button"
                onclick={() => clipStore.captionHighlightStyle = 'glow'}
                class="py-1 px-1.5 rounded-md text-[10px] font-bold border transition text-center {clipStore.captionHighlightStyle === 'glow' ? 'bg-[#fcf1d0] text-black border-[#fcf1d0] shadow' : 'bg-[#010736] text-[#8fa2cb] border-[#22396f]/20'}"
              >
                Glow Text
              </button>
              <button
                type="button"
                onclick={() => clipStore.captionHighlightStyle = 'classic'}
                class="py-1 px-1.5 rounded-md text-[10px] font-bold border transition text-center {clipStore.captionHighlightStyle === 'classic' ? 'bg-[#fcf1d0] text-black border-[#fcf1d0] shadow' : 'bg-[#010736] text-[#8fa2cb] border-[#22396f]/20'}"
              >
                Outline Only
              </button>
            </div>

            <!-- Color Swatches -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {#each colorPalette as item}
                <button
                  type="button"
                  onclick={() => clipStore.subtitleColor = item.color}
                  title={item.label}
                  class="w-6 h-6 rounded-full flex-shrink-0 transition-all border-2 relative flex items-center justify-center {clipStore.subtitleColor === item.color ? 'scale-110 border-white ring-2 ring-[#fcf1d0]' : 'border-transparent opacity-80 hover:opacity-100'}"
                  style="background-color: {item.color};"
                >
                  {#if clipStore.subtitleColor === item.color}
                    <div class="w-1.5 h-1.5 rounded-full bg-black"></div>
                  {/if}
                </button>
              {/each}
            </div>

            <!-- Animation Matrix -->
            <div class="grid grid-cols-4 gap-1">
              {#each animationList as anim}
                <button
                  type="button"
                  onclick={() => clipStore.subtitleAnimation = anim}
                  class="py-1 px-1 rounded text-[10px] transition text-center {clipStore.subtitleAnimation === anim ? 'bg-[#fcf1d0] text-black font-bold shadow' : 'bg-[#010736] text-[#8fa2cb] hover:text-[#fcf1d0] border border-[#22396f]/20'}"
                >
                  {anim}
                </button>
              {/each}
            </div>

            <!-- Words Per Chunk & Size -->
            <div class="grid grid-cols-2 gap-2 p-2 bg-[#010736] rounded-lg border border-[#22396f]/20 text-[10px]">
              <div class="flex flex-col gap-1">
                <span class="text-[#8fa2cb]">KATA PER BARIS:</span>
                <div class="grid grid-cols-4 gap-1">
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
                  <span>UKURAN:</span>
                  <span class="text-[#fcf1d0] font-bold">{clipStore.subtitleFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="38"
                  step="1"
                  bind:value={clipStore.subtitleFontSize}
                  class="accent-[#fcf1d0] h-1.5 bg-[#0d1c42] rounded-lg cursor-pointer mt-1"
                />
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- ACCORDION 4: HIGHLIGHT KATA (PER-WORD) -->
    {#if clipStore.burnSubtitles && transcriptWords.length > 0}
      <div class="bg-[#0d1c42]/90 border border-[#22396f]/40 rounded-xl overflow-hidden shadow-md">
        <button
          type="button"
          onclick={() => toggleSection('words')}
          class="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#22396f]/20 transition"
        >
          <div class="flex items-center gap-2">
            {#if openSections.words}
              <ChevronDown size={14} class="text-[#fcf1d0]" />
            {:else}
              <ChevronRight size={14} class="text-[#8fa2cb]" />
            {/if}
            <Crop size={13} class="text-[#fcf1d0]" />
            <span class="text-xs font-bold uppercase">4. Highlight Kata</span>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded bg-[#010736] border border-[#22396f] text-[#fcf1d0] font-bold">
            {clipStore.highlightedWords.length} KATA
          </span>
        </button>

        {#if openSections.words}
          <div class="p-3 border-t border-[#22396f]/30 flex flex-col gap-2 bg-[#010736]/30">
            <p class="text-[9px] text-[#8fa2cb]">Klik kata untuk highlight di video:</p>
            <div class="flex flex-wrap gap-1 p-2 bg-[#010736] border border-[#22396f]/20 rounded-lg max-h-[140px] overflow-y-auto">
              {#each transcriptWords as word}
                {@const clean = word.toLowerCase().replace(/[^a-z0-9]/gi, '')}
                {@const isActive = clipStore.highlightedWords.includes(clean)}
                <button
                  type="button"
                  onclick={() => clipStore.toggleWordHighlight(word)}
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold border transition {isActive ? 'bg-[#fcf1d0] text-black border-[#fcf1d0] shadow' : 'bg-[#0d1c42] text-[#8fa2cb] border-[#22396f]/25 hover:text-[#fcf1d0]'}"
                >
                  {word}
                </button>
              {/each}
            </div>

            {#if clipStore.highlightedWords.length > 0}
              <button
                type="button"
                onclick={() => clipStore.highlightedWords = []}
                class="text-[9px] text-[#8fa2cb] hover:text-[#fcf1d0] underline self-start"
              >
                Reset highlight kata
              </button>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <!-- ACCORDION 5: POSISI & SINKRONISASI -->
    <div class="bg-[#0d1c42]/90 border border-[#22396f]/40 rounded-xl overflow-hidden shadow-md">
      <button
        type="button"
        onclick={() => toggleSection('sync')}
        class="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#22396f]/20 transition"
      >
        <div class="flex items-center gap-2">
          {#if openSections.sync}
            <ChevronDown size={14} class="text-[#fcf1d0]" />
          {:else}
            <ChevronRight size={14} class="text-[#8fa2cb]" />
          {/if}
          <Sparkles size={13} class="text-[#fcf1d0]" />
          <span class="text-xs font-bold uppercase">5. Posisi & Sync</span>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded bg-[#010736] border border-[#22396f] text-[#fcf1d0] font-bold">
          {clipStore.subtitlePosY}% • {clipStore.subtitleSyncOffset > 0 ? '+' : ''}{clipStore.subtitleSyncOffset.toFixed(1)}s
        </span>
      </button>

      {#if openSections.sync}
        <div class="p-3 border-t border-[#22396f]/30 flex flex-col gap-2.5 bg-[#010736]/30">
          <!-- Position Y Slider -->
          <div class="flex flex-col gap-1 p-2 bg-[#010736] rounded-lg border border-[#22396f]/20 text-[10px]">
            <div class="flex justify-between items-center text-[#8fa2cb]">
              <span>POSISI SUBTITLE VERTIKAL</span>
              <span class="text-[#fcf1d0] font-bold">{clipStore.subtitlePosY}%</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[9px]">Atas</span>
              <input
                type="range"
                min="50"
                max="90"
                step="1"
                bind:value={clipStore.subtitlePosY}
                class="accent-[#fcf1d0] h-1.5 w-full cursor-pointer"
              />
              <span class="text-[9px]">Bawah</span>
            </div>
          </div>

          <!-- Nudge Timing Offset -->
          <div class="flex flex-col gap-1 p-2 bg-[#010736] rounded-lg border border-[#22396f]/20 text-[10px]">
            <div class="flex justify-between items-center text-[#8fa2cb]">
              <span>SINKRONISASI AUDIO / TEKS</span>
              <span class="text-[#fcf1d0] font-bold">
                {clipStore.subtitleSyncOffset > 0 ? '+' : ''}{clipStore.subtitleSyncOffset.toFixed(2)}s
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button
                type="button"
                onclick={() => clipStore.nudgeSync(-0.1)}
                class="flex-1 py-1 rounded bg-[#0d1c42] border border-[#22396f]/30 text-[#fcf1d0] font-bold hover:border-[#fcf1d0] transition text-[10px]"
              >
                -0.1s
              </button>
              <button
                type="button"
                onclick={() => clipStore.subtitleSyncOffset = 0}
                class="flex-1 py-1 rounded bg-[#010736] border border-[#22396f]/20 text-[#8fa2cb] font-bold hover:text-[#fcf1d0] transition text-[10px]"
              >
                Reset
              </button>
              <button
                type="button"
                onclick={() => clipStore.nudgeSync(0.1)}
                class="flex-1 py-1 rounded bg-[#0d1c42] border border-[#22396f]/30 text-[#fcf1d0] font-bold hover:border-[#fcf1d0] transition text-[10px]"
              >
                +0.1s
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- DOCKED BOTTOM CONTROLS (Zero Overflow Collision, Slim Height) -->
  <div class="flex-shrink-0 pt-2 border-t border-[#22396f]/40 flex flex-col gap-1.5 bg-[#0d1c42] z-20">
    <!-- Export Mode Segmented Control -->
    <div class="grid grid-cols-2 gap-1 p-0.5 bg-[#010736] rounded-xl border border-[#22396f]/50 text-[11px]">
      <button
        type="button"
        onclick={() => clipStore.exportMode = 'single'}
        class="py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 {clipStore.exportMode === 'single' ? 'bg-[#fcf1d0] text-[#010736] shadow-sm' : 'text-[#8fa2cb] hover:text-[#fcf1d0]'}"
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
        class="py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 {clipStore.exportMode === 'bulk' ? 'bg-[#fcf1d0] text-[#010736] shadow-sm' : 'text-[#8fa2cb] hover:text-[#fcf1d0]'}"
      >
        <span>📦 Paket ZIP ({clipStore.selectedClipIdsForBulk.length})</span>
      </button>
    </div>

    <!-- Slim Action Button (Clean Height h-10, Zero Overflow) -->
    <button
      type="button"
      disabled={clipStore.isRendering || (clipStore.exportMode === 'bulk' && clipStore.selectedClipIdsForBulk.length === 0)}
      onclick={onRender}
      class="w-full h-10 px-3 rounded-xl font-bold font-mono text-xs tracking-wide flex items-center justify-center gap-2 transition shadow-lg bg-[#fcf1d0] hover:bg-[#ebdca6] text-[#010736] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if clipStore.isRendering}
        <Loader2 size={15} class="animate-spin text-[#010736]" />
        <span>{clipStore.exportMode === 'bulk' ? 'Memproses ZIP...' : 'Sedang merender...'}</span>
      {:else if clipStore.exportMode === 'bulk'}
        <PackageCheck size={15} class="text-[#010736]" />
        <span>Download ZIP ({clipStore.selectedClipIdsForBulk.length} Klip)</span>
      {:else}
        <Download size={15} class="text-[#010736]" />
        <span>Download Klip #{clipStore.activeClipRank} ({clipStore.aspectRatio})</span>
      {/if}
    </button>
  </div>
</div>
