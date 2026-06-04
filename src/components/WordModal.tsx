import React, { useState, useEffect } from 'react';
import { Volume2, X, Heart, ChevronDown, ChevronUp, BookOpen, ScrollText } from 'lucide-react';
import { addVocabularyWord, fetchWordLookup, addFavoriteSentence } from '@api/general';
import { useTranslation } from 'react-i18next';
import { getBaseWord } from '../utils/lemmatize';

interface PhraseItem {
  p_cn: string;
  p_content: string;
}

interface HwdItem {
  hwd?: string;
  tran?: string;
  word?: string;
}

interface RelWordGroup {
  Hwds: HwdItem[];
  Pos: string;
}

interface SentenceItem {
  s_cn: string;
  s_content: string;
}

interface SynonymGroup {
  Hwds: HwdItem[];
  pos: string;
  tran: string;
}

interface TranslationItem {
  pos: string;
  tran_cn: string;
}

interface WordLookupData {
  bookId: string | null;
  phrases: PhraseItem[];
  relWords: RelWordGroup[];
  sentences: SentenceItem[];
  synonyms: SynonymGroup[];
  translations: TranslationItem[];
  ukphone: string | null;
  ukspeech: string | null;
  usphone: string | null;
  usspeech: string | null;
  word: string;
}

interface WordModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  onWordSaved?: (word: string) => void;
  savedWords?: string[];
}

