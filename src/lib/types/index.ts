export interface HeatmapPoint {
  start_time: number;
  end_time: number;
  value: number;
}

export interface CandidateClip {
  id: string;
  rank: number;
  start: number;
  end: number;
  duration: number;
  score: number;
  label: string;
  category?: 'EDU' | 'CTRL' | 'INSP';
  isDownloaded?: boolean;
  downloadUrl?: string;
}

export interface TranscriptLine {
  start: number;
  duration: number;
  text: string;
}

export interface VideoAnalysisResult {
  videoId: string;
  title: string;
  duration: number;
  channel: string;
  thumbnail: string;
  heatmapPoints: HeatmapPoint[];
  topClips: CandidateClip[];
  transcript?: TranscriptLine[];
  isUploadedVideo?: boolean;
  directVideoUrl?: string;
}

export interface RenderJobProgress {
  id: string;
  status: 'queued' | 'downloading' | 'slicing' | 'uploading' | 'completed' | 'failed';
  progressPercent: number;
  r2Url?: string | null;
  error?: string | null;
  cached?: boolean;
}
