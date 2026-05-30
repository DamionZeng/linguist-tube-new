import React, { useEffect, useRef } from 'react';
import { Transcript } from '../../../types';
import { TranscriptItem } from './TranscriptItem';
import { parseTime } from '../../../utils/time';
import { LangMode } from '../index';

interface TranscriptListProps {
  transcripts: Transcript[];
  currentTime: number;
  onSeek: (time: number) => void;
  onToggleFavorite: (id: string) => void;
  onWordClick: (word: string) => void;
  langMode: LangMode;
  showHighlights: boolean;
  isMaskActive?: boolean;
}

export const TranscriptList: React.FC<TranscriptListProps> = ({ transcripts, currentTime, onSeek, onToggleFavorite, onWordClick, langMode, showHighlights, isMaskActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  const getActiveIndex = () => {
    // Determine active transcript based on current time
    for (let i = 0; i < transcripts.length; i++) {
       const t = transcripts[i];
       const start = parseTime(t.startTime);
       const end = parseTime(t.endTime);
       // Allow a little slack for the last one or slightly overlapping
       if (currentTime >= start && currentTime < end) return i;
    }
    return -1;
  };

  const activeIndex = getActiveIndex();
  const prevActiveIndex = useRef(activeIndex);

  useEffect(() => {
    if (activeIndex !== prevActiveIndex.current && activeIndex !== -1) {
       if (activeItemRef.current) {
          activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
       prevActiveIndex.current = activeIndex;
    }
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto px-4 py-5 md:px-6">
      {transcripts.map((t, index) => {
        const isActive = index === activeIndex;
        return (
          <TranscriptItem 
            key={t.id} 
            transcript={t} 
            isActive={isActive}
            onSeek={() => onSeek(parseTime(t.startTime))}
            onToggleFavorite={() => onToggleFavorite(t.id)}
            onWordClick={onWordClick}
            forwardRef={isActive ? activeItemRef : null}
            langMode={langMode}
            showHighlights={showHighlights}
            isMaskActive={isMaskActive}
          />
        );
      })}
      {/* Dynamic padding at the bottom so the last item clears the fixed action bar on mobile */}
      <div className="h-[200px] lg:h-10" /> 
    </div>
  );
};