export const WordModal: React.FC<WordModalProps> = ({ isOpen, onClose, word, onWordSaved, savedWords = [] }) => {
  const { t } = useTranslation();
  const [details, setDetails] = useState<WordLookupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isWordSaved, setIsWordSaved] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showRelWords, setShowRelWords] = useState(false);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [actualWord, setActualWord] = useState('');

  useEffect(() => {
    if (isOpen && word) {
      setLoading(true);
      setShowPhrases(false);
      setShowSynonyms(false);
      setShowRelWords(false);
      setSentenceIndex(0);
      
      const baseWord = getBaseWord(word);
      setActualWord(baseWord);
      setIsWordSaved(savedWords.includes(baseWord.toLowerCase()));

      fetchWordLookup(baseWord)
        .then(data => {
          setDetails(data);
          setLoading(false);
        })
        .catch(() => {
          setDetails(null);
          setLoading(false);
        });

      setIsFavorited(false);
    } else {
      setDetails(null);
    }
  }, [isOpen, word, savedWords]);

  if (!isOpen) return null;

  const playAudio = (url: string | null | undefined) => {
    if (url) {
      new Audio(url).play().catch(() => {});
    }
  };

  const formatPhonetic = (): string => {
    if (!details) return '';
    const parts: string[] = [];
    if (details.ukphone) parts.push(`UK: /${details.ukphone}/`);
    if (details.usphone) parts.push(`US: /${details.usphone}/`);
    return parts.join('  ');
  };

  const formatTrans = (): string => {
    if (!details || !details.translations.length) return '';
    return details.translations.map(t => `${t.pos} ${t.tran_cn}`).join('；');
  };

  const handleSaveToVocab = async () => {
    if (!details || isWordSaved) return;
    setIsSaving(true);
    try {
      await addVocabularyWord({
        word: details.word,
        phonetic: formatPhonetic(),
        trans: formatTrans(),
        pos: details.translations[0]?.pos || '',
        mean: details.translations[0]?.tran_cn || '',
        example: details.sentences[0]?.s_content || '',
        exampleTrans: details.sentences[0]?.s_cn || '',
      });
      setIsWordSaved(true);
      if (onWordSaved) onWordSaved(details.word);
    } catch (e) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleFavoriteSentence = async () => {
    if (isFavorited || !details) return;
    const sent = details.sentences[sentenceIndex];
    if (!sent) return;
    setIsFavoriting(true);
    try {
      await addFavoriteSentence({
        en: sent.s_content,
        zh: sent.s_cn,
        videoTitle: '生词例句 (Vocab Example)',
        time: 'Word Card',
      });
      setIsFavorited(true);
    } catch (e) {
    } finally {
      setIsFavoriting(false);
    }
  };

  const totalSentences = details?.sentences?.length || 0;

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
              {/* Word Header */}
              <div className="flex flex-col gap-1.5 mb-3 pb-3 border-b border-[#E0E0D5]/50">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <h2 className="text-xl font-bold text-[#4A4A40] tracking-tight">{details.word}</h2>
                  <div className="flex shrink-0 gap-2">
                    {details.ukspeech && (
                      <button
                        onClick={() => playAudio(details.ukspeech)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#D48166] bg-[#FCF5F3] hover:bg-[#F2E5E1] transition-colors border border-[#D48166]/20"
                        title="UK pronunciation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">UK</span>
                      </button>
                    )}
                    {details.usspeech && (
                      <button
                        onClick={() => playAudio(details.usspeech)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#5A5A40] bg-[#EAEAE0] hover:bg-[#E0E0D5] transition-colors border border-[#5A5A40]/10"
                        title="US pronunciation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">US</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Phonetic */}
                {formatPhonetic() && (
                  <p className="text-[#8A8A7A] font-mono text-xs tracking-widest">{formatPhonetic()}</p>
                )}
              </div>

              {/* Translations */}
              {details.translations.length > 0 && (
                <div className="mb-4 pl-0.5">
                  <div className="flex flex-col gap-1.5">
                    {details.translations.map((tr, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[10px] text-[#94A684] font-bold uppercase tracking-wider bg-[#F2F5F0] px-1.5 py-0.5 rounded shrink-0 mt-0.5">{tr.pos}</span>
                        <span className="text-sm text-[#4A4A40] font-medium leading-relaxed">{tr.tran_cn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentences with navigation */}
              {details.sentences.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#F5F5F0]">
                    <div className="flex items-center gap-1.5 text-[#6A6A5A] font-bold text-[11px] tracking-wide">
                      <ScrollText className="w-3.5 h-3.5 text-[#D48166]" />
                      <span>{t('video.subtitleExample')} {totalSentences > 1 && <span className="text-[#8A8A7A] font-normal ml-0.5">({sentenceIndex + 1}/{totalSentences})</span>}</span>
                    </div>
                    {totalSentences > 1 && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSentenceIndex(i => Math.max(0, i - 1))}
                          disabled={sentenceIndex === 0}
                          className="p-1 px-2.5 text-[10px] font-bold uppercase rounded-md bg-[#F5F5F0] text-[#6A6A5A] hover:bg-[#EAEAE0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setSentenceIndex(i => Math.min(totalSentences - 1, i + 1))}
                          disabled={sentenceIndex >= totalSentences - 1}
                          className="p-1 px-2.5 text-[10px] font-bold uppercase rounded-md bg-[#F5F5F0] text-[#6A6A5A] hover:bg-[#EAEAE0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-[#F9F9F7] border border-[#EAEAE0] p-3 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#94A684]/60" />
                    <p className="text-[13px] font-serif text-[#4A4A40] mb-1.5 leading-relaxed">{details.sentences[sentenceIndex]?.s_content}</p>
                    <p className="text-xs text-[#6A6A5A] leading-relaxed">{details.sentences[sentenceIndex]?.s_cn}</p>
                    <button
                      onClick={handleFavoriteSentence}
                      disabled={isFavoriting || details.sentences.length === 0}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition-all 
                                  ${isFavorited ? 'text-[#D48166] bg-[#FCF5F3]' : 'text-[#8A8A7A] bg-white opacity-0 group-hover:opacity-100 hover:text-[#D48166] hover:bg-[#FCF5F3] shadow-sm'}
                                  ${isFavoriting ? 'opacity-50' : 'active:scale-95'}`}
                      title={isFavorited ? 'Favorited' : 'Favorite sentence'}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#E0E0D5]/50 pb-1 flex-col sm:flex-row">
                <button
                  onClick={handleSaveToVocab}
                  disabled={isSaving || isWordSaved}
                  className={`flex-[2] py-2.5 rounded-lg font-semibold text-[13px] transition-all flex items-center justify-center gap-2 
                             ${isWordSaved 
                               ? 'bg-[#94A684] text-white cursor-not-allowed' 
                               : 'bg-[#5A5A40] hover:bg-[#4A4A40] text-white shadow-md shadow-[#5A5A40]/10 hover:shadow-lg hover:shadow-[#5A5A40]/20 active:scale-95'}
                             ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <BookOpen className="w-4 h-4" />
                  {isSaving ? t('video.processing', 'Saving...') : isWordSaved ? t('video.saved', '已加入生词本') : t('video.saveToVocab', 'Save to Vocabulary List')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
