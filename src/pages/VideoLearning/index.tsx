import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { TranscriptList } from './components/TranscriptList';
import { ActionBar } from './components/ActionBar';
import { Transcript, VideoInfo } from '../../types';
import { fetchTranscripts, fetchVideoInfo, toggleFavoriteTranscript } from '@api/index';
import { fetchVocabularyData } from '@api/general';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { WordModal } from '../../components/WordModal';
import { PlaybackSettingsModal } from './components/PlaybackSettingsModal';
import { addCheckIn, toggleFavoriteVideoStorage, isVideoFavorite, getCheckIns, getLocalDayStr, saveVideoHistory, getVideoTimeFromHistory } from '../../utils/storage';
import { CalendarCheck, Heart, SlidersHorizontal, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';
import { useTranslation } from 'react-i18next';

export type LangMode = 'bilingual' | 'en' | 'zh';

export const VideoLearningPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [langMode, setLangMode] = useState<LangMode>('bilingual');
  const [showHighlights, setShowHighlights] = useState(true);
  const [highlightColor, setHighlightColor] = useState('#D48166');
  const [subtitleSize, setSubtitleSize] = useState<'small' | 'standard' | 'medium' | 'large'>('standard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isMaskActive, setIsMaskActive] = useState(false);
  const [savedWords, setSavedWords] = useState<string[]>([]);

  const cycleLangMode = () => {
    setLangMode(prev => prev === 'bilingual' ? 'en' : prev === 'en' ? 'zh' : 'bilingual');
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

  // Load start time
  const hasSeekedRef = useRef(false);

  const handlePlayerReady = (player: any) => {
    if (hasSeekedRef.current) return;
    
    if (videoInfo && videoInfo.id) {
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
  }, [videoInfo, Math.floor(videoContext.currentTime / 5), videoContext.duration]); // save every 5 seconds rough

  useEffect(() => {
    const today = getLocalDayStr();
    const checkIns = getCheckIns();
    if (checkIns.includes(today)) {
      setIsCheckedIn(true);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [transcriptsData, videoData, vocabData] = await Promise.all([
          fetchTranscripts(id),
          fetchVideoInfo(id),
          fetchVocabularyData()
        ]);
        setTranscripts(transcriptsData);
        setVideoInfo(videoData);
        setSavedWords((vocabData || []).map((v: any) => v.word.toLowerCase()));
        if (videoData) {
          setIsFavorite(isVideoFavorite(videoData.id));
        }
      } catch (err) {
        setError('Failed to load learning materials.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
    addCheckIn();
    setIsCheckedIn(true);
  };

  const handleToggleVideoFavorite = () => {
    if (videoInfo) {
      toggleFavoriteVideoStorage(videoInfo);
      setIsFavorite(isVideoFavorite(videoInfo.id));
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
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
         <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-100 shadow-sm font-medium">
            {error || 'An unexpected error occurred'}
         </div>
      </div>
    );
  }

  if (videoInfo.isVipOnly && (!user || user.role !== 'vip')) {
    return (
      <div className="w-full h-screen bg-[#F5F5F0] text-[#4A4A40] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans relative">
         <Header title={videoInfo.title} rightNode={<></>} />
         <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#E0E0D5] text-center max-w-md w-full">
               <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto mb-6 text-[#E1B12C]">
                  <Lock className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-serif font-bold text-[#5A5A40] mb-2">{t('video.vipContent')}</h2>
               <p className="text-[#848464] mb-8">{t('video.vipDesc')}</p>
               
               {!user ? (
                 <button onClick={() => navigate('/library')} className="bg-[#D48166] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#C27055] transition-colors">
                   {t('video.loginNow')}
                 </button>
               ) : (
                 <button onClick={() => navigate(-1)} className="bg-[#EAEAE0] text-[#5A5A40] px-8 py-3 rounded-xl font-bold hover:bg-[#E0E0D5] transition-colors">
                   {t('video.goBack')}
                 </button>
               )}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#F5F5F0] text-[#4A4A40] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans">
      <Header 
        title={videoInfo.title} 
        rightNode={
          <>
            <button 
              onClick={handleCheckIn} 
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isCheckedIn ? 'text-[#94A684] bg-[#F4F6F1]' : 'hover:bg-[#EAEAE0] hover:text-[#5A5A40]'}`}
            >
              <CalendarCheck className="w-[22px] h-[22px]" />
            </button>
            <button 
              onClick={handleToggleVideoFavorite} 
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isFavorite ? 'text-[#D48166] bg-[#FCF5F3]' : 'hover:bg-[#EAEAE0] hover:text-[#5A5A40]'}`}
            >
              <Heart className={`w-[22px] h-[22px] ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 hover:bg-[#EAEAE0] hover:text-[#5A5A40] rounded-full transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-[22px] h-[22px]" />
            </button>
          </>
        }
      />
      
      <main className="flex-1 flex flex-col lg:flex-row w-full overflow-hidden relative">
         
         <div className="flex-none lg:w-[50%] xl:w-[60%] lg:h-full lg:flex lg:flex-col lg:p-6 lg:gap-6 shrink-0 z-10 transition-all">
            {/* Video Area */}
            <div className="w-full z-20">
              <VideoPlayer 
                videoInfo={videoInfo} 
                {...videoContext} 
                isMaskActive={isMaskActive} 
                totalTranscripts={transcripts.length} 
                onPlayerReady={handlePlayerReady}
              />
            </div>

            {/* Desktop Action Bar */}
            <div className="hidden lg:flex w-full mt-auto rounded-[32px] overflow-hidden border border-[#E0E0D5] shadow-sm bg-white shrink-0">
              <ActionBar {...videoContext} langMode={langMode} cycleLangMode={cycleLangMode} showHighlights={showHighlights} toggleHighlights={toggleHighlights} isMaskActive={isMaskActive} toggleMask={() => setIsMaskActive(!isMaskActive)} />
            </div>
         </div>

         {/* Transcript Column - Scrollable */}
         <div className="flex-1 lg:h-full lg:overflow-hidden relative lg:bg-white lg:rounded-[32px] lg:m-6 lg:ml-0 lg:shadow-sm lg:border border-[#E0E0D5]">
           <div className="h-full absolute inset-0">
             <TranscriptList 
               transcripts={transcripts} 
               currentTime={videoContext.currentTime}
               onSeek={videoContext.seek}
               onToggleFavorite={handleToggleFavorite}
               onWordClick={(w) => setSelectedWord(w)}
               langMode={langMode}
               showHighlights={showHighlights}
               isMaskActive={isMaskActive}
               savedWords={savedWords}
               highlightColor={highlightColor}
               subtitleSize={subtitleSize}
             />
           </div>
         </div>
      </main>

      {/* Mobile Action Bar Fixed Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white">
         <ActionBar {...videoContext} langMode={langMode} cycleLangMode={cycleLangMode} showHighlights={showHighlights} toggleHighlights={toggleHighlights} isMaskActive={isMaskActive} toggleMask={() => setIsMaskActive(!isMaskActive)} />
      </div>

      <WordModal 
        isOpen={!!selectedWord} 
        onClose={() => setSelectedWord(null)} 
        word={selectedWord || ''} 
        onWordSaved={(w) => setSavedWords(prev => [...prev, w.toLowerCase()])}
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
      />
    </div>
  );
};

