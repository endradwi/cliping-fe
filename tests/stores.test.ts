import { describe, it, expect } from 'bun:test';
import type { CandidateClip, VideoAnalysisResult } from '../src/lib/types';

describe('Frontend Data Contracts & Candidate Clip Mapping', () => {
  it('should validate CandidateClip structure', () => {
    const mockClip: CandidateClip = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      rank: 1,
      start: 10,
      end: 40,
      duration: 30,
      score: 95,
      label: 'Peak Retention Hotspot #1'
    };

    expect(mockClip.duration).toBe(mockClip.end - mockClip.start);
    expect(mockClip.score).toBeGreaterThan(0);
    expect(mockClip.rank).toBe(1);
  });

  it('should validate VideoAnalysisResult structure', () => {
    const mockResult: VideoAnalysisResult = {
      videoId: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up',
      duration: 212,
      channel: 'RickAstleyVEVO',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      heatmapPoints: [
        { start_time: 0, end_time: 2, value: 1.0 },
        { start_time: 2, end_time: 4, value: 0.8 }
      ],
      topClips: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          rank: 1,
          start: 0,
          end: 30,
          duration: 30,
          score: 100,
          label: 'Peak Retention Hotspot #1'
        }
      ]
    };

    expect(mockResult.topClips).toHaveLength(1);
    expect(mockResult.heatmapPoints).toHaveLength(2);
    expect(mockResult.duration).toBe(212);
  });
});
