# 🔄 Svelte 5 Runes State Flow

```text
[ User Input URL ]
        │
        ▼ (UrlSubmitContainer)
[ API Client: POST /api/v1/analyze ]
        │
        ▼
[ clipStudioState ($state in clip.svelte.ts) ]
        ├── videoMetadata: { title, duration, thumbnail }
        ├── heatmapPoints: [{ start_time, value }]
        └── topClips: [Clip #1, Clip #2, Clip #3]
        │
        ▼ (HeatmapStudioContainer)
[ In-Browser CSS 9:16 Video Canvas + HeatmapCurve.svelte ]
        │
        ▼ (User selects clip / adjusts In-Out points)
[ Export Button Trigger ]
        │
        ▼ (ExportProgressContainer)
[ API Client: POST /api/v1/clips/render ] ──► SSE EventSource Stream
        │
        ▼
[ Real-time progress 20% -> 50% -> 80% -> 100% ]
        │
        ▼
[ Direct Cloudflare R2 Download Link ]
```
