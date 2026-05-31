import { getStoredToken } from './auth';

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
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

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
  if (!query || query.trim() === '') return [];
  return apiGet(`/api/search?q=${encodeURIComponent(query)}&scope=explore`);
};

export const searchHistory = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim() === '') return [];
  return apiGet(`/api/search?q=${encodeURIComponent(query)}&scope=history`);
};

export const searchFavorites = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim() === '') return [];
  return apiGet(`/api/search?q=${encodeURIComponent(query)}&scope=favorites`);
};

export const searchVocab = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim() === '') return [];
  return apiGet(`/api/search?q=${encodeURIComponent(query)}&scope=vocab`);
};
