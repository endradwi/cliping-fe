import type { VideoAnalysisResult } from '../types';

export const API_BASE = (import.meta.env.PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'https://api-clip.endra.web.id').replace(/\/$/, '');

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

// Request presigned upload credentials for direct client-to-R2 upload (zero VPS load)
export async function getPresignedUploadUrl(filename: string, contentType: string = 'video/mp4'): Promise<{ presignedUrl: string; publicUrl: string; key: string }> {
  const res = await fetch(`${API_BASE}/api/v1/upload/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType })
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to get upload authorization');
  }

  return json.data;
}

// Direct browser-to-R2 upload with native byte-level progress reporting
export function uploadFileToR2(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 direct upload rejected with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network connection failed during R2 upload'));
    xhr.send(file);
  });
}

// Fallback upload directly via backend gateway (if Cloudflare R2 bucket CORS is not yet configured)
export function uploadFileDirectFallback(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ publicUrl: string; key: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', `${API_BASE}/api/v1/upload/direct`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.data) {
            resolve(res.data);
          } else {
            reject(new Error(res.error?.message || 'Server upload processing failed'));
          }
        } catch (e: any) {
          reject(e);
        }
      } else {
        reject(new Error(`Server upload rejected with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload to server'));
    xhr.send(formData);
  });
}

// Analyze directly uploaded video from R2 URL
export async function analyzeUploadedVideo(r2Url: string, title?: string, filename?: string): Promise<VideoAnalysisResult> {
  const res = await fetch(`${API_BASE}/api/v1/analyze/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ r2Url, title, filename })
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to analyze uploaded video');
  }

  return json.data;
}

// Fetch historical rendered clips for a given video
export async function fetchClipHistory(url: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/clips/history?url=${encodeURIComponent(url)}`);
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function triggerRenderClip(payload: {
  url: string;
  start: number;
  end: number;
  aspectRatio: string;
  burnSubtitles: boolean;
  title?: string;
}): Promise<{ jobId: string; status?: string; r2Url?: string; cached?: boolean }> {
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
