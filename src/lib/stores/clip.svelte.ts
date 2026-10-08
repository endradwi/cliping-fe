import type { VideoAnalysisResult, CandidateClip, RenderJobProgress } from '../types';

export type SubtitleAnimation = 'POP' | 'FADE' | 'RISE' | 'DROP' | 'ZOOM' | 'TYPE' | 'OFF';

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

  // Subtitle / Caption Mood Styling (Modern Opus/Submagic Style)
  subtitleColor = $state<string>('#D4FF00'); // Electric Neon Lime default
  subtitleAnimation = $state<SubtitleAnimation>('POP');
  subtitleGlow = $state<boolean>(true);
  subtitleFontSize = $state<number>(28);
  subtitlePosY = $state<number>(80); // percentage from top
  wordsPerChunk = $state<number>(2);
  highlightedWordIndices = $state<number[]>([0]); // words to highlight
  clipFilter = $state<'all' | 'hot' | 'rendered'>('all');
  
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

  filteredClips = $derived.by(() => {
    const all = this.analysisResult?.topClips || [];
    if (this.clipFilter === 'hot') {
      return all.filter(c => c.score >= 65);
    }
    if (this.clipFilter === 'rendered') {
      return this.renderProgress?.status === 'completed' ? all.slice(0, 1) : [];
    }
    return all;
  });

  setAnalysis(data: VideoAnalysisResult, rawUrl: string) {
    this.analysisResult = data;
    this.videoUrl = rawUrl;
    this.currentBatch = 1;
    this.highlightedWordIndices = [0];
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
    // Auto-update batch if clip belongs to a different batch
    const clipBatch = Math.floor((clip.rank - 1) / 3) + 1;
    if (clipBatch !== this.currentBatch && clipBatch <= this.totalBatches) {
      this.currentBatch = clipBatch;
    }
  }

  setManualRange(start: number, end: number) {
    this.selectedStart = Math.max(0, start);
    this.selectedEnd = Math.max(this.selectedStart + 5, end);
    this.activeClipRank = 0; // manual override
  }

  toggleWordHighlight(idx: number) {
    if (this.highlightedWordIndices.includes(idx)) {
      this.highlightedWordIndices = this.highlightedWordIndices.filter(i => i !== idx);
    } else {
      this.highlightedWordIndices = [...this.highlightedWordIndices, idx];
    }
  }

  reset() {
    this.analysisResult = null;
    this.videoUrl = '';
    this.currentBatch = 1;
    this.activeJobId = null;
    this.renderProgress = null;
    this.isRendering = false;
    this.highlightedWordIndices = [0];
  }
}

export const clipStore = new ClipStudioStore();
