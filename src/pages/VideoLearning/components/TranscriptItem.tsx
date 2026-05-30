import React from 'react';
import { Star } from 'lucide-react';
import { Transcript } from '../../../types';
import { renderHighlightedText } from '../../../utils/highlight';
import { LangMode } from '../index';

interface TranscriptItemProps {
  transcript: Transcript;
  isActive: boolean;
  onSeek: () => void;
  onToggleFavorite: () => void;
  onWordClick: (word: string) => void;
  forwardRef: React.Ref<HTMLDivElement>;
  langMode: LangMode;
  showHighlights: boolean;
  isMaskActive?: boolean;
}

export const TranscriptItem: React.FC<TranscriptItemProps> = ({ transcript, isActive, onSeek, onToggleFavorite, onWordClick, forwardRef, langMode, showHighlights, isMaskActive }) => {
  return (
    <div 
      ref={forwardRef}
      onClick={onSeek}
      className={`p-4 mb-3 transition-all duration-300 cursor-pointer group border rounded-xl ${
      isActive 
        ? 'bg-[#EAEAE0] border-[#D48166] dark:bg-[#1E293B] dark:border-[#D48166]' 
        : 'bg-white border-[#E0E0D5] hover:border-[#D48166]/30 hover:bg-[#F9F9F7] shadow-sm dark:bg-[#151B25] dark:border-[#1E293B] dark:hover:bg-[#1C222C]'
    }`}>
      <div className="flex justify-between items-center mb-2.5">
        <span className={`text-[11px] font-mono font-bold tracking-wider ${isActive ? 'text-[#D48166]' : 'text-[#D0D0CE] dark:text-[#475569]'}`}>
          {transcript.startTime}
        </span>
        <button 
           onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
           className={`p-1 -mr-1 transition-all ${isActive || transcript.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${transcript.isFavorite ? 'text-[#D48166]' : 'text-[#D0D0CE] hover:text-[#D48166] dark:text-[#475569] dark:hover:text-[#D48166]'}`}
        >
          <Star className={`w-5 h-5 ${transcript.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className={`flex flex-col gap-2 transition-all duration-300 ${isMaskActive ? 'blur-md opacity-30 select-none pointer-events-none' : ''}`}>
        {(langMode === 'bilingual' || langMode === 'en') && (
          <p className={`text-[15px] font-bold leading-snug tracking-tight ${isActive ? 'text-black dark:text-[#F8FAFC]' : 'text-[#111111] dark:text-[#94A3B8]'}`}>
            {renderHighlightedText(transcript.en, transcript.highlights, onWordClick, showHighlights)}
          </p>
        )}
        {(langMode === 'bilingual' || langMode === 'zh') && (
          <p className={`text-[13px] leading-snug ${isActive ? 'text-[#6A6A5A] dark:text-[#CBD5E1]' : 'text-[#8A8A7A] dark:text-[#64748B]'}`}>
            {renderHighlightedText(transcript.zh, transcript.highlights, onWordClick, showHighlights)}
          </p>
        )}
      </div>
    </div>
  );
};
