import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, BookOpen, ChevronRight } from 'lucide-react';
import { useWordLookup } from '../hooks/useWordLookup';
import { WordDetailContent } from './WordDetailContent';

interface WordModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  sentence?: string;
  onWordSaved?: (word: string) => void;
  savedWords?: string[];
  savedPhrases?: string[];
}

/** Parse sentence into individual word tokens with their positions */
function parseSentenceWords(sentence: string): { text: string; clean: string; start: number; end: number }[] {
  const words: { text: string; clean: string; start: number; end: number }[] = [];
  const regex = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
  let match;
  while ((match = regex.exec(sentence)) !== null) {
    words.push({
      text: match[0],
      clean: match[0].toLowerCase(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return words;
}

const VISIBLE_RANGE = 4; // 被点单词前后各显示多少个相邻单词

export const WordModal: React.FC<WordModalProps> = ({ isOpen, onClose, word, sentence, onWordSaved, savedWords = [], savedPhrases = [] }) => {
  const [phraseWord, setPhraseWord] = useState(word);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Parse sentence words
  const sentenceWords = useMemo(() => sentence ? parseSentenceWords(sentence) : [], [sentence]);

  // Find the initial index of the clicked word in the sentence
  useEffect(() => {
    if (isOpen && sentence && sentenceWords.length > 0) {
      const lowerWord = word.toLowerCase();
      const idx = sentenceWords.findIndex(w => w.clean === lowerWord);
      if (idx >= 0) {
        setSelectedIndices([idx]);
      } else {
        setSelectedIndices([]);
      }
    } else {
      setSelectedIndices([]);
    }
    setPhraseWord(word);
  }, [isOpen, word, sentence, sentenceWords]);

  // 可见窗口范围：被点单词前后各 VISIBLE_RANGE 个单词
  const visibleRange = useMemo(() => {
    if (sentenceWords.length === 0 || selectedIndices.length === 0) return { start: 0, end: 0 };
    const pivot = selectedIndices[0]; // 原始被点击的词
    const start = Math.max(0, pivot - VISIBLE_RANGE);
    const end = Math.min(sentenceWords.length, pivot + VISIBLE_RANGE + 1);
    return { start, end };
  }, [sentenceWords, selectedIndices]);

  // Build the phrase from selected indices
  const currentPhrase = useMemo(() => {
    if (selectedIndices.length === 0) return word;
    // 安全防护：selectedIndices 可能包含越界索引（当 sentenceWords 因 props 变化被清空时）
    if (selectedIndices.some(i => i >= sentenceWords.length)) return word;
    if (selectedIndices.length === 1) return sentenceWords[selectedIndices[0]]?.text || word;
    // Sort indices and join consecutive words
    const sorted = [...selectedIndices].sort((a, b) => a - b);
    return sorted.map(i => sentenceWords[i].text).join(' ');
  }, [selectedIndices, sentenceWords, word]);

  // Update phraseWord when selection changes
  useEffect(() => {
    setPhraseWord(currentPhrase);
  }, [currentPhrase]);

  const handleWordInSentenceClick = useCallback((index: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        // Don't allow deselecting if it's the only one
        if (prev.length <= 1) return prev;
        return prev.filter(i => i !== index);
      }
      // Add the new index and keep only contiguous range
      const newIndices = [...prev, index].sort((a, b) => a - b);
      // Check if the new index makes the selection contiguous
      const min = newIndices[0];
      const max = newIndices[newIndices.length - 1];
      // Return contiguous range from min to max
      const result: number[] = [];
      for (let i = min; i <= max; i++) {
        result.push(i);
      }
      return result;
    });
  }, []);

  const {
    details,
    loading,
    notFound,
    isSaving,
    isWordSaved,
    isFavorited,
    isFavoriting,
    sentenceIndex,
    setSentenceIndex,
    showPhrases,
    setShowPhrases,
    showSynonyms,
    setShowSynonyms,
    showRelWords,
    setShowRelWords,
    totalSentences,
    playAudio,
    formatPhonetic,
    formatTrans,
    handleSaveToVocab,
    handleFavoriteSentence,
  } = useWordLookup({ word: phraseWord, enabled: isOpen, savedWords, savedPhrases, onWordSaved });

  const isPhrase = selectedIndices.length > 1;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto bg-white dark:bg-[#151B25] rounded-t-[24px] z-[70] shadow-2xl transform transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col max-h-[75vh]">
        <div className="flex justify-center pt-1.5 pb-1 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1 bg-[#E0E0D5] dark:bg-[#334155] rounded-full" />
        </div>

        <button onClick={onClose} className="absolute top-2.5 right-3 p-1 text-[#8A8A7A] dark:text-[#64748B] hover:bg-[#F5F5F0] dark:hover:bg-[#1E293B] rounded-full transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        {/* Phrase selector - show when sentence context is available */}
        {sentence && sentenceWords.length > 0 && (
          <div className="px-4 pb-2">
            <div className="bg-[#F9F9F7] dark:bg-[#1C222C] rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[11px] text-[#8A8A7A] dark:text-[#94A3B8] font-medium">
                  {isPhrase ? '点击单词调整短语范围' : '点击相邻单词扩展为短语'}
                </span>
                {isPhrase && (
                  <button
                    onClick={() => {
                      // Reset to single word
                      const lowerWord = word.toLowerCase();
                      const idx = sentenceWords.findIndex(w => w.clean === lowerWord);
                      setSelectedIndices(idx >= 0 ? [idx] : []);
                    }}
                    className="text-[11px] text-[#D48166] font-medium ml-auto hover:underline"
                  >
                    重置
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-x-0.5 gap-y-1 items-center">
                {visibleRange.start > 0 && (
                  <span className="text-[#9CA390] dark:text-[#64748B] text-sm px-0.5 select-none">…</span>
                )}
                {sentenceWords.slice(visibleRange.start, visibleRange.end).map((w, i) => {
                  const globalIndex = visibleRange.start + i;
                  const isSelected = selectedIndices.includes(globalIndex);
                  return (
                    <span
                      key={globalIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWordInSentenceClick(globalIndex);
                      }}
                      className={`cursor-pointer px-1 py-0.5 rounded-md text-sm font-medium transition-all ${
                        isSelected
                          ? isPhrase
                            ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                            : 'bg-[#D48166]/15 text-[#D48166] ring-1 ring-[#D48166]/30'
                          : 'text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-[#E0E0D5]/50 dark:hover:bg-[#334155]/50'
                      }`}
                    >
                      {w.text}
                    </span>
                  );
                })}
                {visibleRange.end < sentenceWords.length && (
                  <span className="text-[#9CA390] text-sm px-0.5 select-none">…</span>
                )}
              </div>
              {isPhrase && (
                <div className="mt-2 flex items-center gap-1.5 text-sm">
                  <ChevronRight className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-purple-700">{currentPhrase}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-4 overflow-y-auto w-full min-h-[25vh]">
          {loading ? (
            <div className="flex items-center justify-center min-h-[25vh]">
              <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
            </div>
          ) : notFound ? (
            <div className="flex flex-col items-center justify-center min-h-[25vh] text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F0] dark:bg-[#1E293B] flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-[#8A8A7A] dark:text-[#64748B]" />
              </div>
              <h3 className="text-lg font-bold text-[#4A4A40] dark:text-[#F8FAFC] mb-1">{phraseWord}</h3>
              <p className="text-sm text-[#8A8A7A] dark:text-[#94A3B8]">未找到该{isPhrase ? '短语' : '单词'}的释义</p>
            </div>
          ) : !details ? (
            <div className="flex items-center justify-center min-h-[25vh]">
              <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <WordDetailContent
                details={details}
                variant="modal"
                isWordSaved={isWordSaved}
                isSaving={isSaving}
                isFavorited={isFavorited}
                isFavoriting={isFavoriting}
                sentenceIndex={sentenceIndex}
                totalSentences={totalSentences}
                showPhrases={showPhrases}
                showSynonyms={showSynonyms}
                showRelWords={showRelWords}
                onPlayAudio={playAudio}
                onFormatPhonetic={formatPhonetic}
                onFormatTrans={formatTrans}
                onSaveToVocab={handleSaveToVocab}
                onFavoriteSentence={handleFavoriteSentence}
                onSetSentenceIndex={setSentenceIndex}
                onTogglePhrases={() => setShowPhrases(!showPhrases)}
                onToggleSynonyms={() => setShowSynonyms(!showSynonyms)}
                onToggleRelWords={() => setShowRelWords(!showRelWords)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
