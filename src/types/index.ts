export interface Highlight {
  word: string;
  color: string;
}

export interface Transcript {
  id: string;
  startTime: string;
  endTime: string;
  en: string;
  zh: string;
  highlights: Highlight[];
  isFavorite: boolean;
  isActive?: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  currentProgress?: string;
  index: number;
  total: number;
}
