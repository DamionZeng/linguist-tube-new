export const getLocalDayStr = (date = new Date()) => {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0');
};

export const getCheckIns = (): string[] => {
  const data = localStorage.getItem('checkins');
  return data ? JSON.parse(data) : [];
};

export const addCheckIn = () => {
  const checkins = getCheckIns();
  const today = getLocalDayStr();
  if (!checkins.includes(today)) {
    checkins.push(today);
    localStorage.setItem('checkins', JSON.stringify(checkins));
    window.dispatchEvent(new Event('checkins-updated'));
  }
};

export const getFavoriteVideos = (): any[] => {
  const data = localStorage.getItem('favorite_videos');
  return data ? JSON.parse(data) : [];
};

export const toggleFavoriteVideoStorage = (video: any) => {
  const favorites = getFavoriteVideos();
  const existingIndex = favorites.findIndex(v => v.id === video.id);
  
  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
  } else {
    favorites.unshift(video);
  }
  
  localStorage.setItem('favorite_videos', JSON.stringify(favorites));
  window.dispatchEvent(new Event('favorites-updated'));
};

export const isVideoFavorite = (id: string) => {
  return getFavoriteVideos().some(v => v.id === id);
};

export const getVideoHistory = (): any[] => {
  const data = localStorage.getItem('video_history');
  return data ? JSON.parse(data) : [];
};

export const saveVideoHistory = (videoInfo: any, currentTime: number, duration: number) => {
  if (!videoInfo || !videoInfo.id) return;
  const history = getVideoHistory();
  const existingIndex = history.findIndex(v => v.id === videoInfo.id);
  
  if (existingIndex >= 0) {
    history.splice(existingIndex, 1);
  }

  const progress = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  
  history.unshift({
    ...videoInfo,
    currentTime,
    progress,
    lastWatched: getLocalDayStr()
  });

  localStorage.setItem('video_history', JSON.stringify(history));
  window.dispatchEvent(new Event('history-updated'));
};

export const getVideoTimeFromHistory = (id: string): number => {
  const history = getVideoHistory();
  const found = history.find(v => v.id === id);
  return found ? found.currentTime || 0 : 0;
};
