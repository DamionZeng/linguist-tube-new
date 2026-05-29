import { VideoInfo } from '../types';
import { MOCK_CATEGORIES, MOCK_EXPLORE_VIDEOS, MOCK_VOCAB, MOCK_HISTORY, MOCK_FAVORITE_SENTENCES } from '../mocks/general';

export const fetchExploreData = (): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ categories: MOCK_CATEGORIES, videos: MOCK_EXPLORE_VIDEOS }), 500);
  });
};

export const fetchLibraryData = (): Promise<any> => {
  return new Promise((resolve) => {
    // Return partial vocab and history for the library dashboard
    setTimeout(() => resolve({ 
      vocab: MOCK_VOCAB.slice(0, 3), 
      history: MOCK_HISTORY,
      stats: {streak: 12, words: 348, sentences: 56, hours: 24.5} 
    }), 400);
  });
};

export const fetchHistoryData = (): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_HISTORY), 400);
  });
};

export const fetchVocabularyData = (): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_VOCAB), 400);
  });
};

export const fetchFavoritesData = (): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      videos: MOCK_EXPLORE_VIDEOS.slice(0, 2),
      sentences: MOCK_FAVORITE_SENTENCES
    }), 500);
  });
};

export const fetchWordDetails = (word: string): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = MOCK_VOCAB.find(v => v.word.toLowerCase() === word.toLowerCase());
      if (existing) {
        resolve({
          ...existing,
          // map fields correctly if necessary
          example: existing.example || `This is an example for ${word}.`,
          exampleTrans: existing.exampleTrans || '这是一个例句。',
          isSaved: true
        });
        return;
      }

      const isBecause = word.toLowerCase().includes('because');
      if (isBecause) {
        resolve({
          word: 'because', phonetic: "/bɪˈkɒz/", trans: 'conj. 因为', pos: 'conj.', mean: '因为', example: '"We are back home, because we wanted to freshen up a bit,"', exampleTrans: '我们回家了，因为我们想稍微梳洗打扮一下', isSaved: false
        });
      } else {
        resolve({
          word: word, phonetic: `/${word}/`, trans: 'n. 未知词汇', pos: 'n.', mean: '未知词汇', example: `This is an example for ${word}.`, exampleTrans: '这是一个例句。', isSaved: false
        });
      }
    }, 300);
  });
};

export const addFavoriteSentence = (sentence: any): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_FAVORITE_SENTENCES.unshift({
        id: `s${Date.now()}`,
        ...sentence
      });
      resolve(true);
    }, 300);
  });
};

export const addVocabularyWord = (wordDetails: any): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_VOCAB.unshift({
        id: `w${Date.now()}`,
        ...wordDetails,
        added: 'Just now'
      });
      resolve(true);
    }, 300);
  });
};
