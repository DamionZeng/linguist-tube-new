import { 
  MOCK_CAROUSEL_ITEMS, MOCK_CATEGORIES, MOCK_EXPLORE_VIDEOS, MOCK_HISTORY, MOCK_VOCAB, MOCK_FAVORITE_SENTENCES
} from '../mocks/general';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchExploreData = async () => {
  await delay(500);
  return { categories: MOCK_CATEGORIES, videos: MOCK_EXPLORE_VIDEOS, carousel: MOCK_CAROUSEL_ITEMS };
};

export const fetchLibraryData = async () => {
  await delay(500);
  return { vocab: MOCK_VOCAB, history: MOCK_HISTORY, stats: { streak: 3, words: 120, sentences: 45, hours: 12 } };
};

export const fetchHistoryData = async () => {
  await delay(500);
  return MOCK_HISTORY;
};

export const fetchVocabularyData = async () => {
  await delay(500);
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
