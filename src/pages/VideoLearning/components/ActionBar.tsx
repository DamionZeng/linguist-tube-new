import React, { useState } from 'react';
import { Languages, Repeat, RefreshCcw, BookOpen, Mic, ChevronDown, ChevronUp, SkipBack, Play, Pause, SkipForward, EyeOff, Eye, Heart } from 'lucide-react';
import { LangMode } from '../index';
import { useTranslation } from 'react-i18next';

export type DisplayMode = 'normal' | 'hidden';

interface ActionBarProps {
  isPlaying: boolean;
  togglePlay: () => void;
  step: (amount: number) => void;
  stepTranscript: (direction: 1 | -1) => void;
  repeatTranscript: () => void;
  seek: (t: number) => void;
  currentTime: number;
  duration: number;
  playbackRate: number;
  cyclePlaybackRate: () => void;
  isLooping: boolean;
  setIsLooping: (v: boolean) => void;
  langMode: LangMode;
  cycleLangMode: () => void;
  buffered?: number;
  videoDisplayMode?: DisplayMode;
  onCycleDisplayMode?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPractice?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ 
  isPlaying, togglePlay, step, stepTranscript, repeatTranscript, seek, currentTime, duration, playbackRate, cyclePlaybackRate, isLooping, setIsLooping, langMode, cycleLangMode, buffered = 0, videoDisplayMode = 'normal', onCycleDisplayMode, isFavorite, onToggleFavorite, onPractice
}) => {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;
  
  const getDisplayModeIcon = () => {
    return videoDisplayMode === 'hidden' ? <Eye className="w-[22px] h-[22px]" /> : <EyeOff className="w-[22px] h-[22px]" />;
  };

  const getDisplayModeLabel = () => {
    return videoDisplayMode === 'hidden' ? t('video.show') : t('video.hide');
  };

  const getLangLabel = () => {
    switch(langMode) {
      case 'bilingual': return t('video.bilingual');
      case 'en': return t('video.english');
      case 'zh': return t('video.chinese');
      case 'none': return t('video.noSubtitle');
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#151B25] border-t border-[#E0E0D5] dark:border-[#1E293B] flex flex-col pt-1.5 pb-safe z-50">
       {/* Top Row: Tools */}
       {isExpanded && (
         <div className="flex items-center justify-around px-2 pb-1.5 border-b border-[#E0E0D5]/50 dark:border-[#1E293B]/50">
           <ToolButton icon={<Languages className="w-[22px] h-[22px]" />} label={getLangLabel()} onClick={cycleLangMode} />
           <ToolButton 
              icon={<span className="font-bold text-[15px]">{playbackRate}x</span>} 
              label={t('video.speed')} 
              onClick={cyclePlaybackRate} 
           />
           <ToolButton 
              icon={<span className="font-bold text-[14px] tracking-tight border-2 border-current rounded px-0.5 pb-[1px]">AB</span>} 
              label={t('video.repeat')} 
              onClick={repeatTranscript}
           />
           <ToolButton 
              icon={<RefreshCcw className={`w-[20px] h-[20px] ${isLooping ? 'text-[#D48166]' : ''}`} />} 
              label={t('video.loop')} 
              onClick={() => setIsLooping(!isLooping)} 
              active={isLooping} 
           />
           <ToolButton 
              icon={getDisplayModeIcon()} 
              label={getDisplayModeLabel()} 
              onClick={onCycleDisplayMode}
              active={videoDisplayMode === 'hidden'}
           />
           <ToolButton icon={<Mic className="w-[22px] h-[22px]" />} label={t('video.practice')} onClick={onPractice} />
         </div>
       )}

       {/* Sub Progress bar */}
       <div className="w-full pt-1 px-5 flex flex-col gap-1 -mt-[2px] z-10">
         <div className="flex items-center justify-between text-[#8A8A7A] text-[10px] font-mono font-medium px-1">
            <span>{Math.floor(currentTime / 60).toString().padStart(2, '0')}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
            <span>{duration ? `${Math.floor(duration / 60).toString().padStart(2, '0')}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '00:00'}</span>
         </div>
         <div className="relative h-2 w-full group cursor-pointer" onClick={handleProgressClick}>
            <div className="w-full h-1 bg-[#EAEAE0] rounded-full absolute top-[1px]">
               <div className="absolute left-0 top-0 h-1 bg-[#EAEAE0]/80 rounded-full transition-all" style={{ width: `${bufferedPercentage}%`, backgroundColor: '#CBD5E1' }} />
               <div className="absolute left-0 top-0 h-1 bg-[#D48166] rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
            </div>
            <div 
               className="absolute top-[-3px] w-3 h-3 bg-[#D48166] rounded-full shadow-[0_0_10px_rgba(212,129,102,0.5)] border-2 border-white transform transition-all group-hover:scale-125" 
               style={{ left: `calc(${progressPercentage}% - 6px)` }} 
            />
         </div>
       </div>

       {/* Bottom Row: Play Controls */}
       <div className="grid grid-cols-3 items-center px-6 py-1.5">
         <button 
           onClick={() => setIsExpanded(!isExpanded)} 
           className="text-[#8A8A7A] dark:text-[#64748B] hover:text-[#4A4A40] dark:hover:text-[#E2E8F0] p-1.5 -ml-2 rounded-full hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] transition-colors justify-self-start"
         >
            {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
         </button>
         
         <div className="flex items-center justify-center gap-6">
            <button onClick={() => stepTranscript(-1)} className="text-[#4A4A40] dark:text-[#CBD5E1] hover:text-[#D48166] dark:hover:text-[#D48166] transition-colors active:scale-95 transform">
               <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button onClick={togglePlay} className="w-12 h-12 shrink-0 bg-[#5A5A40] dark:bg-[#334155] hover:bg-[#4A4A40] dark:hover:bg-[#1E293B] rounded-full flex items-center justify-center shadow-md text-white transition-all transform hover:scale-105 active:scale-95">
               {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
            </button>
            <button onClick={() => stepTranscript(1)} className="text-[#4A4A40] dark:text-[#CBD5E1] hover:text-[#D48166] dark:hover:text-[#D48166] transition-colors active:scale-95 transform">
               <SkipForward className="w-5 h-5 fill-current" />
            </button>
         </div>

         <button 
            onClick={onToggleFavorite} 
            className={`p-1.5 -mr-2 rounded-full transition-colors justify-self-end ${isFavorite ? 'text-[#D48166] bg-[#FCF5F3]' : 'text-[#8A8A7A] dark:text-[#64748B] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] hover:text-[#5A5A40] dark:hover:text-[#E2E8F0]'}`}
         >
            <Heart className={`w-[22px] h-[22px] ${isFavorite ? 'fill-current' : ''}`} />
         </button>
       </div>
    </div>
  );
};

const ToolButton = ({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-2 py-1 transition-all group active:scale-95 cursor-pointer ${active ? 'text-[#D48166]' : 'text-[#8A8A7A] hover:text-[#D48166]'}`}>
    <div className="w-7 h-7 flex items-center justify-center group-hover:-translate-y-0.5 transition-transform">
      {icon}
    </div>
    <span className={`text-[11px] font-bold tracking-wide transition-colors ${active ? 'text-[#D48166]' : 'group-hover:text-[#D48166]'}`}>{label}</span>
  </button>
);
