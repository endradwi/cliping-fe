import type { RenderJobProgress } from '../types';
import { API_BASE } from './api.client';

export function subscribeToProgress(
  jobId: string,
  onUpdate: (progress: RenderJobProgress) => void,
  onError?: (err: any) => void
): () => void {
  let isClosed = false;
  let eventSource: EventSource | null = null;
  let pollInterval: any = null;

  // 1. Direct Polling Fallback (ensures progress never hangs even if proxy buffers SSE)
  const poll = async () => {
    if (isClosed) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/clips/${jobId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          onUpdate(json.data);
          if (json.data.status === 'completed' || json.data.status === 'failed') {
            cleanup();
          }
        }
      }
    } catch (e) {
      if (onError) onError(e);
    }
  };

  // Immediate poll + periodic poll
  poll();
  pollInterval = setInterval(poll, 1500);

  // 2. Real-time SSE Connection
  try {
    eventSource = new EventSource(`${API_BASE}/api/v1/clips/${jobId}/progress`);

    eventSource.onmessage = (event) => {
      if (isClosed) return;
      try {
        const data: RenderJobProgress = JSON.parse(event.data);
        onUpdate(data);

        if (data.status === 'completed' || data.status === 'failed') {
          cleanup();
        }
      } catch (e) {
        if (onError) onError(e);
      }
    };

    eventSource.onerror = () => {
      // If SSE errors out or closes, polling handles it seamlessly
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  } catch (err) {
    // Rely on polling
  }

  const cleanup = () => {
    isClosed = true;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  return cleanup;
}
