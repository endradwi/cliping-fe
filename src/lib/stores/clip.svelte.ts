import type { VideoAnalysisResult, CandidateClip, RenderJobProgress } from '../types';

class ClipStudioStore {
  // Svelte 5 Universal Runes state
  videoUrl = $state<string>('');
  isAnalyzing = $state<boolean>(false);
  analysisResult = $state<VideoAnalysisResult | null>(null);
  
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

  setAnalysis(data: VideoAnalysisResult, rawUrl: string) {
    this.analysisResult = data;
    this.videoUrl = rawUrl;
    if (data.topClips.length > 0) {
      this.selectClip(data.topClips[0]);
    }
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
    this.activeJobId = null;
    this.renderProgress = null;
    this.isRendering = false;
  }
}

export const clipStore = new ClipStudioStore();
