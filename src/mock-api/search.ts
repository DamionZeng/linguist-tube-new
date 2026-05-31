const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  await delay(500);
  if (!query) return [];
  return [{ type: 'video', id: 'v1', title: `Result for ${query}`, thumb: '' }];
};

export const searchHistory = async (query: string): Promise<SearchResult[]> => {
  await delay(500);
  if (!query) return [];
  return [{ type: 'video', id: 'v1', title: `Result for ${query}` }];
};

export const searchFavorites = async (query: string): Promise<SearchResult[]> => {
  await delay(500);
  if (!query) return [];
  return [{ type: 'video', id: 'v1', title: `Result for ${query}` }];
};

export const searchVocab = async (query: string): Promise<SearchResult[]> => {
  await delay(500);
  if (!query) return [];
  return [{ type: 'vocab', id: 'w1', title: `Result for ${query}` }];
};
