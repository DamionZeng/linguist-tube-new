import React from 'react';
import { Volume2, Heart, ChevronDown, ChevronUp, BookOpen, GitBranch, ScrollText, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WordLookupData } from '../types/word';

type Variant = 'modal' | 'page';

interface WordDetailContentProps {
  details: WordLookupData;
  variant: Variant;
  isWordSaved: boolean;
  isSaving: boolean;
  isFavorited: boolean;
  isFavoriting: boolean;
  sentenceIndex: number;
  totalSentences: number;
  showPhrases: boolean;
  showSynonyms: boolean;
  showRelWords: boolean;
  onPlayAudio: (url: string | null | undefined) => void;
  onFormatPhonetic: () => string;
  onFormatTrans: () => string;
  onSaveToVocab: () => void;
  onFavoriteSentence: () => void;
  onSetSentenceIndex: (updater: (i: number) => number) => void;
  onTogglePhrases: () => void;
  onToggleSynonyms: () => void;
  onToggleRelWords: () => void;
}

const is = (v: Variant, target: Variant) => v === target;

export const WordDetailContent: React.FC<WordDetailContentProps> = ({
  details,
  variant,
  isWordSaved,
  isSaving,
  isFavorited,
  isFavoriting,
  sentenceIndex,
  totalSentences,
  showPhrases,
  showSynonyms,
  showRelWords,
  onPlayAudio,
  onFormatPhonetic,
  onFormatTrans,
  onSaveToVocab,
  onFavoriteSentence,
  onSetSentenceIndex,
  onTogglePhrases,
  onToggleSynonyms,
  onToggleRelWords,
}) => {
  const { t } = useTranslation();
  const phonetic = onFormatPhonetic();

  return (
    <>
      {/* Word Header */}
      <div className={`flex flex-col gap-1.5 mb-3 pb-3 border-b border-[#E0E0D5]/50 ${is(variant, 'page') ? 'md:flex-row md:items-end md:justify-between md:gap-4 md:mb-6 md:pb-6' : ''}`}>
        <div>
          <div className={`flex items-center gap-2 overflow-x-auto pb-1 ${is(variant, 'page') ? 'gap-3 mb-2' : ''}`}>
            <h2 className={`${is(variant, 'page') ? 'text-4xl md:text-5xl' : 'text-xl'} font-bold text-[#4A4A40] tracking-tight`}>
              {details.word}
            </h2>
            <div className="flex shrink-0 gap-2">
              {details.ukspeech && (
                <button
                  onClick={() => onPlayAudio(details.ukspeech)}
                  className={`flex items-center ${is(variant, 'page') ? 'gap-1.5 px-2.5 py-1.5 rounded-xl' : 'gap-1 px-2 py-1 rounded-lg'} text-[#D48166] bg-[#FCF5F3] hover:bg-[#F2E5E1] transition-colors border border-[#D48166]/20`}
                  title="UK pronunciation"
                >
                  <Volume2 className={`${is(variant, 'page') ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                  <span className={`${is(variant, 'page') ? 'text-[10px]' : 'text-[9px]'} font-bold uppercase tracking-wider`}>UK</span>
                </button>
              )}
              {details.usspeech && (
                <button
                  onClick={() => onPlayAudio(details.usspeech)}
                  className={`flex items-center ${is(variant, 'page') ? 'gap-1.5 px-2.5 py-1.5 rounded-xl' : 'gap-1 px-2 py-1 rounded-lg'} text-[#5A5A40] bg-[#EAEAE0] hover:bg-[#E0E0D5] transition-colors border border-[#5A5A40]/10`}
                  title="US pronunciation"
                >
                  <Volume2 className={`${is(variant, 'page') ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                  <span className={`${is(variant, 'page') ? 'text-[10px]' : 'text-[9px]'} font-bold uppercase tracking-wider`}>US</span>
                </button>
              )}
            </div>
          </div>
          {phonetic && (
            <p className={`text-[#8A8A7A] font-mono ${is(variant, 'page') ? 'text-sm' : 'text-xs'} tracking-widest`}>{phonetic}</p>
          )}
        </div>
      </div>

      {/* Translations */}
      {details.translations.length > 0 && (
        <div className={`${is(variant, 'page') ? 'mb-8 pl-1' : 'mb-4 pl-0.5'}`}>
          <div className={`flex flex-col ${is(variant, 'page') ? 'gap-3' : 'gap-1.5'}`}>
            {details.translations.map((tr, i) => (
              <div key={i} className={`flex items-start ${is(variant, 'page') ? 'gap-3' : 'gap-2'}`}>
                <span className={`${is(variant, 'page') ? 'text-[12px] px-2 py-1' : 'text-[10px] px-1.5 py-0.5'} text-[#94A684] font-bold uppercase tracking-wider bg-[#F2F5F0] rounded shrink-0 mt-0.5`}>{tr.pos}</span>
                <span className={`${is(variant, 'page') ? 'text-lg' : 'text-sm'} text-[#4A4A40] font-medium leading-relaxed`}>{tr.tran_cn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentences */}
      {details.sentences.length > 0 && (
        <div className={`${is(variant, 'page') ? 'mb-8' : 'mb-4'}`}>
          <div className={`flex items-center justify-between ${is(variant, 'page') ? 'mb-3 border-b-2 border-[#F5F5F0] pb-2' : 'mb-2 pb-1.5 border-b border-[#F5F5F0]'} `}>
            <div className={`flex items-center ${is(variant, 'page') ? 'gap-2 text-sm' : 'gap-1.5 text-[11px]'} text-[#6A6A5A] font-bold tracking-wide`}>
              <ScrollText className={`${is(variant, 'page') ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-[#D48166]`} />
              <span>
                {t('video.subtitleExample', 'Example Sentences')}
                {totalSentences > 1 && (
                  <span className="text-[#8A8A7A] font-normal ml-1">
                    ({sentenceIndex + 1}/{totalSentences})
                  </span>
                )}
              </span>
            </div>
            {totalSentences > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => onSetSentenceIndex(i => Math.max(0, i - 1))}
                  disabled={sentenceIndex === 0}
                  className={`p-1 ${is(variant, 'page') ? 'px-2.5 text-xs' : 'px-2.5 text-[10px]'} font-bold uppercase rounded-md bg-[#F5F5F0] text-[#6A6A5A] hover:bg-[#EAEAE0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
                >
                  Prev
                </button>
                <button
                  onClick={() => onSetSentenceIndex(i => Math.min(totalSentences - 1, i + 1))}
                  disabled={sentenceIndex >= totalSentences - 1}
                  className={`p-1 ${is(variant, 'page') ? 'px-2.5 text-xs' : 'px-2.5 text-[10px]'} font-bold uppercase rounded-md bg-[#F5F5F0] text-[#6A6A5A] hover:bg-[#EAEAE0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
          <div className={`bg-[#F9F9F7] border border-[#EAEAE0] ${is(variant, 'page') ? 'p-5 rounded-2xl' : 'p-3 rounded-xl'} relative overflow-hidden group`}>
            <div className={`absolute top-0 left-0 ${is(variant, 'page') ? 'w-1.5' : 'w-1'} h-full bg-[#94A684]/60`} />
            <p className={`${is(variant, 'page') ? 'text-[16px] md:text-[18px] mb-2.5' : 'text-[13px] mb-1.5'} font-serif text-[#4A4A40] leading-relaxed`}>
              {details.sentences[sentenceIndex]?.s_content}
            </p>
            <p className={`${is(variant, 'page') ? 'text-[14px] md:text-[15px]' : 'text-xs'} text-[#6A6A5A] leading-relaxed`}>
              {details.sentences[sentenceIndex]?.s_cn}
            </p>
            <button
              onClick={onFavoriteSentence}
              disabled={isFavoriting || details.sentences.length === 0}
              className={`absolute ${is(variant, 'page') ? 'top-4 right-4 p-2' : 'top-2 right-2 p-1.5'} rounded-full transition-all
                          ${isFavorited ? 'text-[#D48166] bg-[#FCF5F3]' : 'text-[#8A8A7A] bg-white opacity-0 group-hover:opacity-100 hover:text-[#D48166] hover:bg-[#FCF5F3] shadow-sm'}
                          ${isFavoriting ? 'opacity-50' : 'active:scale-95'}`}
              title={isFavorited ? 'Favorited' : 'Favorite sentence'}
            >
              <Heart className={`${is(variant, 'page') ? 'w-5 h-5' : 'w-4 h-4'} ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Synonyms & Antonyms - page only */}
      {is(variant, 'page') && details.synonyms.length > 0 && (
        <div className="mb-4">
          <button
            onClick={onToggleSynonyms}
            className={`flex items-center gap-2 w-full text-left font-bold text-sm transition-all p-3 rounded-xl ${showSynonyms ? 'bg-[#F9F9F7] text-[#4A4A40]' : 'bg-transparent text-[#6A6A5A] hover:bg-[#F5F5F0]'}`}
          >
            <Lightbulb className="w-4 h-4 text-[#E1B12C]" />
            <span>Synonyms & Antonyms</span>
            {showSynonyms ? <ChevronUp className="w-4 h-4 ml-auto text-[#8A8A7A]" /> : <ChevronDown className="w-4 h-4 ml-auto text-[#8A8A7A]" />}
          </button>
          {showSynonyms && (
            <div className="bg-[#F9F9F7] px-4 pt-1 pb-4 rounded-b-xl -mt-2 space-y-3">
              {details.synonyms.map((syn, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 pb-3 border-b border-[#EAEAE0] last:border-0 last:pb-0">
                  <div className="flex gap-2 items-center md:items-start md:w-[120px] shrink-0 pt-0.5">
                    <span className="text-[10px] text-[#94A684] font-bold uppercase tracking-wider bg-[#F2F5F0] px-1.5 py-0.5 rounded">{syn.pos}</span>
                    <span className="text-[13px] text-[#6A6A5A]">{syn.tran}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {syn.Hwds.map((h, j) => (
                      <span key={j} className="text-[14px] text-[#4A4A40] bg-white px-2.5 py-1 rounded-lg border border-[#E0E0D5] hover:border-[#D48166]/50 cursor-default transition-colors">
                        {h.word || h.hwd}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Related Words - page only */}
      {is(variant, 'page') && details.relWords.length > 0 && (
        <div className="mb-4">
          <button
            onClick={onToggleRelWords}
            className={`flex items-center gap-2 w-full text-left font-bold text-sm transition-all p-3 rounded-xl ${showRelWords ? 'bg-[#F9F9F7] text-[#4A4A40]' : 'bg-transparent text-[#6A6A5A] hover:bg-[#F5F5F0]'}`}
          >
            <GitBranch className="w-4 h-4 text-[#94A684]" />
            <span>Related Words</span>
            {showRelWords ? <ChevronUp className="w-4 h-4 ml-auto text-[#8A8A7A]" /> : <ChevronDown className="w-4 h-4 ml-auto text-[#8A8A7A]" />}
          </button>
          {showRelWords && (
            <div className="bg-[#F9F9F7] px-4 pt-1 pb-4 rounded-b-xl -mt-2 space-y-3">
              {details.relWords.map((rw, i) => (
                <div key={i} className="flex gap-3 md:gap-4 items-start pb-3 border-b border-[#EAEAE0] last:border-0 last:pb-0">
                  <span className="text-[10px] text-[#94A684] font-bold uppercase tracking-wider bg-[#F2F5F0] px-1.5 py-0.5 rounded shrink-0 mt-1">{rw.Pos}</span>
                  <div className="flex flex-wrap gap-2">
                    {rw.Hwds.map((h, j) => (
                      <span key={j} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E0E0D5]">
                        <span className="text-[14px] font-medium text-[#4A4A40]">{h.hwd}</span>
                        {h.tran && <span className="text-[#8A8A7A] text-[12px] border-l border-[#EAEAE0] pl-2">{h.tran}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Common Phrases - page only */}
      {is(variant, 'page') && details.phrases.length > 0 && (
        <div className="mb-8">
          <button
            onClick={onTogglePhrases}
            className={`flex items-center gap-2 w-full text-left font-bold text-sm transition-all p-3 rounded-xl ${showPhrases ? 'bg-[#F9F9F7] text-[#4A4A40]' : 'bg-transparent text-[#6A6A5A] hover:bg-[#F5F5F0]'}`}
          >
            <BookOpen className="w-4 h-4 text-[#5A5A40]" />
            <span>Common Phrases ({details.phrases.length})</span>
            {showPhrases ? <ChevronUp className="w-4 h-4 ml-auto text-[#8A8A7A]" /> : <ChevronDown className="w-4 h-4 ml-auto text-[#8A8A7A]" />}
          </button>
          {showPhrases && (
            <div className="bg-[#F9F9F7] px-4 pt-2 pb-4 rounded-b-xl -mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
              {details.phrases.map((p, i) => (
                <div key={i} className="flex flex-col p-3 bg-white rounded-xl border border-[#EAEAE0] hover:border-[#D48166]/30 transition-colors">
                  <span className="text-[14px] font-bold text-[#4A4A40] mb-1">{p.p_content}</span>
                  <span className="text-[13px] text-[#6A6A5A] leading-tight">{p.p_cn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save to Vocab Button */}
      <div className={`flex gap-2 ${is(variant, 'page') ? 'mt-8 pt-6 border-t border-[#EAEAE0] flex-col md:flex-row' : 'pt-2 border-t border-[#E0E0D5]/50 pb-1 flex-col sm:flex-row'}`}>
        <button
          onClick={onSaveToVocab}
          disabled={isSaving || isWordSaved}
          className={`${is(variant, 'page') ? 'flex-1 py-4 px-6 rounded-2xl font-bold text-[16px]' : 'flex-[2] py-2.5 rounded-lg font-semibold text-[13px]'} transition-all flex items-center justify-center gap-2
                     ${isWordSaved
                       ? 'bg-[#94A684] text-white cursor-not-allowed'
                       : 'bg-[#5A5A40] hover:bg-[#4A4A40] text-white shadow-md shadow-[#5A5A40]/10 hover:shadow-lg hover:shadow-[#5A5A40]/20 active:scale-95'}
                     ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <BookOpen className={`${is(variant, 'page') ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {isSaving ? t('video.processing', 'Saving...') : isWordSaved ? t('video.saved', '已加入生词本') : t('video.saveToVocab', 'Save to Vocabulary List')}
        </button>
      </div>
    </>
  );
};
