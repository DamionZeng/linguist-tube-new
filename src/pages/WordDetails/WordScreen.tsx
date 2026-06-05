import React, { useState, useEffect } from 'react';
import { Volume2, Star, Trash2, Volume1 } from 'lucide-react';
import { useWordLookup } from '../../hooks/useWordLookup';

interface WordScreenProps {
  word: string;
  isPreloaded: boolean;
  isCurrent: boolean;
}

type TabType = 'examples' | 'phrases' | 'synonyms' | 'relWords';

export const WordScreen: React.FC<WordScreenProps> = ({ word, isPreloaded, isCurrent }) => {
  const {
    details,
    loading,
    isWordSaved,
    handleSaveToVocab,
    playAudio,
    formatPhonetic,
  } = useWordLookup({ word, enabled: isPreloaded });

  const [activeTab, setActiveTab] = useState<TabType>('examples');

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

  if (loading || !details) {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center p-12 relative bg-transparent">
        {isCurrent && <div className="w-10 h-10 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin mb-4" />}
      </div>
    );
  }

  const phonetic = formatPhonetic();

  return (
    <div className="w-full h-full relative bg-transparent flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 pt-24 safe-area-pb">
        <div className="px-6 flex flex-col items-center">
          {/* Word Title & Audio */}
          <h1 className="text-[42px] md:text-[56px] font-bold tracking-tight text-center mb-1 font-serif text-[#2A2A20]">
            {details.word}
          </h1>
          
          <div className="flex items-center gap-3 mb-6">
            {phonetic && (
              <span className="text-sm font-mono text-[#7A7A6A] tracking-wider">{phonetic}</span>
            )}
            {(details.usspeech || details.ukspeech) && (
              <button
                onClick={() => playAudio(details.usspeech || details.ukspeech)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E8EAD0] text-[#7A8A54] hover:bg-[#DCE0B8] active:scale-95 transition-all outline-none"
              >
                <Volume2 className="w-4 h-4 ml-[1px]" />
              </button>
            )}
          </div>

          {/* Translations */}
          {details.translations.length > 0 && (
            <div className="w-full max-w-lg mx-auto flex flex-col gap-4 mb-10">
              {details.translations.map((tr, i) => (
                <div key={i} className="flex items-start gap-3 w-full">
                  <span className="bg-[#2A2A20] text-[#F4F5EF] text-[11px] font-bold px-2 py-0.5 rounded-sm lowercase tracking-wide shrink-0 font-serif mt-1">
                    {tr.pos}
                  </span>
                  <span className="text-[17px] md:text-[19px] font-medium text-[#3A3A30] leading-relaxed">
                    {tr.tran_cn}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Custom Tabs */}
          <div className="w-full max-w-lg mx-auto mb-6">
             <div className="flex items-center justify-center gap-6 md:gap-8 border-b border-[#E0E0D5]/60 pb-3">
               {[
                 { id: 'examples', label: '例句', show: details.sentences.length > 0 },
                 { id: 'phrases', label: '短语', show: details.phrases.length > 0 },
                 { id: 'relWords', label: '派生', show: details.relWords.length > 0 },
                 { id: 'synonyms', label: '近义', show: details.synonyms.length > 0 },
               ].map(tab => tab.show && (
                 <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`text-sm md:text-base font-bold transition-all relative ${activeTab === tab.id ? 'text-[#7A8A54]' : 'text-[#A0A090] hover:text-[#7A8A54]/70'}`}
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
                        <span className="bg-[#2A2A20] text-[#F4F5EF] text-[10px] font-bold px-1.5 py-0.5 rounded font-mono italic">
                          example {idx + 1}
                        </span>
                        <button onClick={() => {}} className="text-[#A0A090] p-1 rounded-full hover:bg-black/5">
                           <Volume1 className="w-4 h-4 text-[#7A8A54]" />
                        </button>
                      </div>
                      <p className="text-[17px] md:text-[18px] text-[#2A2A20] leading-relaxed mb-1.5 font-serif">
                        {sentence.s_content}
                      </p>
                      <p className="text-[14px] md:text-[15px] text-[#8A8A7A]">
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
                      <p className="text-[16px] md:text-[18px] text-[#2A2A20] font-bold mb-1">
                        {phrase.p_content}
                      </p>
                      <p className="text-[14px] md:text-[15px] text-[#8A8A7A]">
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
                          <span key={j} className="bg-white/60 px-3 py-1.5 rounded-lg border border-[#E0E0D5] text-sm font-medium text-[#3A3A30]">
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
                          <span key={j} className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-lg border border-[#E0E0D5]">
                            <span className="text-[14px] font-medium text-[#3A3A30]">{h.hwd}</span>
                            {h.tran && <span className="text-[#8A8A7A] text-[12px] border-l border-[#E0E0D5] pl-2">{h.tran}</span>}
                          </span>
                        ))}
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

