import { 
  MOCK_CAROUSEL_ITEMS, MOCK_CATEGORIES, MOCK_EXPLORE_VIDEOS, MOCK_HISTORY, MOCK_VOCAB, MOCK_FAVORITE_SENTENCES
} from '../mocks/general';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchExploreData = async (
  _offset: number = 0,
  _limit: number = 20,
  _category?: string,
  _sourceType?: string,
  _level?: string,
  _durationRange?: string,
) => {
  await delay(500);
  return {
     categories: MOCK_CATEGORIES,
     videos: MOCK_EXPLORE_VIDEOS,
     carousel: MOCK_CAROUSEL_ITEMS,
     total: MOCK_EXPLORE_VIDEOS.length,
     hasMore: false,
   };
};

export const fetchLibraryData = async () => {
  await delay(500);
  return { vocab: MOCK_VOCAB, history: MOCK_HISTORY, stats: { streak: 3, words: 120, sentences: 45, hours: 12 } };
};

export const fetchHistoryData = async () => {
  await delay(500);
  return MOCK_HISTORY;
};

export const fetchVocabularyData = async (ids?: string[]) => {
  await delay(500);
  if (ids && ids.length > 0) {
    return MOCK_VOCAB.filter(v => ids.includes(v.id));
  }
  return MOCK_VOCAB;
};

export const fetchFavoritesData = async () => {
  await delay(500);
  return { videos: MOCK_EXPLORE_VIDEOS.slice(0, 2), sentences: MOCK_FAVORITE_SENTENCES };
};

export const fetchWordLookup = async (word: string) => {
  await delay(300);
  return {
    word,
    notFound: false,
    bookId: "b1",
    ukphone: "/tes/",
    usphone: "/tes/",
    ukspeech: "", 
    usspeech: "",
    translations: [{ pos: "n.", tran_cn: "测试" }],
    phrases: [{ p_content: "test out", p_cn: "测验" }],
    relWords: [],
    sentences: [{ s_content: "This is a test.", s_cn: "这是一个测试。" }],
    synonyms: []
  };
};

export const addFavoriteSentence = async (sentence: any) => {
  await delay(300);
  return true;
};

export const removeFavoriteSentence = async (id: string) => {
  await delay(300);
  return true;
};

export const addVocabularyWord = async (wordDetails: any) => {
  await delay(300);
  MOCK_VOCAB.push({
    id: `w${Date.now()}`,
    added: 'Just now',
    mastery: 1,
    masteryScore: 1.0,
    lastReviewedAt: null,
    reviewCount: 0,
    ...wordDetails,
  });
  return true;
};

export const deleteVocabularyWord = async (vocabId: string) => {
  await delay(300);
  return true;
};

export const batchDeleteVocabularyWords = async (ids: string[]) => {
  await delay(300);
  return true;
};

export const updateVocabMastery = async (vocabId: string, direction: number) => {
  await delay(300);
  const vocab = MOCK_VOCAB.find(v => v.id === vocabId);
  if (!vocab) throw new Error('Not found');
  const newScore = direction > 0
    ? Math.min(5.0, vocab.masteryScore + 0.5)
    : Math.max(1.0, vocab.masteryScore - 0.5);
  const newMastery = Math.max(1, Math.min(5, Math.round(newScore)));
  vocab.masteryScore = newScore;
  vocab.mastery = newMastery;
  vocab.lastReviewedAt = new Date().toISOString();
  vocab.reviewCount++;
  return { mastery: newMastery, masteryScore: newScore, reviewCount: vocab.reviewCount };
};

export const fetchRecommendedVocab = async (limit: number = 20) => {
  await delay(500);
  const scored = MOCK_VOCAB.map(v => {
    const now = Date.now();
    const lastReview = v.lastReviewedAt ? new Date(v.lastReviewedAt).getTime() : 0;
    const added = v.added === 'Just now' ? now : (v.added ? new Date(v.added).getTime() : now);
    const ref = lastReview || added;
    const overdueDays = (now - ref) / 86400000;
    const priority = (6 - v.mastery) * 3.0 + overdueDays * 1.0;
    return { ...v, priority };
  });
  scored.sort((a, b) => b.priority - a.priority);
  return scored.slice(0, limit);
};
