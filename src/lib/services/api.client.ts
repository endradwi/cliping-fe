import type { VideoAnalysisResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function analyzeVideoUrl(url: string): Promise<VideoAnalysisResult> {
  const res = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to analyze video');
  }

  return json.data;
}

export async function triggerRenderClip(payload: {
  url: string;
  start: number;
  end: number;
  aspectRatio: string;
  burnSubtitles: boolean;
  title?: string;
}): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/api/v1/clips/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to start render');
  }

  return json.data;
}

export async function saveByokSettings(settings: {
  aiBaseUrl?: string;
  aiApiKey?: string;
  aiModel?: string;
  groqApiKey?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to save settings');
}
