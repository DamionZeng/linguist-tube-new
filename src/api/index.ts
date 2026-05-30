import { Transcript, VideoInfo } from '../types';
import { getStoredToken } from './auth';

const BASE_URL = 'http://localhost:8000';

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

async function apiGet<T>(path: string, auth: boolean = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

async function apiPut<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { method: 'PUT', headers });
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

export const fetchTranscripts = async (id?: string): Promise<Transcript[]> => {
  const videoId = id || 'v1';
  return apiGet(`/api/video/${videoId}/transcripts`, false);
};

export const fetchVideoInfo = async (id?: string): Promise<VideoInfo> => {
  const videoId = id || 'v1';
  return apiGet(`/api/video/${videoId}/info`, false);
};

export const toggleFavoriteTranscript = async (id: string): Promise<boolean> => {
  return apiPut(`/api/video/transcript/${id}/favorite`);
};