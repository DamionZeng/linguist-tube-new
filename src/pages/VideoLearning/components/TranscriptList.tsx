import React, { useEffect, useRef, useCallback } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
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
}

export const TranscriptList: React.FC<TranscriptListProps> = ({ transcripts, currentTime, activeIndex, onSeek, onToggleFavorite, onWordClick, langMode, showHighlights, savedWords = [], savedPhrases = [], highlightColor = '#D48166', subtitleSize = 'standard' }) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const prevActiveIndex = useRef(activeIndex);

  useEffect(() => {
    if (activeIndex !== prevActiveIndex.current && activeIndex !== -1) {
      virtuosoRef.current?.scrollToIndex({
        index: activeIndex,
        behavior: 'smooth',
        align: 'start',
      });
      prevActiveIndex.current = activeIndex;
    }
  }, [activeIndex]);

  const itemContent = useCallback((index: number) => {
    const t = transcripts[index];
    const isActive = index === activeIndex;
    return (
      <TranscriptItem
        transcript={t}
        isActive={isActive}
        currentTime={isActive ? currentTime : 0}
        onSeek={() => onSeek(parseTime(t.startTime))}
        onToggleFavorite={() => onToggleFavorite(t.id)}
        onWordClick={onWordClick}
        langMode={langMode}
        showHighlights={showHighlights}
        savedWords={savedWords}
        savedPhrases={savedPhrases}
        highlightColor={highlightColor}
        subtitleSize={subtitleSize}
      />
    );
  }, [transcripts, activeIndex, currentTime, onSeek, onToggleFavorite, onWordClick, langMode, showHighlights, savedWords, savedPhrases, highlightColor, subtitleSize]);

  const Footer = useCallback(() => (
    <div className="h-[200px] lg:h-10" />
  ), []);

  return (
    <Virtuoso
      ref={virtuosoRef}
      totalCount={transcripts.length}
      itemContent={itemContent}
      components={{ Footer }}
      className="w-full h-full"
      style={{ padding: '12px 0 0 0' }}
    />
  );
};
