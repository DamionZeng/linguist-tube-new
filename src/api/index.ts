import { Transcript, VideoInfo } from '../types';
import { getStoredToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 默认请求超时时间（毫秒）
const DEFAULT_TIMEOUT_MS = 15000;

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function apiGet<T>(path: string, auth: boolean = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  const { signal, clear } = withTimeout(DEFAULT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers, signal });
  } catch (e) {
    clear();
    if ((e as Error).name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    throw e;
  }
  clear();
  const json: ApiResponse<T> = await res.json();
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
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
  const { signal, clear } = withTimeout(DEFAULT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: 'PUT', headers, signal });
  } catch (e) {
    clear();
    if ((e as Error).name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    throw e;
  }
  clear();
  const json: ApiResponse<T> = await res.json();
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
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

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');

  const res = await fetch(`${BASE_URL}/api/speech/transcribe`, {
    method: 'POST',
    body: formData,
  });

  const json: ApiResponse<{ text: string }> = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || 'Speech recognition failed');
  }
  return json.data.text;
};