import React from 'react';
import { Highlight } from '../types';

export const renderHighlightedText = (text: string, highlights: Highlight[], onWordClick?: (word: string) => void, showHighlights: boolean = true) => {
  let parts = [{ text, isHighlight: false, color: '', targetWord: '' }];

  if (highlights && highlights.length > 0) {
    highlights.forEach(hl => {
      parts = parts.flatMap(part => {
        if (part.isHighlight) return [part];
        const lowerPart = part.text.toLowerCase();
        const lowerSearch = hl.word.toLowerCase();
        const splitIdx = lowerPart.indexOf(lowerSearch);
        
        if (splitIdx === -1) return [part];

        return [
          { text: part.text.substring(0, splitIdx), isHighlight: false, color: '', targetWord: '' },
          { text: part.text.substring(splitIdx, splitIdx + hl.word.length), isHighlight: true, color: hl.color, targetWord: hl.word },
          { text: part.text.substring(splitIdx + hl.word.length), isHighlight: false, color: '', targetWord: '' }
        ];
      });
    });
  }

  return (
    <>
      {parts.map((p, i) => {
        if (p.isHighlight) {
           return (
             <span 
               key={i} 
               onClick={(e) => { 
                 e.stopPropagation();
                 if (showHighlights && onWordClick) {
                   onWordClick(p.targetWord); 
                 }
               }} 
               className={showHighlights ? `font-semibold cursor-pointer rounded-sm px-0.5 hover:bg-[#D48166]/10 active:scale-95 transition-all ${p.color}` : ''}
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
