import { mockTranscripts, mockVideoInfo } from '../mocks/transcript';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchTranscripts = async (id?: string) => {
  await delay(500);
  return mockTranscripts;
};

export const fetchVideoInfo = async (id?: string) => {
  await delay(500);
  return mockVideoInfo;
};

export const toggleFavoriteTranscript = async (id: string) => {
  await delay(200);
  return true;
};
