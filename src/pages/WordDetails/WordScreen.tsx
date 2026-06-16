import React, { useState, useEffect } from 'react';
import { Volume2, Star, Trash2, Volume1 } from 'lucide-react';
import { useWordLookup } from '../../hooks/useWordLookup';
import { useTranslation } from 'react-i18next';

interface WordScreenProps {
  word: string;
  isPreloaded: boolean;
  isCurrent: boolean;
  memoryMode?: boolean;
  onReveal?: () => void;
}

type TabType = 'examples' | 'phrases' | 'synonyms' | 'relWords';

export const WordScreen: React.FC<WordScreenProps> = ({ word, isPreloaded, isCurrent, memoryMode = false, onReveal }) => {
  const {
    details,
    loading,
    notFound,
    isWordSaved,
    handleSaveToVocab,
    playAudio,
    formatPhonetic,
    speakSentence,
  } = useWordLookup({ word, enabled: isPreloaded });

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('examples');
  const [revealed, setRevealed] = useState(false);

  // Reset revealed when word changes (memory mode re-hides)
  useEffect(() => {
    setRevealed(false);
  }, [word]);

  useEffect(() => {
    if (details) {
      if (details.sentences.length > 0) setActiveTab('examples');
      else if (details.phrases.length > 0) setActiveTab('phrases');
      else if (details.synonyms.length > 0) setActiveTab('synonyms');
      else if (details.relWords.length > 0) setActiveTab('relWords');
    }
  }, [details]);

  if (!isPreloaded) {
    return <div className="w-full min-h-[100dvh]" />;
  }

  if (loading) {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center p-12 relative bg-transparent">
        {isCurrent && <div className="w-10 h-10 rounded-full border-4 border-[#E0E0D5] dark:border-[#334155] border-t-[#D48166] animate-spin mb-4" />}
      </div>
    );
  }

  if (notFound || !details) {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center p-12 relative bg-transparent">
        <div className="w-16 h-16 rounded-full bg-[#F5F5F0] dark:bg-[#1C222C] flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-[#8A8A7A] dark:text-[#64748B]" />
        </div>
        <h2 className="text-2xl font-bold text-[#4A4A40] dark:text-[#E2E8F0] mb-2">{word}</h2>
        <p className="text-[#8A8A7A] dark:text-[#64748B]">未找到该单词的释义</p>
      </div>
    );
  }

  const phonetic = formatPhonetic();
  const hideContent = memoryMode && !revealed;

  const handleReveal = () => {
    if (hideContent) {
      setRevealed(true);
      onReveal?.();
    }
  };

  return (
    <div className="w-full h-full relative bg-transparent flex flex-col font-sans overflow-hidden" onClick={handleReveal}>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 pt-24 safe-area-pb">
        <div className="px-6 flex flex-col items-center">
          {/* Word Title & Audio */}
          <h1 className="text-[42px] md:text-[56px] font-bold tracking-tight text-center mb-1 font-serif text-[#2A2A20] dark:text-[#F8FAFC]">
            {details.word}
          </h1>
          
          <div className="flex flex-col items-center gap-1.5 mb-6">
            {details.ukphone && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A6A] dark:text-[#94A3B8] bg-[#EAEAE0] dark:bg-[#1E293B] px-2 py-0.5 rounded">UK</span>
                <span className="text-sm font-mono text-[#7A7A6A] dark:text-[#94A3B8] tracking-wider">/{details.ukphone}/</span>
                {details.ukspeech && (
                  <button
                    onClick={(e) => { e.stopPropagation(); playAudio(details.ukspeech); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#E8EAD0] dark:bg-[#1E293B] text-[#7A8A54] hover:bg-[#DCE0B8] dark:hover:bg-[#334155] active:scale-95 transition-all outline-none"
                  >
                    <Volume2 className="w-3.5 h-3.5 ml-[1px]" />
                  </button>
                )}
              </div>
            )}
            {details.usphone && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A6A] dark:text-[#94A3B8] bg-[#EAEAE0] dark:bg-[#1E293B] px-2 py-0.5 rounded">US</span>
                <span className="text-sm font-mono text-[#7A7A6A] dark:text-[#94A3B8] tracking-wider">/{details.usphone}/</span>
                {details.usspeech && (
                  <button
                    onClick={(e) => { e.stopPropagation(); playAudio(details.usspeech); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#E8EAD0] dark:bg-[#1E293B] text-[#7A8A54] hover:bg-[#DCE0B8] dark:hover:bg-[#334155] active:scale-95 transition-all outline-none"
                  >
                    <Volume2 className="w-3.5 h-3.5 ml-[1px]" />
                  </button>
                )}
              </div>
            )}
            {!details.ukphone && !details.usphone && phonetic && (
              <span className="text-sm font-mono text-[#7A7A6A] dark:text-[#94A3B8] tracking-wider">{phonetic}</span>
            )}
          </div>

          {/* Memory mode: show hint to tap */}
          {hideContent && (
            <div className="mt-8 animate-pulse">
              <p className="text-[#7A7A6A] dark:text-[#94A3B8] text-sm font-medium">{t('vocab.tapToReveal')}</p>
            </div>
          )}

          {/* Hidden content in memory mode */}
          {hideContent ? null : (
            <>
          {/* Translations */}
          {details.translations.length > 0 && (
            <div className="w-full max-w-lg mx-auto flex flex-col gap-4 mb-10">
              {details.translations.map((tr, i) => (
                <div key={i} className="flex items-start gap-3 w-full">
                  <span className="bg-[#2A2A20] dark:bg-[#334155] text-[#F4F5EF] text-[11px] font-bold px-2 py-0.5 rounded-sm lowercase tracking-wide shrink-0 font-serif mt-1">
                    {tr.pos}
                  </span>
                  <span className="text-[17px] md:text-[19px] font-medium text-[#3A3A30] dark:text-[#E2E8F0] leading-relaxed">
                    {tr.tran_cn}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Custom Tabs */}
          <div className="w-full max-w-lg mx-auto mb-6">
             <div className="flex items-center justify-center gap-6 md:gap-8 border-b border-[#E0E0D5]/60 dark:border-[#1E293B]/60 pb-3">
               {[
                 { id: 'examples', label: '例句', show: details.sentences.length > 0 },
                 { id: 'phrases', label: '短语', show: details.phrases.length > 0 },
                 { id: 'relWords', label: '派生', show: details.relWords.length > 0 },
                 { id: 'synonyms', label: '近义', show: details.synonyms.length > 0 },
               ].map(tab => tab.show && (
                 <button 
                    key={tab.id}
                    onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id as TabType); }}
                    className={`text-sm md:text-base font-bold transition-all relative ${activeTab === tab.id ? 'text-[#7A8A54]' : 'text-[#7A7A6A] dark:text-[#94A3B8] hover:text-[#7A8A54]/70'}`}
                 >
                   {tab.label}
                   {activeTab === tab.id && (
                     <div className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-[#7A8A54] rounded-t-full" />
                   )}
                 </button>
               ))}
             </div>
          </div>

          {/* Tab Content */}
          <div className="w-full max-w-lg mx-auto min-h-[300px]">
             {activeTab === 'examples' && details.sentences.length > 0 && (
               <div className="flex flex-col gap-6">
                 {details.sentences.map((sentence, idx) => (
                   <div key={idx} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#2A2A20] dark:bg-[#334155] text-[#F4F5EF] text-[10px] font-bold px-1.5 py-0.5 rounded font-mono italic">
                          example {idx + 1}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); speakSentence(sentence.s_content); }} className="text-[#7A7A6A] dark:text-[#94A3B8] p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all">
                           <Volume1 className="w-4 h-4 text-[#7A8A54]" />
                        </button>
                      </div>
                      <p className="text-[17px] md:text-[18px] text-[#2A2A20] dark:text-[#E2E8F0] leading-relaxed mb-1.5 font-serif">
                        {sentence.s_content}
                      </p>
                      <p className="text-[14px] md:text-[15px] text-[#8A8A7A] dark:text-[#64748B]">
                        {sentence.s_cn}
                      </p>
                   </div>
                 ))}
               </div>
             )}

             {activeTab === 'phrases' && details.phrases.length > 0 && (
               <div className="flex flex-col gap-5">
                 {details.phrases.map((phrase, idx) => (
                   <div key={idx} className="flex flex-col">
                      <p className="text-[16px] md:text-[18px] text-[#2A2A20] dark:text-[#E2E8F0] font-bold mb-1">
                        {phrase.p_content}
                      </p>
                      <p className="text-[14px] md:text-[15px] text-[#8A8A7A] dark:text-[#64748B]">
                        {phrase.p_cn}
                      </p>
                   </div>
                 ))}
               </div>
             )}
             
             {activeTab === 'synonyms' && details.synonyms.length > 0 && (
               <div className="flex flex-col gap-5">
                 {details.synonyms.map((syn, idx) => (
                   <div key={idx} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-[#7A8A54] border border-[#7A8A54]/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{syn.pos}</span>
                        <span className="text-[#6A6A5A] text-sm">{syn.tran}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {syn.Hwds.map((hw, j) => (
                          <span key={j} className="bg-white/60 dark:bg-[#1C222C]/60 px-3 py-1.5 rounded-lg border border-[#E0E0D5] dark:border-[#334155] text-sm font-medium text-[#3A3A30] dark:text-[#E2E8F0]">
                            {hw.word || hw.hwd}
                          </span>
                        ))}
                      </div>
                   </div>
                 ))}
               </div>
             )}

             {activeTab === 'relWords' && details.relWords.length > 0 && (
               <div className="flex flex-col gap-5">
                 {details.relWords.map((rw, idx) => (
                   <div key={idx} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-[#7A8A54] border border-[#7A8A54]/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{rw.Pos}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rw.Hwds.map((h, j) => (
                          <span key={j} className="flex items-center gap-2 bg-white/60 dark:bg-[#1C222C]/60 px-3 py-1.5 rounded-lg border border-[#E0E0D5] dark:border-[#334155]">
                            <span className="text-[14px] font-medium text-[#3A3A30] dark:text-[#E2E8F0]">{h.hwd}</span>
                            {h.tran && <span className="text-[#8A8A7A] dark:text-[#64748B] text-[12px] border-l border-[#E0E0D5] dark:border-[#334155] pl-2">{h.tran}</span>}
                          </span>
                        ))}
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

