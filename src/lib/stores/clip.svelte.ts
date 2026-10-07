import type { VideoAnalysisResult, CandidateClip, RenderJobProgress } from '../types';

class ClipStudioStore {
  // Svelte 5 Universal Runes state
  videoUrl = $state<string>('');
  isAnalyzing = $state<boolean>(false);
  analysisResult = $state<VideoAnalysisResult | null>(null);
  
  // Batch Management (SOP: 1 Batch = 3 Videos)
  currentBatch = $state<number>(1);
  
  // Selected range
  selectedStart = $state<number>(0);
  selectedEnd = $state<number>(30);
  activeClipRank = $state<number>(1);
  
  // Toggles
  burnSubtitles = $state<boolean>(true);
  aspectRatio = $state<'9:16' | '1:1' | '16:9'>('9:16');
  
  // Render pipeline state
  activeJobId = $state<string | null>(null);
  renderProgress = $state<RenderJobProgress | null>(null);
  isRendering = $state<boolean>(false);

  // Derived calculations
  selectedDuration = $derived(Math.max(1, this.selectedEnd - this.selectedStart));
  hasVideo = $derived(this.analysisResult !== null);

  totalBatches = $derived.by(() => {
    const total = this.analysisResult?.topClips.length || 0;
    return Math.max(1, Math.ceil(total / 3));
  });

  currentBatchClips = $derived.by(() => {
    const all = this.analysisResult?.topClips || [];
    const startIndex = (this.currentBatch - 1) * 3;
    return all.slice(startIndex, startIndex + 3);
  });

  setAnalysis(data: VideoAnalysisResult, rawUrl: string) {
    this.analysisResult = data;
    this.videoUrl = rawUrl;
    this.currentBatch = 1;
    if (data.topClips.length > 0) {
      this.selectClip(data.topClips[0]);
    }
  }

  setBatch(batch: number) {
    this.currentBatch = Math.max(1, Math.min(this.totalBatches, batch));
    const firstInBatch = this.currentBatchClips[0];
    if (firstInBatch) {
      this.selectClip(firstInBatch);
    }
  }

  nextBatch() {
    const next = this.currentBatch < this.totalBatches ? this.currentBatch + 1 : 1;
    this.setBatch(next);
  }

  selectClip(clip: CandidateClip) {
    this.selectedStart = clip.start;
    this.selectedEnd = clip.end;
    this.activeClipRank = clip.rank;
  }

  setManualRange(start: number, end: number) {
    this.selectedStart = Math.max(0, start);
    this.selectedEnd = Math.max(this.selectedStart + 5, end);
    this.activeClipRank = 0; // manual override
  }

  reset() {
    this.analysisResult = null;
    this.videoUrl = '';
    this.currentBatch = 1;
    this.activeJobId = null;
    this.renderProgress = null;
    this.isRendering = false;
  }
}

export const clipStore = new ClipStudioStore();
