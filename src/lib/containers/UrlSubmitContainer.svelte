<script lang="ts">
  import UrlInputField from '../components/input/UrlInputField.svelte';
  import { analyzeVideoUrl, getPresignedUploadUrl, uploadFileToR2, uploadFileDirectFallback, analyzeUploadedVideo } from '../services/api.client';
  import { clipStore } from '../stores/clip.svelte';
  import { UploadCloud, Youtube, Loader2, FileVideo, Sparkles, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-svelte';

  let activeTab = $state<'youtube' | 'upload'>('youtube');
  let inputUrl = $state('');
  let errorMsg = $state<string | null>(null);
  let isYoutubeBlocked = $state(false);
  let isDragging = $state(false);
  let isWindowDragging = $state(false);
  let fileInputRef = $state<HTMLInputElement | null>(null);
  let showBriefInput = $state(false);

  async function handleAnalyze(url: string) {
    errorMsg = null;
    isYoutubeBlocked = false;
    clipStore.isAnalyzing = true;
    try {
      const data = await analyzeVideoUrl(url, clipStore.campaignBrief);
      await clipStore.setAnalysis(data, url);
    } catch (err: any) {
      const msg = err.message || 'Gagal memproses video. Silakan coba unggah file video langsung.';
      errorMsg = msg;
      if (
        msg.toLowerCase().includes('bot') ||
        msg.toLowerCase().includes('sign in') ||
        msg.toLowerCase().includes('cookies') ||
        msg.toLowerCase().includes('429') ||
        msg.toLowerCase().includes('block')
      ) {
        isYoutubeBlocked = true;
      }
    } finally {
      clipStore.isAnalyzing = false;
    }
  }

  async function handleFileUpload(file: File) {
    if (!file) return;
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm|mkv|m4v)$/i)) {
      errorMsg = 'Please select a valid video file (.mp4, .mov, .webm, .mkv)';
      return;
    }

    // ponytail: 2GB ceiling prevents choking VPS ffmpeg workers. Upgrade to S3 multipart when adding studio raw tier.
    if (file.size > 2 * 1024 * 1024 * 1024) {
      errorMsg = 'File terlalu besar (maksimal 2 GB). Kompres atau potong durasi video terlebih dahulu.';
      return;
    }

    errorMsg = null;
    isYoutubeBlocked = false;
    clipStore.isUploading = true;
    clipStore.uploadProgress = 0;
    clipStore.uploadFilename = file.name;

    // Cache local blob for instantaneous 0ms video preview playback
    try {
      clipStore.localVideoBlobUrl = URL.createObjectURL(file);
    } catch {}

    try {
      let publicUrl = '';

      // Attempt 1: Direct client-to-R2 (Fastest, zero VPS load)
      try {
        const { presignedUrl, publicUrl: r2Url } = await getPresignedUploadUrl(
          file.name,
          file.type || 'video/mp4'
        );

        await uploadFileToR2(presignedUrl, file, (pct) => {
          clipStore.uploadProgress = pct;
        });

        publicUrl = r2Url;
      } catch (r2Err: any) {
        // Attempt 2: Resilient server-stream fallback (if R2 CORS policy is not active in browser)
        console.warn('Direct R2 upload encountered CORS, activating gateway stream fallback:', r2Err);
        const fallbackRes = await uploadFileDirectFallback(file, (pct) => {
          clipStore.uploadProgress = pct;
        });
        publicUrl = fallbackRes.publicUrl;
      }

      // Step 3: Upload complete -> Transition immediately to AI Analysis stage
      clipStore.isUploading = false;
      clipStore.isAnalyzing = true;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      const data = await analyzeUploadedVideo(publicUrl, cleanTitle, file.name, clipStore.campaignBrief);

      await clipStore.setAnalysis(data, publicUrl);
    } catch (err: any) {
      errorMsg = err.message || 'Direct video upload or processing failed';
    } finally {
      clipStore.isUploading = false;
      clipStore.isAnalyzing = false;
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    isWindowDragging = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      activeTab = 'upload';
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }

  // Desktop Clipper Superpower: Handle Ctrl+V paste file from OS explorer
  function handleWindowPaste(e: ClipboardEvent) {
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|mkv)$/i)) {
        activeTab = 'upload';
        handleFileUpload(file);
      }
    }
  }

  function switchToUpload() {
    activeTab = 'upload';
    errorMsg = null;
    isYoutubeBlocked = false;
    setTimeout(() => {
      fileInputRef?.click();
    }, 100);
  }
</script>

<svelte:window
  onpaste={handleWindowPaste}
  ondragenter={() => isWindowDragging = true}
  ondragover={(e) => { e.preventDefault(); isWindowDragging = true; }}
  ondragleave={(e) => {
    if (!e.relatedTarget) isWindowDragging = false;
  }}
  ondrop={handleDrop}
