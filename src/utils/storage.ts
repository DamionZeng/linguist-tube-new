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
