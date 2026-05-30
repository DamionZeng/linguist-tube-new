import { MOCK_EXPLORE_VIDEOS, MOCK_HISTORY, MOCK_FAVORITE_SENTENCES, MOCK_VOCAB } from '../mocks/general';
import { mockTranscripts, mockVideoInfo } from '../mocks/transcript';
import { getFavoriteVideos } from '../utils/storage';

export interface SearchResult {
  type: 'video' | 'transcript' | 'sentence' | 'vocab';
  id: string;
  title: string;
  subtitle?: string;
  thumb?: string;
  time?: string;
  videoId?: string;
}

export const searchContent = async (query: string): Promise<SearchResult[]> => {
  return searchExplore(query);
};

export const searchExplore = async (query: string): Promise<SearchResult[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query || query.trim() === '') {
         resolve([]);
         return;
      }
      const q = query.toLowerCase();
      const results: SearchResult[] = [];
      
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

export const searchHistory = async (query: string): Promise<SearchResult[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query || query.trim() === '') return resolve([]);
      const q = query.toLowerCase();
      const results: SearchResult[] = MOCK_HISTORY
        .filter(v => v.title.toLowerCase().includes(q) || v.tag?.toLowerCase().includes(q))
        .map(v => ({
          type: 'video',
          id: v.id,
          title: v.title,
          subtitle: `Progress: ${v.progress || 0}% • ${v.lastWatched || ''}`,
          thumb: v.thumb || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
          videoId: v.id
        }));
      resolve(results);
    }, 300);
  });
};

export const searchFavorites = async (query: string): Promise<SearchResult[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query || query.trim() === '') return resolve([]);
      const q = query.toLowerCase();
      const favVideos = getFavoriteVideos();
      const results: SearchResult[] = [];
      
      favVideos.forEach(v => {
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

      MOCK_FAVORITE_SENTENCES.forEach(s => {
        if (s.en.toLowerCase().includes(q) || s.zh.toLowerCase().includes(q)) {
          results.push({
            type: 'sentence',
            id: s.id,
            title: s.en,
            subtitle: s.zh,
            time: s.time,
            videoId: '', // Not strictly tracked in mock if arbitrary
          });
        }
      });
      resolve(results);
    }, 300);
  });
};

export const searchVocab = async (query: string): Promise<SearchResult[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query || query.trim() === '') return resolve([]);
      const q = query.toLowerCase();
      const results: SearchResult[] = MOCK_VOCAB
        .filter(w => w.word.toLowerCase().includes(q) || w.trans.toLowerCase().includes(q) || w.mean.toLowerCase().includes(q))
        .map(w => ({
          type: 'vocab',
          id: w.id,
          title: w.word,
          subtitle: `${w.pos} ${w.trans}`,
        }));
      resolve(results);
    }, 300);
  });
};
