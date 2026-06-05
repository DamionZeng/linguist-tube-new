import React from 'react';
import { Highlight } from '../types';

export interface TimedWord {
  text: string;
  start: string;
  end: string;
}

/** 将 "MM:SS.sss" 格式的时间戳转为秒数 */
const parseTimestamp = (ts: string): number => {
  const parts = ts.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return parseFloat(ts) || 0;
};

export const renderTimedWords = (
  words: TimedWord[],
  currentTime: number,
  onWordClick?: (word: string) => void,
  savedWords: string[] = [],
  highlightColor: string = '#2182c1',
  isActiveTranscript: boolean = true
) => {
  let activeWordIndex = -1;
  for (let i = 0; i < words.length; i++) {
    const wordStart = parseTimestamp(words[i].start);
    const wordEnd = parseTimestamp(words[i].end);
    if (currentTime >= wordStart && currentTime < wordEnd) {
      activeWordIndex = i;
      break;
    }
  }

  return (
    <>
      {words.map((w, i) => {
        const isActive = isActiveTranscript && i === activeWordIndex;
        // Clean the word for checking against savedWords
        const cleaned = w.text.replace(/[^a-zA-Z']/g, '');
        const isVocabWord = savedWords.some(
          sw => sw.toLowerCase() === cleaned.toLowerCase()
        );

        return (
          <React.Fragment key={i}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (onWordClick && cleaned) {
                  onWordClick(cleaned);
                }
              }}
              className={`transition-colors duration-150 rounded-sm cursor-pointer hover:bg-black/5 ${
                isActive
                  ? 'text-[#D48166] dark:text-[#E8A87C]'
                  : isVocabWord
                    ? 'font-semibold'
                    : ''
              }`}
              style={!isActive && isVocabWord ? { color: highlightColor } : undefined}
            >
              {w.text}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const renderTimedWordsUnderline = (
  words: TimedWord[],
  currentTime: number,
  highlightColor: string = '#D48166'
) => {
  let activeWordIndex = -1;
  for (let i = 0; i < words.length; i++) {
    const wordStart = parseTimestamp(words[i].start);
    const wordEnd = parseTimestamp(words[i].end);
    if (currentTime >= wordStart && currentTime < wordEnd) {
      activeWordIndex = i;
      break;
    }
  }

  return (
    <>
      {words.map((w, i) => {
        const isActive = i === activeWordIndex;
        return (
          <React.Fragment key={i}>
            <span
              className={`transition-colors duration-150 ${
                isActive
                  ? 'text-[#D48166] dark:text-[#E8A87C]'
                  : ''
              }`}
            >
              {w.text}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const renderHighlightedText = (text: string, highlights: Highlight[], onWordClick?: (word: string) => void, showHighlights: boolean = true, savedWords: string[] = [], highlightColor: string = '#D48166') => {
  let parts = [{ text, isHighlight: false, color: '', targetWord: '' }];

  const allHighlights = [...(highlights || [])];
  
  // Convert saved words to highlights if they exist in text
  savedWords.forEach(word => {
     if (word && word.length > 0 && typeof text === 'string') {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(text)) {
           // Only add if not already highlighted to avoid conflicts
           if (!allHighlights.find(h => h.word.toLowerCase() === word.toLowerCase())) {
              allHighlights.push({ word, color: highlightColor });
           }
        }
     }
  });

  if (allHighlights && allHighlights.length > 0) {
    allHighlights.forEach(hl => {
      parts = parts.flatMap(part => {
        if (part.isHighlight) return [part];
        const lowerPart = typeof part.text === 'string' ? part.text.toLowerCase() : '';
        if (!lowerPart) return [part];
        const lowerSearch = hl.word.toLowerCase();
        
        // Use regex search to find the whole word
        const regex = new RegExp(`\\b${hl.word}\\b`, 'i');
        const match = typeof part.text === 'string' ? part.text.match(regex) : null;
        
        if (!match || match.index === undefined) {
           return [part];
        }

        const splitIdx = match.index;
        const matchLen = match[0].length;

        return [
          { text: part.text.substring(0, splitIdx), isHighlight: false, color: '', targetWord: '' },
          { text: part.text.substring(splitIdx, splitIdx + matchLen), isHighlight: true, color: hl.color, targetWord: hl.word },
          { text: part.text.substring(splitIdx + matchLen), isHighlight: false, color: '', targetWord: '' }
        ];
      });
    });
  }

  return (
    <>
      {parts.map((p, i) => {
        if (p.isHighlight) {
           const isHexColor = p.color && (p.color.startsWith('#') || p.color.startsWith('rgb'));
           return (
             <span 
               key={i} 
               onClick={(e) => { 
                 e.stopPropagation();
                 if (onWordClick) {
                   onWordClick(p.targetWord); 
                 }
               }} 
               className={`font-semibold rounded-sm transition-all ${!isHexColor ? p.color : ''} ${showHighlights ? 'cursor-pointer px-0.5 hover:bg-black/5 active:scale-95' : ''}`}
               style={isHexColor ? { color: p.color } : undefined}
             >
               {p.text}
             </span>
           );
        }
        
        const subParts = p.text.split(/([a-zA-Z]+(?:'[a-zA-Z]+)?)/);
        return (
          <span key={i}>
            {subParts.map((sub, j) => {
              if (/^[a-zA-Z]+(?:'[a-zA-Z]+)?$/.test(sub)) {
                return (
                  <span 
                    key={j} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onWordClick) onWordClick(sub);
                    }} 
                    className="cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors rounded-sm px-0.5 -mx-0.5"
                  >
                    {sub}
                  </span>
                );
              }
              return <span key={j}>{sub}</span>;
            })}
          </span>
        );
      })}
    </>
  );
};