/>

<div class="w-full max-w-2xl mx-auto flex flex-col items-center relative">
  <!-- Mode Switcher Tabs -->
  <div class="flex items-center gap-2 p-1 bg-[#010736] border border-[#22396f]/30 rounded-xl mb-4 self-center font-mono text-xs shadow-lg">
    <button
      type="button"
      onclick={() => { activeTab = 'youtube'; errorMsg = null; isYoutubeBlocked = false; }}
      class="px-4 py-2 rounded-lg transition flex items-center gap-2 {activeTab === 'youtube' ? 'bg-[#22396f] text-[#fcf1d0] font-bold shadow' : 'text-[#8fa2cb] hover:text-[#fcf1d0]'}"
    >
      <Youtube size={15} />
      <span>YouTube URL</span>
    </button>

    <button
      type="button"
      onclick={() => { activeTab = 'upload'; errorMsg = null; isYoutubeBlocked = false; }}
      class="px-4 py-2 rounded-lg transition flex items-center gap-2 {activeTab === 'upload' ? 'bg-[#fcf1d0] text-black font-bold shadow' : 'text-[#8fa2cb] hover:text-[#fcf1d0]'}"
    >
      <UploadCloud size={15} />
      <span>Upload File (Up to 2h VOD)</span>
      <span class="text-[9px] px-1.5 py-0.2 bg-black/40 text-[#fcf1d0] rounded-full border border-[#fcf1d0]/30 hidden sm:inline">Zero-Block</span>
    </button>
  </div>

  {#if activeTab === 'youtube'}
    <UrlInputField
      bind:value={inputUrl}
      loading={clipStore.isAnalyzing}
      onsubmit={handleAnalyze}
    />
  {:else}
    <!-- Direct Video Upload Dropzone -->
    <div
      role="region"
      aria-label="Video File Upload Dropzone"
      ondragover={(e) => { e.preventDefault(); isDragging = true; }}
      ondragleave={() => isDragging = false}
      ondrop={handleDrop}
      class="w-full p-8 border-2 border-dashed rounded-2xl transition-all text-center flex flex-col items-center justify-center gap-3 relative shadow-xl {isDragging || isWindowDragging ? 'border-[#fcf1d0] bg-[#fcf1d0]/10 scale-[1.01]' : 'border-[#22396f]/40 bg-[#0d1c42]/60 hover:border-[#22396f]/80'}"
    >
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
        class="hidden"
        bind:this={fileInputRef}
        onchange={(e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files[0]) handleFileUpload(files[0]);
        }}
      />

      {#if clipStore.isUploading || clipStore.isAnalyzing}
        <div class="flex flex-col items-center gap-3 w-full max-w-sm">
          <Loader2 size={36} class="text-[#fcf1d0] animate-spin" />
          <div class="text-sm font-bold text-[#fcf1d0] font-mono">
            {#if clipStore.isUploading}
              Mengunggah video... ({clipStore.uploadProgress}%)
            {:else}
              Menganalisis audio & mendeteksi momen terbaik...
            {/if}
          </div>
          <!-- Upload Progress bar -->
          <div class="w-full bg-[#010736] h-2.5 rounded-full overflow-hidden border border-[#22396f]/30 shadow-inner">
            <div
              class="bg-[#fcf1d0] h-full transition-all duration-200"
              style="width: {clipStore.uploadProgress}%;"
            ></div>
          </div>
          <span class="text-[11px] text-[#8fa2cb] font-mono truncate max-w-xs">{clipStore.uploadFilename}</span>
          <span class="text-[10px] text-[#22396f] font-mono">Supports long podcasts & Twitch VODs (up to 2h)</span>
        </div>
      {:else}
        <div class="w-14 h-14 rounded-2xl bg-[#010736] border border-[#22396f]/40 flex items-center justify-center text-[#fcf1d0] shadow-lg">
          <UploadCloud size={28} />
        </div>
        <div>
          <h3 class="text-sm font-bold text-[#fcf1d0]">Drag & drop video file or click to browse</h3>
          <p class="text-xs text-[#8fa2cb] mt-1 font-mono">Supports 1-2h Podcasts, Twitch VODs & Zoom Recordings (MP4, MOV, WEBM)</p>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <button
            type="button"
            onclick={() => fileInputRef?.click()}
            class="px-5 py-2.5 rounded-xl bg-[#fcf1d0] hover:bg-[#e9dfb8] text-black font-bold font-mono text-xs transition shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <FileVideo size={16} />
            <span>Select Video File</span>
          </button>
        </div>
        <span class="text-[10px] font-mono text-[#22396f] mt-1">Tip: PC/Laptop users can also press Ctrl+V to paste a copied video file!</span>
      {/if}
    </div>
  {/if}

  <!-- Progressive Disclosure: Campaign Brief & Do's/Don'ts (Optional) -->
  <div class="w-full mt-3 font-mono">
    <button
      type="button"
      onclick={() => showBriefInput = !showBriefInput}
      class="w-full py-2 px-3 rounded-xl bg-[#0d1c42]/60 hover:bg-[#0d1c42] border border-[#22396f]/40 hover:border-[#22396f] text-left transition flex items-center justify-between text-xs text-[#8fa2cb] hover:text-[#fcf1d0] group"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs text-[#fcf1d0]">{showBriefInput ? '▼' : '▶'}</span>
        <span class="font-bold text-[#fcf1d0]">Arahan Campaign / Brief Khusus</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#010736] border border-[#22396f]/50 text-[#8fa2cb]">Opsional</span>
      </div>
      <span class="text-[11px] text-[#8fa2cb] group-hover:text-[#fcf1d0]">
        {clipStore.campaignBrief.trim() ? '✓ Ada Arahan' : '+ Tambah Aturan Campaign'}
      </span>
    </button>

    {#if showBriefInput}
      <div class="mt-2 p-3 bg-[#0d1c42] border border-[#22396f]/50 rounded-xl flex flex-col gap-2 shadow-inner">
        <div class="flex items-center justify-between text-[11px] text-[#8fa2cb]">
          <span>Tulis syarat campaign, kata kunci wajib, hashtag, atau larangan konten:</span>
          {#if clipStore.campaignBrief.trim()}
            <button type="button" onclick={() => clipStore.campaignBrief = ''} class="text-[#fcf1d0] hover:underline text-[10px]">Bersihkan</button>
          {/if}
        </div>
        <textarea
          bind:value={clipStore.campaignBrief}
          rows={3}
          placeholder="Contoh: Fokus ke tips bisnis & affiliate, dilarang bahas politik/kontroversi, wajib mention #BountyBrand & CTA ke link bio."
          class="w-full bg-[#010736] border border-[#22396f]/60 rounded-lg p-2.5 text-xs text-[#fcf1d0] placeholder:text-[#8fa2cb]/40 focus:outline-none focus:border-[#fcf1d0] resize-none"
        ></textarea>
        <span class="text-[10px] text-[#8fa2cb]/70">
          💡 AI akan memfilter klip dan membuat rekomendasi judul, caption, & hashtag sesuai arahan ini.
        </span>
      </div>
    {/if}
  </div>

  <!-- PROACTIVE SMART RESCUE CARD (When YouTube link gets bot blocked or errors) -->
  {#if isYoutubeBlocked}
    <div class="w-full mt-4 p-4 bg-[#0d1c42] border-2 border-[#fcf1d0]/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl animate-in fade-in zoom-in duration-300">
      <div class="flex items-start gap-3">
        <div class="p-2.5 bg-[#fcf1d0]/10 text-[#fcf1d0] rounded-xl flex-shrink-0">
          <ShieldAlert size={22} />
        </div>
        <div class="text-left">
          <h4 class="text-xs sm:text-sm font-bold text-[#fcf1d0]">YouTube Blocked Direct Link Scraping</h4>
          <p class="text-[11px] text-[#8fa2cb] mt-0.5 leading-relaxed">
            Don't leave! You can upload the video file directly (MP4/MOV) with <span class="text-[#fcf1d0] font-bold">100% success rate</span> and zero bot restrictions.
          </p>
        </div>
      </div>
      <button
        type="button"
        onclick={switchToUpload}
        class="px-4 py-2.5 bg-[#fcf1d0] hover:bg-[#e9dfb8] text-black font-bold font-mono text-xs rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap hover:scale-105 active:scale-95 flex-shrink-0"
      >
        <UploadCloud size={16} />
        <span>Upload File Instead ➔</span>
      </button>
    </div>
  {:else if errorMsg}
    <!-- Regular Notice -->
    <div class="w-full mt-4 px-4 py-3 bg-[#0d1c42] border border-[#22396f] text-[#fcf1d0] text-xs rounded-xl flex items-center justify-between gap-2 shadow-lg">
      <div class="flex items-center gap-2">
        <AlertCircle size={16} class="text-red-400 flex-shrink-0" />
        <div><span class="font-bold text-red-400">Notice:</span> {errorMsg}</div>
      </div>
      <button
        type="button"
        onclick={() => { activeTab = 'upload'; errorMsg = null; }}
        class="text-[11px] font-mono text-[#fcf1d0] hover:underline whitespace-nowrap"
      >
        Try uploading file ➔
      </button>
    </div>
  {/if}
</div>
