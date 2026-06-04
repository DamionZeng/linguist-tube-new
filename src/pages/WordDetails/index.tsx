import React from 'react';
import { Maximize } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useWordLookup } from '../../hooks/useWordLookup';
import { WordDetailContent } from '../../components/WordDetailContent';
import { useTranslation } from 'react-i18next';

export const WordDetailsPage: React.FC = () => {
  const { word } = useParams<{ word: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    details,
    loading,
    actualWord,
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
  } = useWordLookup({ word: word || '', enabled: !!word });

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="w-full h-screen bg-[#F5F5F0] text-[#4A4A40] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans" style={{ height: '100dvh' }}>
      <Header
        title={actualWord || word || t('vocab.title')}
        rightNode={
          <button
            onClick={toggleFullScreen}
            className="p-1.5 hover:bg-[#EAEAE0] hover:text-[#5A5A40] rounded-full transition-colors cursor-pointer"
          >
            <Maximize className="w-[22px] h-[22px]" />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
          {loading || !details ? (
            <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
              <div className="w-10 h-10 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin mb-4" />
              <p className="text-[#8A8A7A] font-medium">{t('common.loading', 'Loading details...')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#E0E0D5]">
              <WordDetailContent
                details={details}
                variant="page"
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
      </main>
    </div>
  );
};
