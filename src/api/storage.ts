import { getStoredToken } from '../api/auth';

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
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
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

export interface CheckInItem {
  date: string;
  videoId: string | null;
}

interface CheckInVideoItem {
  id: string;
  title: string;
  titleZh: string | null;
  duration: string | null;
  level: string | null;
  thumb: string | null;
  tag: string | null;
}

let _checkinsCache: CheckInItem[] = (() => {
  try {
    const raw = localStorage.getItem('checkins');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.length > 0 && typeof parsed[0] === 'string') {
      return (parsed as string[]).map(d => ({ date: d, videoId: '' }));
    }
    return parsed;
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

export function clearStorageCache(): void {
  _checkinsCache = [];
  _favVideosCache = [];
  _videoHistoryCache = [];
  localStorage.removeItem('checkins');
  localStorage.removeItem('favorite_videos');
  localStorage.removeItem('video_history');
}

export async function initHistoryFromServer(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;

  try {
    const history = await apiGet<any[]>('/api/history');
    _videoHistoryCache = history;
    persistVideoHistoryCache();
  } catch { /* keep cache */ }
}

export async function initStorageFromServer(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;

  try {
    const checkins = await apiGet<CheckInItem[]>('/api/checkin');
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
  const dates = new Set<string>();
  for (const item of _checkinsCache) {
    dates.add(item.date);
  }
  return Array.from(dates);
};

export const getCheckInDetails = (): CheckInItem[] => {
  return _checkinsCache;
};

export const isVideoCheckedIn = (videoId: string): boolean => {
  const today = getLocalDayStr();
  return _checkinsCache.some(item => item.date === today && item.videoId === videoId);
};

export const addCheckIn = (videoId: string): void => {
  const today = getLocalDayStr();
  if (_checkinsCache.some(item => item.date === today && item.videoId === videoId)) return;

  _checkinsCache.push({ date: today, videoId });
  persistCheckinsCache();
  window.dispatchEvent(new Event('checkins-updated'));

  const token = getStoredToken();
  if (token) {
    apiPost('/api/checkin', { videoId }).catch((err) => {
      console.error('Check-in API failed:', err);
    });
  }
};

export const getCheckInVideosByDate = async (date: string): Promise<CheckInVideoItem[]> => {
  const token = getStoredToken();
  if (token) {
    try {
      return await apiGet<CheckInVideoItem[]>(`/api/checkin/${date}`);
    } catch {
      return [];
    }
  }
  const videoIds = _checkinsCache
    .filter(item => item.date === date && item.videoId)
    .map(item => item.videoId);
  return videoIds.map(vid => {
    const hist = _videoHistoryCache.find(v => v.id === vid);
    return {
      id: vid,
      title: hist?.title || '',
      titleZh: hist?.titleZh || null,
      duration: hist?.duration || null,
      level: hist?.level || null,
      thumb: hist?.thumb || null,
      tag: hist?.tag || null,
    };
  });
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

  const token = getStoredToken();
  if (token) {
    apiPost(`/api/favorites/videos/${video.id}/toggle`).catch(() => {});
  }
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

  const token = getStoredToken();
  if (token) {
    apiPost('/api/history', { videoId: videoInfo.id, progress, lastWatched }).catch(() => {});
  }
};

export const getVideoTimeFromHistory = (id: string): number => {
  const found = _videoHistoryCache.find(v => v.id === id);
  return found ? found.currentTime || 0 : 0;
};
