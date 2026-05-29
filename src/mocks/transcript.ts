import { Transcript, VideoInfo } from '../types';

export const mockVideoInfo: VideoInfo = {
  id: 'v1',
  title: 'Tears of Steel (Sample Video)',
  thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
  videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  duration: '12:14',
  index: 1,
  total: 5
};

export const mockTranscripts: Transcript[] = [
  {
    id: '1',
    startTime: '00:00',
    endTime: '00:05',
    en: 'Testing actual video playback with network URL.',
    zh: '正在使用网络URL测试实际的视频播放。',
    highlights: [{ word: 'network', color: 'text-[#D48166]' }],
    isFavorite: false,
  },
  {
    id: '2',
    startTime: '00:05',
    endTime: '00:10',
    en: 'Please listen to the actual audio of the video.',
    zh: '请听视频中的实际音频。',
    highlights: [{ word: 'actual', color: 'text-[#94A684]' }],
    isFavorite: false,
  },
  {
    id: '3',
    startTime: '00:10',
    endTime: '00:15',
    en: 'Tears of Steel is an open-source short film.',
    zh: '《钢铁之泪》是一部开源短片。',
    highlights: [],
    isFavorite: false,
  },
  {
    id: '4',
    startTime: '00:15',
    endTime: '00:20',
    en: 'It features real actors and computer generated environments.',
    zh: '它以真实的演员和计算机生成的环境为特色。',
    highlights: [{ word: 'generated', color: 'text-[#D48166]' }, { word: 'environments', color: 'text-[#94A684]' }],
    isFavorite: true,
  },
  {
    id: '5',
    startTime: '00:20',
    endTime: '00:30',
    en: 'You can test the scrolling, highlight, and play features freely.',
    zh: '您可以自由测试滚动、高亮和播放功能。',
    highlights: [{ word: 'scrolling', color: 'text-[#94A684]' }],
    isFavorite: false,
  }
];
