import React, { useState, useEffect } from 'react';
import { Volume2, Heart, ChevronDown, ChevronUp, BookOpen, GitBranch, ScrollText, Lightbulb, ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { addVocabularyWord, fetchWordLookup, addFavoriteSentence } from '@api/general';
import { useTranslation } from 'react-i18next';

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

export const WordDetailsPage: React.FC = () => {
  const { word } = useParams<{ word: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [details, setDetails] = useState<WordLookupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showRelWords, setShowRelWords] = useState(false);
  const [sentenceIndex, setSentenceIndex] = useState(0);

  useEffect(() => {
    if (word) {
      setLoading(true);
      setShowPhrases(false);
      setShowSynonyms(false);
      setShowRelWords(false);
      setSentenceIndex(0);

      fetchWordLookup(word)
        .then(data => {
          setDetails(data);
          setLoading(false);
        })
        .catch(() => {
          setDetails(null);
          setLoading(false);
        });

      setIsFavorited(false);
    }
  }, [word]);

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
    if (!details) return;
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
        time: 'Word Details',
      });
      setIsFavorited(true);
    } catch (e) {
    } finally {
      setIsFavoriting(false);
    }
  };

  const totalSentences = details?.sentences?.length || 0;

  return (
    <div className="w-full h-full bg-[#F5F5F0] overflow-y-auto w-full relative pb-20 md:pb-6 font-sans">
      <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
         <div className="sticky top-0 z-10 bg-[#F5F5F0]/90 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 border-b md:border-none border-[#E0E0D5]">
           <button 
             onClick={() => navigate(-1)} 
             className="flex items-center gap-2 text-[#6A6A5A] hover:text-[#4A4A40] transition-colors"
           >
             <ArrowLeft className="w-6 h-6" />
             <span className="font-bold text-lg">{t('common.back', 'Back')}</span>
           </button>
         </div>

        {loading || !details ? (
          <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
            <Loader2 className="w-10 h-10 text-[#D48166] animate-spin mb-4" />
            <p className="text-[#8A8A7A] font-medium">{t('common.loading', 'Loading details...')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#E0E0D5] mt-4 md:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Word Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-[#E0E0D5]/50">
              <div>
                <div className="flex items-center gap-3 mb-2 overflow-x-auto pb-1">
                  <h2 className="text-4xl md:text-5xl font-bold text-[#4A4A40] tracking-tight">{details.word}</h2>
                  <div className="flex shrink-0 gap-2">
                    {details.ukspeech && (
                      <button
                        onClick={() => playAudio(details.ukspeech)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[#D48166] bg-[#FCF5F3] hover:bg-[#F2E5E1] transition-colors border border-[#D48166]/20"
                        title="UK pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">UK</span>
                      </button>
                    )}
                    {details.usspeech && (
                      <button
                        onClick={() => playAudio(details.usspeech)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[#5A5A40] bg-[#EAEAE0] hover:bg-[#E0E0D5] transition-colors border border-[#5A5A40]/10"
                        title="US pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">US</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Phonetic */}
                {formatPhonetic() && (
                  <p className="text-[#8A8A7A] font-mono text-sm tracking-widest">{formatPhonetic()}</p>
                )}
              </div>
            </div>

            {/* Translations */}
            {details.translations.length > 0 && (
              <div className="mb-8 pl-1">
                <div className="flex flex-col gap-3">
                  {details.translations.map((tr, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[12px] text-[#94A684] font-bold uppercase tracking-wider bg-[#F2F5F0] px-2 py-1 rounded shrink-0 mt-0.5">{tr.pos}</span>
                      <span className="text-lg text-[#4A4A40] font-medium leading-relaxed">{tr.tran_cn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sentences with navigation */}
            {details.sentences.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3 border-b-2 border-[#F5F5F0] pb-2">
                  <div className="flex items-center gap-2 text-[#6A6A5A] font-bold text-sm tracking-wide">
                    <ScrollText className="w-4 h-4 text-[#D48166]" />
                    <span>{t('video.subtitleExample', 'Example Sentences')} {totalSentences > 1 && <span className="text-[#8A8A7A] font-normal ml-1">({sentenceIndex + 1}/{totalSentences})</span>}</span>
                  </div>
                  {totalSentences > 1 && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSentenceIndex(i => Math.max(0, i - 1))}
                        disabled={sentenceIndex === 0}
                        className="p-1 px-2.5 text-xs font-bold uppercase rounded-lg bg-[#F5F5F0] text-[#6A6A5A] hover:bg-[#EAEAE0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setSentenceIndex(i => Math.min(totalSentences - 1, i + 1))}
                        disabled={sentenceIndex >= totalSentences - 1}
                        className="p-1 px-2.5 text-xs font-bold uppercase rounded-lg bg-[#F5F5F0] text-[#6A6A5A] hover:bg-[#EAEAE0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
                <div className="bg-[#F9F9F7] border border-[#EAEAE0] p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#94A684]/60" />
                  <p className="text-[16px] md:text-[18px] font-serif text-[#4A4A40] mb-2.5 leading-relaxed">{details.sentences[sentenceIndex]?.s_content}</p>
                  <p className="text-[14px] md:text-[15px] text-[#6A6A5A] leading-relaxed">{details.sentences[sentenceIndex]?.s_cn}</p>
                  <button
                    onClick={handleFavoriteSentence}
                    disabled={isFavoriting || details.sentences.length === 0}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-all 
                                ${isFavorited ? 'text-[#D48166] bg-[#FCF5F3]' : 'text-[#8A8A7A] bg-white opacity-0 group-hover:opacity-100 hover:text-[#D48166] hover:bg-[#FCF5F3] shadow-sm'}
                                ${isFavoriting ? 'opacity-50' : 'active:scale-95'}`}
                    title={isFavorited ? 'Favorited' : 'Favorite sentence'}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Synonyms - Expandable */}
            {details.synonyms.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowSynonyms(!showSynonyms)}
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

            {/* Related Words (同根词) - Expandable */}
            {details.relWords.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowRelWords(!showRelWords)}
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

            {/* Common Phrases - Expandable */}
            {details.phrases.length > 0 && (
              <div className="mb-8">
                <button
                  onClick={() => setShowPhrases(!showPhrases)}
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

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-[#EAEAE0] flex flex-col md:flex-row gap-4">
              <button
                onClick={handleSaveToVocab}
                disabled={isSaving}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 
                           bg-[#5A5A40] hover:bg-[#4A4A40] text-white shadow-lg shadow-[#5A5A40]/10
                           hover:shadow-xl hover:shadow-[#5A5A40]/20 active:scale-95
                           ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <BookOpen className="w-5 h-5" />
                {isSaving ? t('video.processing', 'Saving...') : t('video.saveToVocab', 'Save to Vocabulary List')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
