import React, { useEffect, useRef } from 'react';
import { Transcript } from '../../../types';
import { TranscriptItem } from './TranscriptItem';
import { parseTime } from '../../../utils/time';
import { LangMode } from '../index';

interface TranscriptListProps {
  transcripts: Transcript[];
  currentTime: number;
  activeIndex: number;
  onSeek: (time: number) => void;
  onToggleFavorite: (id: string) => void;
  onWordClick: (word: string, sentence?: string) => void;
  langMode: LangMode;
  showHighlights: boolean;
  savedWords?: string[];
  savedPhrases?: string[];
  highlightColor?: string;
  subtitleSize?: 'small' | 'standard' | 'medium' | 'large';
  listeningMode?: 'normal' | 'intensive';
  intensiveRepeatCurrent?: number;
  intensiveRepeatCount?: number;
}

export const TranscriptList: React.FC<TranscriptListProps> = ({ transcripts, currentTime, activeIndex, onSeek, onToggleFavorite, onWordClick, langMode, showHighlights, savedWords = [], savedPhrases = [], highlightColor = '#D48166', subtitleSize = 'standard', listeningMode = 'normal', intensiveRepeatCurrent = 0, intensiveRepeatCount = 4 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const prevActiveIndex = useRef(activeIndex);

  useEffect(() => {
    if (activeIndex !== prevActiveIndex.current && activeIndex !== -1) {
       if (activeItemRef.current) {
          activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }
       prevActiveIndex.current = activeIndex;
    }
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto px-3 py-5 md:px-5">
      {transcripts.map((t, index) => {
        const isActive = index === activeIndex;
        // 精听模式：非活跃句子不显示字幕，活跃句子仅最后一遍显示双语
        let itemLangMode: LangMode = langMode;
        if (listeningMode === 'intensive') {
          if (!isActive) {
            itemLangMode = 'none';
          } else {
            const isLastRepeat = intensiveRepeatCurrent >= intensiveRepeatCount - 1;
            itemLangMode = isLastRepeat ? 'bilingual' : 'none';
          }
        }
        return (
          <TranscriptItem 
            key={t.id} 
            transcript={t} 
            isActive={isActive}
            currentTime={currentTime}
            onSeek={() => onSeek(parseTime(t.startTime))}
            onToggleFavorite={() => onToggleFavorite(t.id)}
            onWordClick={onWordClick}
            forwardRef={isActive ? activeItemRef : null}
            langMode={itemLangMode}
            showHighlights={showHighlights}
            savedWords={savedWords}
            savedPhrases={savedPhrases}
            highlightColor={highlightColor}
            subtitleSize={subtitleSize}
          />
        );
      })}
      {/* Dynamic padding at the bottom so the last item clears the fixed action bar on mobile */}
      <div className="h-[200px] lg:h-10" /> 
    </div>
  );
};
