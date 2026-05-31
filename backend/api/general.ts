import { getStoredToken } from './auth';

const BASE_URL = 'http://localhost:8000';

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

async function apiGet<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

export const fetchExploreData = async (): Promise<{
  categories: string[];
  videos: Array<{
    id: string;
    title: string;
    duration: string | null;
    level: string | null;
    thumb: string | null;
    tag: string | null;
    isVipOnly: boolean;
  }>;
  carousel: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    desc: string | null;
    image: string | null;
    tag: string | null;
  }>;
}> => {
  return apiGet('/api/explore');
};

export const fetchLibraryData = async (): Promise<{
  vocab: Array<{
    id: string;
    word: string;
    phonetic: string | null;
    pos: string | null;
    mean: string | null;
    trans: string | null;
    added: string | null;
    example: string | null;
    exampleTrans: string | null;
  }>;
  history: Array<{
    id: string;
    title: string;
    duration: string | null;
    level: string | null;
    thumb: string | null;
    tag: string | null;
    progress: number;
    lastWatched: string | null;
  }>;
  stats: { streak: number; words: number; sentences: number; hours: number };
}> => {
  return apiGet('/api/library');
};

export const fetchHistoryData = async (): Promise<
  Array<{
    id: string;
    title: string;
    duration: string | null;
    level: string | null;
    thumb: string | null;
    tag: string | null;
    progress: number;
    lastWatched: string | null;
  }>
> => {
  return apiGet('/api/history');
};

export const fetchVocabularyData = async (): Promise<
  Array<{
    id: string;
    word: string;
    phonetic: string | null;
    pos: string | null;
    mean: string | null;
    trans: string | null;
    added: string | null;
    example: string | null;
    exampleTrans: string | null;
  }>
> => {
  return apiGet('/api/vocabulary');
};

export const fetchFavoritesData = async (): Promise<{
  videos: Array<{
    id: string;
    title: string;
    duration: string | null;
    level: string | null;
    thumb: string | null;
    tag: string | null;
    isVipOnly: boolean;
  }>;
  sentences: Array<{
    id: string;
    en: string;
    zh: string;
    videoTitle: string | null;
    time: string | null;
  }>;
}> => {
  return apiGet('/api/favorites');
};

export const fetchWordLookup = async (
  word: string
): Promise<{
  bookId: string | null;
  phrases: Array<{ p_cn: string; p_content: string }>;
  relWords: Array<{ Hwds: Array<{ hwd?: string; tran?: string; word?: string }>; Pos: string }>;
  sentences: Array<{ s_cn: string; s_content: string }>;
  synonyms: Array<{ Hwds: Array<{ hwd?: string; tran?: string; word?: string }>; pos: string; tran: string }>;
  translations: Array<{ pos: string; tran_cn: string }>;
  ukphone: string | null;
  ukspeech: string | null;
  usphone: string | null;
  usspeech: string | null;
  word: string;
}> => {
  return apiGet(`/api/word/${encodeURIComponent(word)}`);
};

export const addFavoriteSentence = async (sentence: {
  en: string;
  zh: string;
  videoTitle?: string;
  time?: string;
}): Promise<boolean> => {
  return apiPost('/api/favorites/sentence', sentence);
};

export const addVocabularyWord = async (wordDetails: {
  word: string;
  phonetic?: string;
  trans?: string;
  pos?: string;
  mean?: string;
  example?: string;
  exampleTrans?: string;
}): Promise<boolean> => {
  return apiPost('/api/vocabulary', wordDetails);
};

async function apiDelete<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

export const removeFavoriteSentence = async (id: string): Promise<boolean> => {
  return apiDelete(`/api/favorites/sentence/${encodeURIComponent(id)}`);
};

