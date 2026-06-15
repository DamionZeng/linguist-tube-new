import { getStoredToken } from './auth';
import type { VocabItem, MasteryResult } from '../types/word';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
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
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

async function apiDelete<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
  const json: ApiResponse<T> = await res.json();
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

export const fetchExploreData = async (
  offset: number = 0,
  limit: number = 20,
  category?: string,
  sourceType?: string,
  level?: string,
  durationRange?: string,
): Promise<{
  categories: string[];
  videos: Array<{
    id: string;
    title: string;
    titleZh: string | null;
    duration: string | null;
    level: string | null;
    thumb: string | null;
    tag: string | null;
    category: string | null;
    isVipOnly: boolean;
  }>;
  carousel: Array<{
    id: string;
    title: string;
    titleZh: string | null;
    subtitle: string | null;
    desc: string | null;
    descZh: string | null;
    image: string | null;
    tag: string | null;
  }>;
  total: number;
  hasMore: boolean;
}> => {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  if (category && category !== 'All') {
    params.set('category', category);
  }
  if (sourceType) {
    params.set('source_type', sourceType);
  }
  if (level && level !== 'All') {
    params.set('level', level);
  }
  if (durationRange && durationRange !== 'All') {
    params.set('duration_range', durationRange);
  }
  return apiGet(`/api/explore?${params.toString()}`);
};

export const fetchLibraryData = async (): Promise<{
  vocab: Array<VocabItem>;
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

export const fetchVocabularyData = async (ids?: string[]): Promise<VocabItem[]> => {
  const token = getStoredToken();
  if (!token) {
    return [];
  }
  const query = ids && ids.length > 0 ? `?ids=${ids.join(',')}` : '';
  return apiGet(`/api/vocabulary${query}`);
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
  notFound?: boolean;
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
  isPhrase?: boolean;
  phonetic?: string;
  trans?: string;
  pos?: string;
  mean?: string;
  example?: string;
  exampleTrans?: string;
}): Promise<boolean> => {
  return apiPost('/api/vocabulary', wordDetails);
};

export const deleteVocabularyWord = async (vocabId: string): Promise<boolean> => {
  return apiDelete(`/api/vocabulary/${encodeURIComponent(vocabId)}`);
};

export const batchDeleteVocabularyWords = async (ids: string[]): Promise<boolean> => {
  return apiPost('/api/vocabulary/batch-delete', { ids });
};

export const removeFavoriteSentence = async (id: string): Promise<boolean> => {
  return apiDelete(`/api/favorites/sentence/${encodeURIComponent(id)}`);
};

export const updateVocabMastery = async (vocabId: string, direction: number): Promise<MasteryResult> => {
  return apiPost(`/api/vocabulary/${encodeURIComponent(vocabId)}/mastery`, { direction });
};

export const fetchRecommendedVocab = async (limit: number = 20): Promise<VocabItem[]> => {
  return apiGet(`/api/vocabulary/recommend?limit=${limit}`);
};

