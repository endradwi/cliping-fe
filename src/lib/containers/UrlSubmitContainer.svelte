<script lang="ts">
  import UrlInputField from '../components/input/UrlInputField.svelte';
  import { analyzeVideoUrl, getPresignedUploadUrl, uploadFileToR2, analyzeUploadedVideo } from '../services/api.client';
  import { clipStore } from '../stores/clip.svelte';
  import { UploadCloud, Youtube, Loader2, FileVideo, Sparkles, AlertCircle } from 'lucide-svelte';

  let activeTab = $state<'youtube' | 'upload'>('youtube');
  let inputUrl = $state('');
  let errorMsg = $state<string | null>(null);
  let isDragging = $state(false);
  let fileInputRef = $state<HTMLInputElement | null>(null);

  async function handleAnalyze(url: string) {
    errorMsg = null;
    clipStore.isAnalyzing = true;
    try {
      const data = await analyzeVideoUrl(url);
      await clipStore.setAnalysis(data, url);
    } catch (err: any) {
      errorMsg = err.message || 'Failed to fetch YouTube retention telemetry';
    } finally {
      clipStore.isAnalyzing = false;
    }
  }

  async function handleFileUpload(file: File) {
    if (!file) return;
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm|mkv)$/i)) {
      errorMsg = 'Please select a valid video file (.mp4, .mov, .webm)';
      return;
    }

    errorMsg = null;
    clipStore.isUploading = true;
    clipStore.uploadProgress = 0;
    clipStore.uploadFilename = file.name;

    try {
      // Step 1: Get presigned upload URL directly to Cloudflare R2 (zero VPS load)
      const { presignedUrl, publicUrl } = await getPresignedUploadUrl(
        file.name,
        file.type || 'video/mp4'
      );

      // Step 2: Stream file directly from browser to Cloudflare R2
      await uploadFileToR2(presignedUrl, file, (pct) => {
        clipStore.uploadProgress = pct;
      });

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
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }
</script>

<div class="w-full max-w-2xl mx-auto flex flex-col items-center">
  <!-- Mode Switcher Tabs -->
  <div class="flex items-center gap-2 p-1 bg-[#150000] border border-[#757D6F]/30 rounded-xl mb-4 self-center font-mono text-xs">
    <button
      type="button"
      onclick={() => { activeTab = 'youtube'; errorMsg = null; }}
      class="px-4 py-2 rounded-lg transition flex items-center gap-2 {activeTab === 'youtube' ? 'bg-[#6D0808] text-[#EEEAD7] font-bold shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
    >
      <Youtube size={15} />
      <span>YouTube URL</span>
    </button>

    <button
      type="button"
      onclick={() => { activeTab = 'upload'; errorMsg = null; }}
      class="px-4 py-2 rounded-lg transition flex items-center gap-2 {activeTab === 'upload' ? 'bg-[#D4FF00] text-black font-bold shadow' : 'text-[#A9B3A1] hover:text-[#EEEAD7]'}"
    >
      <UploadCloud size={15} />
      <span>Upload Video (Direct)</span>
      <span class="text-[9px] px-1.5 py-0.2 bg-black/40 text-[#D4FF00] rounded-full border border-[#D4FF00]/30 hidden sm:inline">Anti-Bot</span>
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
      class="w-full p-8 border-2 border-dashed rounded-2xl transition-all text-center flex flex-col items-center justify-center gap-3 relative {isDragging ? 'border-[#D4FF00] bg-[#D4FF00]/5 scale-[1.01]' : 'border-[#757D6F]/40 bg-[#2D0000]/60 hover:border-[#757D6F]/80'}"
    >
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
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
              Uploading to Cloudflare R2 ({clipStore.uploadProgress}%)
            {:else}
              Extracting Audio & Generating Hooks (Whisper)...
            {/if}
          </div>
          <!-- Upload Progress bar -->
          <div class="w-full bg-[#150000] h-2.5 rounded-full overflow-hidden border border-[#757D6F]/30">
            <div
              class="bg-[#D4FF00] h-full transition-all duration-200"
              style="width: {clipStore.uploadProgress}%;"
            ></div>
          </div>
          <span class="text-[11px] text-[#A9B3A1] font-mono truncate max-w-xs">{clipStore.uploadFilename}</span>
        </div>
      {:else}
        <div class="w-14 h-14 rounded-2xl bg-[#150000] border border-[#757D6F]/40 flex items-center justify-center text-[#D4FF00] shadow-lg">
          <UploadCloud size={28} />
        </div>
        <div>
          <h3 class="text-sm font-bold text-[#EEEAD7]">Drag & drop video file or click to upload</h3>
          <p class="text-xs text-[#A9B3A1] mt-1 font-mono">Direct upload to Cloudflare R2 • Bypasses YouTube bot limitations</p>
        </div>
        <button
          type="button"
          onclick={() => fileInputRef?.click()}
          class="mt-2 px-5 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#c7f000] text-black font-bold font-mono text-xs transition shadow-lg flex items-center gap-2"
        >
          <FileVideo size={16} />
          <span>Select Video File (MP4, MOV, WEBM)</span>
        </button>
      {/if}
    </div>
  {/if}

  {#if errorMsg}
    <div class="mt-4 px-4 py-2.5 bg-[#2D0000] border border-[#6D0808] text-[#EEEAD7] text-xs rounded-xl flex items-center gap-2 max-w-xl shadow-lg">
      <AlertCircle size={16} class="text-red-400 flex-shrink-0" />
      <div><span class="font-bold text-red-400">Notice:</span> {errorMsg}</div>
    </div>
  {/if}
</div>
