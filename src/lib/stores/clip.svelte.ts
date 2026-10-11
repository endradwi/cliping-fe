import type { VideoAnalysisResult, CandidateClip, RenderJobProgress } from '../types';
import { fetchClipHistory } from '../services/api.client';

export type SubtitleAnimation = 'POP' | 'FADE' | 'RISE' | 'DROP' | 'ZOOM' | 'TYPE' | 'OFF';

class ClipStudioStore {
  // Svelte 5 Universal Runes state
  videoUrl = $state<string>('');
  isAnalyzing = $state<boolean>(false);
  analysisResult = $state<VideoAnalysisResult | null>(null);

  // Upload state (Direct Browser-to-R2)
  isUploading = $state<boolean>(false);
  uploadProgress = $state<number>(0);
  uploadFilename = $state<string>('');
  
  // Batch Management (SOP: 1 Batch = 3 Videos, but user can view all)
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
  clipFilter = $state<'all' | 'hot' | 'downloaded'>('all');
  
  // Bulk Download state
  selectedClipIdsForBulk = $state<string[]>([]);
  bulkDownloadProgress = $state<{ current: number; total: number; message: string } | null>(null);

  // History tracking (key: `${start}_${end}` -> r2Url)
  downloadedJobs = $state<Record<string, { id: string; r2Url: string }>>({});

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
      return all.filter(c => c.score >= 75);
    }
    if (this.clipFilter === 'downloaded') {
      return all.filter(c => this.isClipDownloaded(c));
    }
    return all;
  });

  isClipDownloaded(clip: CandidateClip): boolean {
    const key = `${Math.round(clip.start)}_${Math.round(clip.end)}`;
    return Boolean(this.downloadedJobs[key]);
  }

  getClipDownloadUrl(clip: CandidateClip): string | null {
    const key = `${Math.round(clip.start)}_${Math.round(clip.end)}`;
    return this.downloadedJobs[key]?.r2Url || null;
  }

  async setAnalysis(data: VideoAnalysisResult, rawUrl: string) {
    this.analysisResult = data;
    this.videoUrl = rawUrl;
    this.currentBatch = 1;
    this.highlightedWordIndices = [0];
    this.selectedClipIdsForBulk = [];

    if (data.topClips.length > 0) {
      this.selectClip(data.topClips[0]);
    }

    // Sync history for this video (detect previous downloads)
    await this.syncHistory(rawUrl);
  }

  async syncHistory(url: string) {
    if (!url) return;
    try {
      const history = await fetchClipHistory(url);
      const newMap: Record<string, { id: string; r2Url: string }> = { ...this.downloadedJobs };
      for (const item of history) {
        if (item.r2Url) {
          const key = `${Math.round(item.start)}_${Math.round(item.end)}`;
          newMap[key] = { id: item.id, r2Url: item.r2Url };
        }
      }
      this.downloadedJobs = newMap;
    } catch {
      // offline or table uninitialized
    }
  }

  markClipDownloaded(start: number, end: number, id: string, r2Url: string) {
    const key = `${Math.round(start)}_${Math.round(end)}`;
    this.downloadedJobs = {
      ...this.downloadedJobs,
      [key]: { id, r2Url }
    };
  }

  toggleBulkSelect(clipId: string) {
    if (this.selectedClipIdsForBulk.includes(clipId)) {
      this.selectedClipIdsForBulk = this.selectedClipIdsForBulk.filter(id => id !== clipId);
    } else {
      this.selectedClipIdsForBulk = [...this.selectedClipIdsForBulk, clipId];
    }
  }

  selectAllClips() {
    const allIds = (this.analysisResult?.topClips || []).map(c => c.id);
    this.selectedClipIdsForBulk = allIds;
  }

  deselectAllClips() {
    this.selectedClipIdsForBulk = [];
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
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadFilename = '';
    this.highlightedWordIndices = [0];
    this.selectedClipIdsForBulk = [];
    this.bulkDownloadProgress = null;
  }
}

export const clipStore = new ClipStudioStore();
