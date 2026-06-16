import React, { useEffect, useState, useRef, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { TranscriptList } from './components/TranscriptList';
import { ActionBar } from './components/ActionBar';
import { Transcript, VideoInfo } from '../../types';
import { fetchTranscripts, fetchVideoInfo, toggleFavoriteTranscript } from '@api/index';
import { fetchVocabularyData } from '@api/general';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { WordModal } from '../../components/WordModal';
import { PlaybackSettingsModal } from './components/PlaybackSettingsModal';

// 懒加载 VideoPlayer 减少首屏 JS 体积（react-player 包含多个播放器实现）
const VideoPlayer = lazy(() => import('./components/VideoPlayer').then(m => ({ default: m.VideoPlayer })));
import { useLocalized } from '../../hooks/useLocalized';
import { CelebrationModal } from './components/CelebrationModal';
import { PracticeModeModal } from './components/PracticeModeModal';
import { DisplayMode } from './components/ActionBar';
import { addCheckIn, toggleFavoriteVideoStorage, isVideoFavorite, isVideoCheckedIn, saveVideoHistory, getVideoTimeFromHistory } from '@api/storage';
import { CalendarCheck, Heart, SlidersHorizontal, Lock, Maximize } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';
import { useTranslation } from 'react-i18next';

export type LangMode = 'bilingual' | 'en' | 'zh' | 'none';

export const VideoLearningPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { title: locTitle } = useLocalized();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [langMode, setLangMode] = useState<LangMode>('bilingual');
  const [showHighlights, setShowHighlights] = useState(true);
  const [highlightColor, setHighlightColor] = useState('#2182c1');
  const [subtitleSize, setSubtitleSize] = useState<'small' | 'standard' | 'medium' | 'large'>('standard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isMaskActive, setIsMaskActive] = useState(false);
  const [videoDisplayMode, setVideoDisplayMode] = useState<DisplayMode>('normal');
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [savedPhrases, setSavedPhrases] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const cycleDisplayMode = () => {
    setVideoDisplayMode(prev => prev === 'normal' ? 'hidden' : 'normal');
  };

  const cycleLangMode = () => {
    setLangMode(prev => prev === 'bilingual' ? 'en' : prev === 'en' ? 'zh' : prev === 'zh' ? 'none' : 'bilingual');
  };

  const toggleHighlights = () => {
    setShowHighlights(prev => !prev);
  }

  const handleDownloadSubtitles = () => {
    if (!transcripts || transcripts.length === 0) return;
    
    let content = '';
    transcripts.forEach((t, i) => {
      content += `${i + 1}\n`;
      content += `${t.startTime} --> ${t.endTime}\n`;
      if (langMode === 'bilingual' || langMode === 'en') {
        content += `${t.en}\n`;
      }
      if (langMode === 'bilingual' || langMode === 'zh') {
        content += `${t.zh}\n`;
      }
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles-${langMode}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const videoContext = useVideoPlayer(transcripts);

  const activeTranscript = useMemo(() => {
    if (videoContext.activeIndex < 0 || videoContext.activeIndex >= transcripts.length) {
      return { en: '', zh: '', words: undefined };
    }
    const t = transcripts[videoContext.activeIndex];
    return { en: t.en, zh: t.zh, words: t.words };
  }, [videoContext.activeIndex, transcripts]);

  const handleVideoEnded = () => {
    if (videoInfo?.nextVideoId) {
      navigate(`/video/${videoInfo.nextVideoId}`, { replace: true });
    } else {
      navigate('/explore');
    }
  };

  // Load start time
  const hasSeekedRef = useRef(false);

  const handlePlayerReady = (player: any) => {
    if (hasSeekedRef.current) return;
    
    // Only seek if videoInfo matches current route id (avoid stale closure after navigation)
    if (videoInfo && videoInfo.id && videoInfo.id === id) {
      const jumpTimeStr = localStorage.getItem(`jump_time_${videoInfo.id}`);
      let savedTime = 0;
      
      if (jumpTimeStr) {
        savedTime = parseInt(jumpTimeStr, 10);
        localStorage.removeItem(`jump_time_${videoInfo.id}`);
      } else {
        savedTime = getVideoTimeFromHistory(videoInfo.id);
      }

      if (savedTime > 0) {
        player.seekTo(savedTime, 'seconds');
        if (videoContext.setIsPlaying) {
           // Help react-player avoid play/pause interruption collisions by telling it to play after a seek
           videoContext.setIsPlaying(true);
        }
      }
      hasSeekedRef.current = true;
    }
  };

  // Save progress periodically when playing
  useEffect(() => {
    if (videoInfo && videoContext.currentTime > 0) {
      saveVideoHistory(videoInfo, videoContext.currentTime, videoContext.duration);
    }
  }, [videoInfo, Math.floor(videoContext.currentTime / 10), videoContext.duration]); // save every 10 seconds rough

  useEffect(() => {
    if (videoInfo && videoInfo.id) {
      setIsCheckedIn(isVideoCheckedIn(videoInfo.id));
    }
  }, [videoInfo]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [transcriptsData, videoData] = await Promise.all([
          fetchTranscripts(id),
          fetchVideoInfo(id)
        ]);
        setTranscripts(transcriptsData);
        setVideoInfo(videoData);
        if (videoData) {
          setIsFavorite(isVideoFavorite(videoData.id));
        }
        
        // 单独加载词汇表数据，失败不影响页面加载
        try {
          const vocabData = await fetchVocabularyData();
          const phrases: string[] = [];
          const words: string[] = [];
          (vocabData || []).forEach((v: any) => {
            if (v.isPhrase) {
              phrases.push(v.word.toLowerCase());
            } else {
              words.push(v.word.toLowerCase());
            }
          });
          setSavedWords(words);
          setSavedPhrases(phrases);
        } catch (vocabErr) {
          // 词汇表加载失败不设置页面错误，仅保存空数组
          setSavedWords([]);
          setSavedPhrases([]);
        }
      } catch (err) {
        setError(t('error.loadLearningMaterials'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Reset player state when video changes
  useEffect(() => {
    hasSeekedRef.current = false;
    videoContext.setIsPlaying?.(false);
    videoContext.seek?.(0);
  }, [id]);

  const handleToggleFavorite = async (id: string) => {
    setTranscripts(prev => prev.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
    try {
      await toggleFavoriteTranscript(id);
    } catch {
      setTranscripts(prev => prev.map(t => 
        t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
      ));
    }
  };

  const handleCheckIn = () => {
    if (isCheckedIn || !videoInfo?.id) return;
    addCheckIn(videoInfo.id);
    setIsCheckedIn(true);
    setShowCelebration(true);
  };

  const handleToggleVideoFavorite = () => {
    if (videoInfo) {
      toggleFavoriteVideoStorage(videoInfo);
      setIsFavorite(isVideoFavorite(videoInfo.id));
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
      </div>
    );
  }

  if (error || !videoInfo) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#F5F5F0] dark:bg-[#0B0E14]">
         <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-4 rounded-xl border border-red-100 dark:border-red-800 shadow-sm font-medium">
            {error || 'An unexpected error occurred'}
         </div>
      </div>
    );
  }

  if (videoInfo.isVipOnly && (!user || user.role !== 'vip')) {
    return (
      <div className="w-full h-screen bg-[#F5F5F0] dark:bg-[#0B0E14] text-[#4A4A40] dark:text-[#F8FAFC] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans relative">
         <Header title={locTitle(videoInfo)} rightNode={<></>} />
         <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="bg-white dark:bg-[#151B25] p-8 rounded-[32px] shadow-sm border border-[#E0E0D5] dark:border-[#1E293B] text-center max-w-md w-full">
               <div className="w-16 h-16 bg-[#F5F5F0] dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-6 text-[#E1B12C]">
                  <Lock className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#F8FAFC] mb-2">{t('video.vipContent')}</h2>
               <p className="text-[#6A6A5A] dark:text-[#94A3B8] mb-8">{t('video.vipDesc')}</p>
               
               {!user ? (
                 <button onClick={() => navigate('/library')} className="bg-[#D48166] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#C27055] transition-colors">
                   {t('video.loginNow')}
                 </button>
               ) : (
                 <button onClick={() => navigate(-1)} className="bg-[#EAEAE0] dark:bg-[#1E293B] text-[#5A5A40] dark:text-[#F8FAFC] px-8 py-3 rounded-xl font-bold hover:bg-[#E0E0D5] dark:hover:bg-[#334155] transition-colors">
                   {t('video.goBack')}
                 </button>
               )}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#F5F5F0] dark:bg-[#0B0E14] text-[#4A4A40] dark:text-[#F8FAFC] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans" style={{ height: '100dvh' }}>
      <Header 
        title={locTitle(videoInfo)} 
        rightNode={
          <>
            <button 
              onClick={handleCheckIn} 
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isCheckedIn ? 'text-[#94A684] bg-[#F4F6F1] dark:bg-[#1E293B]' : 'hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] hover:text-[#5A5A40] dark:hover:text-[#F8FAFC]'}`}
            >
              <CalendarCheck className="w-[22px] h-[22px]" />
            </button>
            <button 
              onClick={toggleFullScreen} 
              className="p-1.5 hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] hover:text-[#5A5A40] dark:hover:text-[#F8FAFC] rounded-full transition-colors cursor-pointer"
            >
              <Maximize className="w-[22px] h-[22px]" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] hover:text-[#5A5A40] dark:hover:text-[#F8FAFC] rounded-full transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-[22px] h-[22px]" />
            </button>
          </>
        }
      />
      
      <main className="flex-1 flex flex-col lg:flex-row w-full overflow-hidden relative gap-1 lg:gap-0">
         
         {/* Video Area - always rendered so playback continues even when hidden */}
         <div className={`${
           videoDisplayMode === 'hidden'
             ? 'fixed left-[-200vw] top-0'
             : 'flex-none lg:w-1/2 lg:h-full lg:flex lg:flex-col lg:p-6 lg:gap-6 shrink-0 z-10'
         } transition-all`}>
            <div className={`${videoDisplayMode === 'hidden' ? 'w-[640px]' : 'w-full px-3 md:px-5'} z-20`}>
              <Suspense fallback={
                <div className="w-full aspect-video bg-black rounded-2xl flex items-center justify-center">
                  <div className="text-white/60 text-sm">视频播放器加载中...</div>
                </div>
              }>
                <VideoPlayer
                  videoInfo={videoInfo}
                  {...videoContext}
                  isMaskActive={isMaskActive}
                  totalTranscripts={transcripts.length}
                   onPlayerReady={handlePlayerReady}
                   langMode={langMode}
                  activeTranscriptEn={activeTranscript.en}
                  activeTranscriptZh={activeTranscript.zh}
                  activeTranscriptWords={activeTranscript.words}
                  onVideoEnded={handleVideoEnded}
                  onWordClick={(w, s) => { setSelectedWord(w); setSelectedSentence(s || null); }}
                  savedWords={savedWords}
                  savedPhrases={savedPhrases}
                  highlightColor={highlightColor}
                />
              </Suspense>
            </div>

            {/* Desktop Action Bar */}
            {videoDisplayMode === 'normal' && (
            <div className="hidden lg:flex w-full mt-auto rounded-[32px] overflow-hidden border border-[#E0E0D5] dark:border-[#1E293B] shadow-sm bg-white dark:bg-[#151B25] shrink-0">
              <ActionBar {...videoContext} langMode={langMode} cycleLangMode={cycleLangMode} videoDisplayMode={videoDisplayMode} onCycleDisplayMode={cycleDisplayMode} isFavorite={isFavorite} onToggleFavorite={handleToggleVideoFavorite} onPractice={() => setIsPracticeModalOpen(true)} />
            </div>
            )}
         </div>

         {/* Transcript Column - Scrollable */}
         <div className={`${videoDisplayMode === 'hidden' ? 'flex-1 w-full' : 'flex-1 lg:flex-none lg:w-1/2'} lg:h-full lg:overflow-hidden relative lg:bg-white dark:lg:bg-[#151B25] rounded-2xl lg:rounded-[32px] lg:m-6 lg:ml-0 lg:shadow-sm lg:border border-[#E0E0D5] dark:border-[#1E293B]`}>
           <div className="h-full absolute inset-0 lg:rounded-[32px] overflow-hidden">
             <TranscriptList 
               transcripts={transcripts} 
               currentTime={videoContext.currentTime}
               activeIndex={videoContext.activeIndex}
               onSeek={videoContext.seek}
               onToggleFavorite={handleToggleFavorite}
               onWordClick={(w, s) => { setSelectedWord(w); setSelectedSentence(s || null); }}
               langMode={langMode}
               showHighlights={showHighlights}
               savedWords={savedWords}
               savedPhrases={savedPhrases}
               highlightColor={highlightColor}
               subtitleSize={subtitleSize}
             />
           </div>
         </div>
      </main>

      {/* Mobile Action Bar Fixed Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#151B25]" style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom) + 0px)' }}>
         <ActionBar {...videoContext} langMode={langMode} cycleLangMode={cycleLangMode} videoDisplayMode={videoDisplayMode} onCycleDisplayMode={cycleDisplayMode} isFavorite={isFavorite} onToggleFavorite={handleToggleVideoFavorite} onPractice={() => setIsPracticeModalOpen(true)} />
      </div>

      <WordModal 
        isOpen={!!selectedWord} 
        onClose={() => { setSelectedWord(null); setSelectedSentence(null); }} 
        word={selectedWord || ''} 
        sentence={selectedSentence || undefined}
        onWordSaved={(w) => {
          const lower = w.toLowerCase();
          if (w.includes(' ')) {
            setSavedPhrases(prev => [...prev, lower]);
          } else {
            setSavedWords(prev => [...prev, lower]);
          }
        }}
        savedWords={savedWords}
        savedPhrases={savedPhrases}
      />

      <PlaybackSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showHighlights={showHighlights}
        onToggleHighlights={toggleHighlights}
        highlightColor={highlightColor}
        onHighlightColorChange={setHighlightColor}
        subtitleSize={subtitleSize}
        onChangeSubtitleSize={setSubtitleSize}
        onDownloadSubtitles={handleDownloadSubtitles}
        isMaskActive={isMaskActive}
        onToggleMask={() => setIsMaskActive(!isMaskActive)}
      />

      <CelebrationModal 
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />

      <PracticeModeModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        videoId={id!}
        currentTime={videoContext?.currentTime || 0}
      />
    </div>
  );
};


