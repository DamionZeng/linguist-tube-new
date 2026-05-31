import { getStoredToken } from '../api/auth';

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

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

export const getLocalDayStr = (date = new Date()): string => {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
};

// ------ cache layer: sync reads from cache, async writes to server ------

let _checkinsCache: string[] = (() => {
  try {
    const raw = localStorage.getItem('checkins');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

function persistCheckinsCache(): void {
  localStorage.setItem('checkins', JSON.stringify(_checkinsCache));
}

let _favVideosCache: any[] = (() => {
  try {
    const raw = localStorage.getItem('favorite_videos');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

function persistFavVideosCache(): void {
  localStorage.setItem('favorite_videos', JSON.stringify(_favVideosCache));
}

let _videoHistoryCache: any[] = (() => {
  try {
    const raw = localStorage.getItem('video_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

function persistVideoHistoryCache(): void {
  localStorage.setItem('video_history', JSON.stringify(_videoHistoryCache));
}

export async function initStorageFromServer(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;

  try {
    const checkins = await apiGet<string[]>('/api/checkin');
    _checkinsCache = checkins;
    persistCheckinsCache();
  } catch { /* keep cache */ }

  try {
    const favVideos = await apiGet<any[]>('/api/favorites/videos');
    _favVideosCache = favVideos;
    persistFavVideosCache();
  } catch { /* keep cache */ }

  try {
    const history = await apiGet<any[]>('/api/history');
    _videoHistoryCache = history;
    persistVideoHistoryCache();
  } catch { /* keep cache */ }
}

export const getCheckIns = (): string[] => {
  return _checkinsCache;
};

export const addCheckIn = (): void => {
  const today = getLocalDayStr();
  if (_checkinsCache.includes(today)) return;

  _checkinsCache.push(today);
  persistCheckinsCache();
  window.dispatchEvent(new Event('checkins-updated'));

  apiPost('/api/checkin').catch(() => {});
};

export const getFavoriteVideos = (): any[] => {
  return _favVideosCache;
};

export const toggleFavoriteVideoStorage = (video: any): void => {
  const idx = _favVideosCache.findIndex((v: any) => v.id === video.id);
  if (idx >= 0) {
    _favVideosCache.splice(idx, 1);
  } else {
    _favVideosCache.unshift(video);
  }
  persistFavVideosCache();
  window.dispatchEvent(new Event('favorites-updated'));

  apiPost(`/api/favorites/videos/${video.id}/toggle`).catch(() => {});
};

export const isVideoFavorite = (id: string): boolean => {
  return _favVideosCache.some((v: any) => v.id === id);
};

export const getVideoHistory = (): any[] => {
  return _videoHistoryCache;
};

export const saveVideoHistory = (videoInfo: any, currentTime: number, duration: number) => {
  if (!videoInfo || !videoInfo.id) return;

  const progress = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  const lastWatched = getLocalDayStr();

  const existingIndex = _videoHistoryCache.findIndex(v => v.id === videoInfo.id);

  if (existingIndex >= 0) {
    _videoHistoryCache.splice(existingIndex, 1);
  }

  _videoHistoryCache.unshift({
    ...videoInfo,
    currentTime,
    progress,
    lastWatched
  });

  persistVideoHistoryCache();
  window.dispatchEvent(new Event('history-updated'));

  apiPost('/api/history', { videoId: videoInfo.id, progress, lastWatched }).catch(() => {});
};

export const getVideoTimeFromHistory = (id: string): number => {
  const found = _videoHistoryCache.find(v => v.id === id);
  return found ? found.currentTime || 0 : 0;
};