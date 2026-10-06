import type { RenderJobProgress } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function subscribeToProgress(
  jobId: string,
  onUpdate: (progress: RenderJobProgress) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/api/v1/clips/${jobId}/progress`);

  eventSource.onmessage = (event) => {
    try {
      const data: RenderJobProgress = JSON.parse(event.data);
      onUpdate(data);

      if (data.status === 'completed' || data.status === 'failed') {
        eventSource.close();
      }
    } catch (e) {
      if (onError) onError(e);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}
