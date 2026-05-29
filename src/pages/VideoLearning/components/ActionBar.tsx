import React from 'react';
import { Languages, Repeat, RefreshCcw, BookOpen, Mic, ChevronDown, SkipBack, Play, Pause, SkipForward, EyeOff } from 'lucide-react';
import { LangMode } from '../index';

interface ActionBarProps {
  isPlaying: boolean;
  togglePlay: () => void;
  step: (amount: number) => void;
  seek: (t: number) => void;
  currentTime: number;
  duration: number;
  playbackRate: number;
  cyclePlaybackRate: () => void;
  isLooping: boolean;
  setIsLooping: (v: boolean) => void;
  langMode: LangMode;
  cycleLangMode: () => void;
  showHighlights: boolean;
  toggleHighlights: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ 
  isPlaying, togglePlay, step, seek, currentTime, duration, playbackRate, cyclePlaybackRate, isLooping, setIsLooping, langMode, cycleLangMode, showHighlights, toggleHighlights
}) => {

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const getLangLabel = () => {
    switch(langMode) {
      case 'bilingual': return '双语';
      case 'en': return '英语';
      case 'zh': return '中文';
    }
  };

  return (
    <div className="w-full bg-white border-t border-[#E0E0D5] flex flex-col pt-3 pb-safe z-50">
       {/* Top Row: Tools */}
       <div className="flex items-center justify-around px-2 pb-3.5 border-b border-[#E0E0D5]/50">
         <ToolButton icon={<Languages className="w-[22px] h-[22px]" />} label={getLangLabel()} onClick={cycleLangMode} />
         <ToolButton 
            icon={<span className="font-bold text-[15px]">{playbackRate}x</span>} 
            label="倍速" 
            onClick={cyclePlaybackRate} 
         />
         <ToolButton icon={<span className="font-bold text-[14px] tracking-tight border-2 border-current rounded px-0.5 pb-[1px]">AB</span>} label="复读" />
         <ToolButton 
            icon={<RefreshCcw className={`w-[20px] h-[20px] ${isLooping ? 'text-[#D48166]' : ''}`} />} 
            label="循环" 
            onClick={() => setIsLooping(!isLooping)} 
            active={isLooping} 
         />
         <ToolButton 
            icon={<BookOpen className={`w-[22px] h-[22px] ${showHighlights ? 'text-[#D48166]' : ''}`} />} 
            label="查词" 
            onClick={toggleHighlights}
            active={showHighlights}
         />
         <ToolButton icon={<Mic className="w-[22px] h-[22px]" />} label="练习" />
       </div>

       {/* Sub Progress bar */}
       <div className="w-full pt-1 px-5 relative h-2 group cursor-pointer -mt-[2px] z-10" onClick={handleProgressClick}>
          <div className="w-full h-1 bg-[#EAEAE0] rounded-full">
             <div className="h-1 bg-[#D48166] rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
          </div>
          <div 
             className="absolute top-[2px] w-3 h-3 bg-[#D48166] rounded-full shadow-[0_0_10px_rgba(212,129,102,0.5)] border-2 border-white transform transition-all group-hover:scale-125" 
             style={{ left: `calc(${progressPercentage}% + 12px)` }} 
          />
       </div>

       {/* Bottom Row: Play Controls */}
       <div className="flex items-center justify-between px-6 py-4">
         <button className="text-[#8A8A7A] hover:text-[#4A4A40] p-2 -ml-2 rounded-full hover:bg-[#EAEAE0] transition-colors">
            <ChevronDown className="w-[26px] h-[26px]" />
         </button>
         
         <div className="flex items-center justify-center gap-8">
            <button onClick={() => step(-5)} className="text-[#4A4A40] hover:text-[#D48166] transition-colors active:scale-95 transform">
               <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <button onClick={togglePlay} className="w-14 h-14 bg-[#5A5A40] hover:bg-[#4A4A40] rounded-full flex items-center justify-center shadow-lg text-white transition-all transform hover:scale-105 active:scale-95">
               {isPlaying ? <Pause className="w-[26px] h-[26px] fill-current" /> : <Play className="w-[26px] h-[26px] ml-1 fill-current" />}
            </button>
            <button onClick={() => step(5)} className="text-[#4A4A40] hover:text-[#D48166] transition-colors active:scale-95 transform">
               <SkipForward className="w-6 h-6 fill-current" />
            </button>
         </div>

         <button className="text-[#8A8A7A] hover:text-[#4A4A40] p-2 -mr-2 rounded-full hover:bg-[#EAEAE0] transition-colors">
            <EyeOff className="w-6 h-6" />
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
