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
}

export const TranscriptItem: React.FC<TranscriptItemProps> = ({ transcript, isActive, onSeek, onToggleFavorite, onWordClick, forwardRef, langMode, showHighlights }) => {
  return (
    <div 
      ref={forwardRef}
      onClick={onSeek}
      className={`p-4 mb-3 transition-all duration-300 cursor-pointer group border rounded-xl ${
      isActive 
        ? 'bg-[#E8F0FE] border-[#8AB4F8]' 
        : 'bg-white border-[#E0E0D5] hover:border-[#8AB4F8]/50 hover:bg-[#F8FAFC] shadow-sm'
    }`}>
      <div className="flex justify-between items-center mb-2.5">
        <span className={`text-[11px] font-mono font-bold tracking-wider ${isActive ? 'text-[#8AB4F8]' : 'text-[#D0D0CE]'}`}>
          {transcript.startTime}
        </span>
        <button 
           onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
           className={`p-1 -mr-1 transition-all ${isActive || transcript.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${transcript.isFavorite ? 'text-[#4169E1]' : 'text-[#8AB4F8] hover:text-[#4169E1]'}`}
        >
          <Star className={`w-5 h-5 ${transcript.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="flex flex-col gap-2">
        {(langMode === 'bilingual' || langMode === 'en') && (
          <p className={`text-[15px] font-bold leading-snug tracking-tight ${isActive ? 'text-black' : 'text-[#111111]'}`}>
            {renderHighlightedText(transcript.en, transcript.highlights, onWordClick, showHighlights)}
          </p>
        )}
        {(langMode === 'bilingual' || langMode === 'zh') && (
          <p className={`text-[13px] leading-snug ${isActive ? 'text-[#6A6A5A]' : 'text-[#8A8A7A]'}`}>
            {renderHighlightedText(transcript.zh, transcript.highlights, onWordClick, showHighlights)}
          </p>
        )}
      </div>
    </div>
  );
};
