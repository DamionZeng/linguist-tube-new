import React from 'react';
import { X } from 'lucide-react';
import { useWordLookup } from '../hooks/useWordLookup';
import { WordDetailContent } from './WordDetailContent';

interface WordModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  onWordSaved?: (word: string) => void;
  savedWords?: string[];
}

export const WordModal: React.FC<WordModalProps> = ({ isOpen, onClose, word, onWordSaved, savedWords = [] }) => {
  const {
    details,
    loading,
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
  } = useWordLookup({ word, enabled: isOpen, savedWords, onWordSaved });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto bg-white rounded-t-[24px] z-[70] shadow-2xl transform transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col max-h-[75vh]">
        <div className="flex justify-center pt-1.5 pb-1 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1 bg-[#E0E0D5] rounded-full" />
        </div>

        <button onClick={onClose} className="absolute top-2.5 right-3 p-1 text-[#8A8A7A] hover:bg-[#F5F5F0] rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="p-4 overflow-y-auto w-full min-h-[25vh]">
          {loading || !details ? (
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
