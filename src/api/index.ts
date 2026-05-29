import { Transcript, VideoInfo } from '../types';
import { mockTranscripts, mockVideoInfo } from '../mocks/transcript';
import { MOCK_FAVORITE_SENTENCES } from '../mocks/general';

export const fetchTranscripts = (): Promise<Transcript[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockTranscripts);
    }, 600);
  });
};

export const fetchVideoInfo = (): Promise<VideoInfo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockVideoInfo);
    }, 400);
  });
};

export const toggleFavoriteTranscript = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const target = mockTranscripts.find(t => t.id === id);
      if (target) {
        target.isFavorite = !target.isFavorite;
        
        // Update mock favorites array as well
        if (target.isFavorite) {
          MOCK_FAVORITE_SENTENCES.unshift({
            id: target.id,
            en: target.en,
            zh: target.zh,
            videoTitle: mockVideoInfo.title,
            time: target.startTime
          });
        } else {
          const index = MOCK_FAVORITE_SENTENCES.findIndex(s => s.id === target.id);
          if (index !== -1) {
            MOCK_FAVORITE_SENTENCES.splice(index, 1);
          }
        }
      }
      resolve(true);
    }, 200);
  });
};
