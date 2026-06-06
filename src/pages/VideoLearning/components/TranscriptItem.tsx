import React, { useState, useRef } from 'react';
import { Heart, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { Transcript } from '../../../types';
import { renderHighlightedText, renderTimedWords } from '../../../utils/highlight';
import { LangMode } from '../index';

interface TranscriptItemProps {
  transcript: Transcript;
  isActive: boolean;
  currentTime: number;
  onSeek: () => void;
  onToggleFavorite: () => void;
  onWordClick: (word: string) => void;
  forwardRef: React.Ref<HTMLDivElement>;
  langMode: LangMode;
  showHighlights: boolean;
  savedWords?: string[];
  highlightColor?: string;
  subtitleSize?: 'small' | 'standard' | 'medium' | 'large';
}

export const TranscriptItem: React.FC<TranscriptItemProps> = ({ transcript, isActive, currentTime, onSeek, onToggleFavorite, onWordClick, forwardRef, langMode, showHighlights, savedWords = [], highlightColor = '#D48166', subtitleSize = 'standard' }) => {
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [looping, setLooping] = useState(false);

  // Reset states when becoming inactive
  React.useEffect(() => {
    if (!isActive) {
      setShowSubtitle(false);
      setLooping(false);
    }
  }, [isActive]);

  // Loop: when currentTime passes this line's endTime, seek back to startTime
  const lastSeekRef = useRef(0);
  React.useEffect(() => {
    if (!looping || !isActive) return;
    const end = parseTime(transcript.endTime);
    if (currentTime >= end && Date.now() - lastSeekRef.current > 500) {
      lastSeekRef.current = Date.now();
      onSeek();
    }
  }, [currentTime, looping, isActive]);

  const parseTime = (t: string): number => {
    const parts = t.split(':');
    const s = parts[parts.length - 1];
    return parseFloat(s) + (parts.length > 1 ? parseInt(parts[0]) * 60 : 0);
  };
  const getEnSizeClass = () => {
     switch (subtitleSize) {
        case 'small': return 'text-[13px]';
        case 'medium': return 'text-[18px]';
        case 'large': return 'text-[22px]';
        case 'standard':
        default: return 'text-[15px]';
     }
  };

  const getZhSizeClass = () => {
     switch (subtitleSize) {
        case 'small': return 'text-[11px]';
        case 'medium': return 'text-[15px]';
        case 'large': return 'text-[18px]';
        case 'standard':
        default: return 'text-[13px]';
     }
  };

  return (
    <div 
      ref={forwardRef}
      onClick={onSeek}
      className={`p-4 mb-2 transition-all duration-300 cursor-pointer group border rounded-xl ${
      isActive 
        ? 'bg-[#E0E0D5] border-[#D48166] dark:bg-[#1E293B] dark:border-[#D48166]' 
        : 'bg-white border-[#E0E0D5] hover:border-[#D48166]/30 hover:bg-[#F9F9F7] shadow-sm dark:bg-[#151B25] dark:border-[#1E293B] dark:hover:bg-[#1C222C]'
    }`}>
      <div className="flex justify-between items-center mb-1.5">
        <span className={`text-[11px] font-mono font-bold tracking-wider ${isActive ? 'text-[#D48166]' : 'text-[#D0D0CE] dark:text-[#475569]'}`}>
          {transcript.startTime}
        </span>
        <div className="flex items-center gap-0.5">
          {/* Loop button (active line only) */}
          {isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); setLooping(v => !v); }}
              className={`p-1 transition-all ${looping ? 'text-[#D48166]' : 'text-[#D0D0CE] hover:text-[#D48166] dark:text-[#475569] dark:hover:text-[#D48166]'}`}
              title={looping ? '取消循环' : '循环播放该行'}
            >
              <RefreshCcw className={`w-4 h-4 ${looping ? 'text-[#D48166]' : ''}`} />
            </button>
          )}
          {/* Show/hide subtitle button (only in none mode, active line) */}
          {langMode === 'none' && isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSubtitle(v => !v); }}
              className={`p-1 transition-all text-[#D0D0CE] hover:text-[#7A8A54] dark:text-[#475569] dark:hover:text-[#7A8A54]`}
              title={showSubtitle ? '隐藏字幕' : '显示字幕'}
            >
              {showSubtitle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          <button 
             onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
             className={`p-1 -mr-1 transition-all ${isActive || transcript.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${transcript.isFavorite ? 'text-[#D48166]' : 'text-[#D0D0CE] hover:text-[#D48166] dark:text-[#475569] dark:hover:text-[#D48166]'}`}
          >
            <Heart className={`w-5 h-5 ${transcript.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 transition-all duration-300">
        {langMode !== 'none' && (langMode === 'bilingual' || langMode === 'en') && (
          <p className={`${getEnSizeClass()} font-bold leading-snug tracking-tight ${isActive ? 'text-black dark:text-[#F8FAFC]' : 'text-[#111111] dark:text-[#94A3B8]'}`}>
            {isActive && transcript.words?.en && transcript.words.en.length > 0
              ? renderTimedWords(transcript.words.en, currentTime, onWordClick, savedWords, highlightColor, true)
              : renderHighlightedText(transcript.en, transcript.highlights, onWordClick, showHighlights, savedWords, highlightColor)
            }
          </p>
        )}
        {langMode !== 'none' && (langMode === 'bilingual' || langMode === 'zh') && (
          <p className={`${getZhSizeClass()} leading-snug ${isActive ? 'text-[#6A6A5A] dark:text-[#CBD5E1]' : 'text-[#8A8A7A] dark:text-[#64748B]'}`}>
            {renderHighlightedText(transcript.zh, transcript.highlights, onWordClick, showHighlights, savedWords, highlightColor)}
          </p>
        )}
        {/* None mode: show current line subtitle when toggled */}
        {langMode === 'none' && isActive && showSubtitle && (
          <>
            {transcript.en && (
              <p className={`${getEnSizeClass()} font-bold leading-snug tracking-tight text-black dark:text-[#F8FAFC] animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                {isActive && transcript.words?.en && transcript.words.en.length > 0
                  ? renderTimedWords(transcript.words.en, currentTime, onWordClick, savedWords, highlightColor, true)
                  : renderHighlightedText(transcript.en, transcript.highlights, onWordClick, showHighlights, savedWords, highlightColor)
                }
              </p>
            )}
            {transcript.zh && (
              <p className={`${getZhSizeClass()} leading-snug text-[#6A6A5A] dark:text-[#CBD5E1] animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                {renderHighlightedText(transcript.zh, transcript.highlights, onWordClick, showHighlights, savedWords, highlightColor)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
