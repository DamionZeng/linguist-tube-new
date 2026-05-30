import { MOCK_EXPLORE_VIDEOS } from '../mocks/general';
import { mockTranscripts, mockVideoInfo } from '../mocks/transcript';

export interface SearchResult {
  type: 'video' | 'transcript';
  id: string;
  title: string;
  subtitle?: string;
  thumb?: string;
  time?: string;
  videoId?: string;
}

export const searchContent = async (query: string): Promise<SearchResult[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query || query.trim() === '') {
        resolve([]);
        return;
      }
      
      const q = query.toLowerCase();
      const results: SearchResult[] = [];
      
      // Search Videos
      MOCK_EXPLORE_VIDEOS.forEach(v => {
        if (v.title.toLowerCase().includes(q) || (v as any).tag?.toLowerCase().includes(q)) {
          results.push({
            type: 'video',
            id: v.id,
            title: v.title,
            subtitle: `Duration: ${(v as any).duration || 'N/A'} • Level: ${(v as any).level || 'Unknown'}`,
            thumb: v.thumb || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
            videoId: v.id
          });
        }
      });
      
      // Search Transcripts (Currently we only have transripts for a single mock video, v5)
      mockTranscripts.forEach(t => {
        if (t.en.toLowerCase().includes(q) || t.zh.toLowerCase().includes(q)) {
          results.push({
            type: 'transcript',
            id: t.id,
            title: t.en,
            subtitle: t.zh,
            time: t.startTime,
            videoId: mockVideoInfo.id,
            thumb: mockVideoInfo.thumbnail || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
          });
        }
      });
      
      resolve(results);
    }, 300);
  });
};
