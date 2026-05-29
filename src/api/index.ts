import { Transcript, VideoInfo } from '../types';
import { mockTranscripts, mockVideoInfo } from '../mocks/transcript';
import { MOCK_FAVORITE_SENTENCES, MOCK_EXPLORE_VIDEOS } from '../mocks/general';

export const fetchTranscripts = async (id?: string): Promise<Transcript[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockTranscripts);
    }, 600);
  });
};

export const fetchVideoInfo = (id?: string): Promise<VideoInfo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (id?.startsWith('yt-')) {
        resolve({
          id,
          title: 'YouTube News Report',
          thumbnail: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
          videoUrl: `https://www.youtube.com/watch?v=${id.replace('yt-', '')}`,
          duration: '05:00',
          index: 1,
          total: 1,
          isVipOnly: false
        });
      } else {
        const matchingVideo = MOCK_EXPLORE_VIDEOS.find(v => v.id === id);
        resolve({
          ...mockVideoInfo,
          title: matchingVideo?.title || mockVideoInfo.title,
          isVipOnly: matchingVideo?.isVipOnly || false
        });
      }
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
