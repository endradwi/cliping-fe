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

  async function handleAnalyze(url: string) {
    errorMsg = null;
    isYoutubeBlocked = false;
    clipStore.isAnalyzing = true;
    try {
      const data = await analyzeVideoUrl(url);
      await clipStore.setAnalysis(data, url);
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch YouTube retention telemetry';
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

    errorMsg = null;
    isYoutubeBlocked = false;
    clipStore.isUploading = true;
    clipStore.uploadProgress = 0;
    clipStore.uploadFilename = file.name;

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

      // Step 3: Trigger server-side stream probe + Groq Whisper hook analysis
      clipStore.isAnalyzing = true;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      const data = await analyzeUploadedVideo(publicUrl, cleanTitle, file.name);

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
  <div class="flex items-center gap-2 p-1 bg-[#150000] border border-[#757D6F]/30 rounded-xl mb-4 self-center font-mono text-xs shadow-lg">
    <button
      type="button"
      onclick={() => { activeTab = 'youtube'; errorMsg = null; isYoutubeBlocked = false; }}
      class="px-4 py-2 rounded-lg transition flex items-center gap-2 {activeTab === 'youtube' ? 'bg-[#6D0808] text-[#EEEAD7] font-bold shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
    >
      <Youtube size={15} />
      <span>YouTube URL</span>
    </button>

    <button
      type="button"
      onclick={() => { activeTab = 'upload'; errorMsg = null; isYoutubeBlocked = false; }}
      class="px-4 py-2 rounded-lg transition flex items-center gap-2 {activeTab === 'upload' ? 'bg-[#D4FF00] text-black font-bold shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
    >
      <UploadCloud size={15} />
      <span>Upload File (Up to 2h VOD)</span>
      <span class="text-[9px] px-1.5 py-0.2 bg-black/40 text-[#D4FF00] rounded-full border border-[#D4FF00]/30 hidden sm:inline">Zero-Block</span>
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
      class="w-full p-8 border-2 border-dashed rounded-2xl transition-all text-center flex flex-col items-center justify-center gap-3 relative shadow-xl {isDragging || isWindowDragging ? 'border-[#D4FF00] bg-[#D4FF00]/10 scale-[1.01]' : 'border-[#757D6F]/40 bg-[#2D0000]/60 hover:border-[#757D6F]/80'}"
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
          <Loader2 size={36} class="text-[#D4FF00] animate-spin" />
          <div class="text-sm font-bold text-[#EEEAD7] font-mono">
            {#if clipStore.isUploading}
              Uploading directly to Cloudflare R2 ({clipStore.uploadProgress}%)
            {:else}
              Extracting Audio Chunks & Transcribing via Whisper LPU...
            {/if}
          </div>
          <!-- Upload Progress bar -->
          <div class="w-full bg-[#150000] h-2.5 rounded-full overflow-hidden border border-[#757D6F]/30 shadow-inner">
            <div
              class="bg-[#D4FF00] h-full transition-all duration-200"
              style="width: {clipStore.uploadProgress}%;"
            ></div>
          </div>
          <span class="text-[11px] text-[#A9B3A1] font-mono truncate max-w-xs">{clipStore.uploadFilename}</span>
          <span class="text-[10px] text-[#757D6F] font-mono">Supports long podcasts & Twitch VODs (up to 2h)</span>
        </div>
      {:else}
        <div class="w-14 h-14 rounded-2xl bg-[#150000] border border-[#757D6F]/40 flex items-center justify-center text-[#D4FF00] shadow-lg">
          <UploadCloud size={28} />
        </div>
        <div>
          <h3 class="text-sm font-bold text-[#EEEAD7]">Drag & drop video file or click to browse</h3>
          <p class="text-xs text-[#A9B3A1] mt-1 font-mono">Supports 1-2h Podcasts, Twitch VODs & Zoom Recordings (MP4, MOV, WEBM)</p>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <button
            type="button"
            onclick={() => fileInputRef?.click()}
            class="px-5 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#c7f000] text-black font-bold font-mono text-xs transition shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <FileVideo size={16} />
            <span>Select Video File</span>
          </button>
        </div>
        <span class="text-[10px] font-mono text-[#757D6F] mt-1">Tip: PC/Laptop users can also press Ctrl+V to paste a copied video file!</span>
      {/if}
    </div>
  {/if}

  <!-- PROACTIVE SMART RESCUE CARD (When YouTube link gets bot blocked or errors) -->
  {#if isYoutubeBlocked}
    <div class="w-full mt-4 p-4 bg-[#2D0000] border-2 border-[#D4FF00]/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl animate-in fade-in zoom-in duration-300">
      <div class="flex items-start gap-3">
        <div class="p-2.5 bg-[#D4FF00]/10 text-[#D4FF00] rounded-xl flex-shrink-0">
          <ShieldAlert size={22} />
        </div>
        <div class="text-left">
          <h4 class="text-xs sm:text-sm font-bold text-[#EEEAD7]">YouTube Blocked Direct Link Scraping</h4>
          <p class="text-[11px] text-[#A9B3A1] mt-0.5 leading-relaxed">
            Don't leave! You can upload the video file directly (MP4/MOV) with <span class="text-[#D4FF00] font-bold">100% success rate</span> and zero bot restrictions.
          </p>
        </div>
      </div>
      <button
        type="button"
        onclick={switchToUpload}
        class="px-4 py-2.5 bg-[#D4FF00] hover:bg-[#c7f000] text-black font-bold font-mono text-xs rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap hover:scale-105 active:scale-95 flex-shrink-0"
      >
        <UploadCloud size={16} />
        <span>Upload File Instead ➔</span>
      </button>
    </div>
  {:else if errorMsg}
    <!-- Regular Notice -->
    <div class="w-full mt-4 px-4 py-3 bg-[#2D0000] border border-[#6D0808] text-[#EEEAD7] text-xs rounded-xl flex items-center justify-between gap-2 shadow-lg">
      <div class="flex items-center gap-2">
        <AlertCircle size={16} class="text-red-400 flex-shrink-0" />
        <div><span class="font-bold text-red-400">Notice:</span> {errorMsg}</div>
      </div>
      <button
        type="button"
        onclick={() => { activeTab = 'upload'; errorMsg = null; }}
        class="text-[11px] font-mono text-[#D4FF00] hover:underline whitespace-nowrap"
      >
        Try uploading file ➔
      </button>
    </div>
  {/if}
</div>
