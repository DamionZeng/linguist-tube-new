import React, { useState, useEffect } from 'react';
import { Volume2, X, Plus, Star } from 'lucide-react';
import { Highlight } from '../types';
import { addVocabularyWord, fetchWordDetails, addFavoriteSentence } from '../api/general';

interface WordModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
}

export const WordModal: React.FC<WordModalProps> = ({ isOpen, onClose, word }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && word) {
      setLoading(true);
      fetchWordDetails(word).then(data => {
        setDetails(data);
        setIsSaved(data.isSaved || false);
        setLoading(false);
      });
      setIsFavorited(false);
    } else {
      setDetails(null);
    }
  }, [isOpen, word]);

  if (!isOpen) return null;

  const handleSaveToVocab = async () => {
    if (isSaved || !details) return; // already saved in current session
    setIsSaving(true);
    try {
      await addVocabularyWord({
         word: details.word,
         phonetic: details.phonetic,
         trans: details.trans,
         mean: details.mean,
         pos: details.pos,
         example: details.example,
         exampleTrans: details.exampleTrans
      });
      setIsSaved(true);
    } catch (e) {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleFavoriteSentence = async () => {
    if (isFavorited || !details) return;
    setIsFavoriting(true);
    try {
      await addFavoriteSentence({
        en: details.example,
        zh: details.exampleTrans,
        videoTitle: '生词例句 (Vocab Example)',
        time: 'Word Card'
      });
      setIsFavorited(true);
    } catch (e) {
      // Handle error
    } finally {
      setIsFavoriting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto bg-white rounded-t-[32px] z-[70] shadow-2xl transform transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
           <div className="w-12 h-1.5 bg-[#E0E0D5] rounded-full cursor-pointer" />
        </div>
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[#8A8A7A] hover:bg-[#F5F5F0] rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="p-6 md:p-8 overflow-y-auto w-full min-h-[50vh]">
           {loading || !details ? (
              <div className="h-full flex items-center justify-center p-10"><div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" /></div>
           ) : (
             <>
               <div className="flex items-center gap-3 mb-2">
                 <h2 className="text-4xl font-bold text-[#4A4A40]">{details.word}</h2>
                 <button className="p-2 rounded-full text-[#D48166] bg-[#D48166]/10 hover:bg-[#D48166]/20 transition-colors">
                    <Volume2 className="w-[22px] h-[22px]" />
                 </button>
               </div>
               
               <p className="text-[#8A8A7A] font-mono text-lg tracking-wide mb-6">{details.phonetic}</p>
               
               <h3 className="text-2xl font-bold text-[#4A4A40] mb-8">{details.trans}</h3>
               
               <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3 text-[#6A6A5A] font-bold text-sm">
                     <div className="w-4 h-4 bg-[#D48166] rounded-sm transform rotate-45 flex items-center justify-center opacity-80" />
                     <span>字幕例句 (Example from Subtitle)</span>
                  </div>
                  <div className="bg-[#F9F9F7] border border-[#E0E0D5] p-5 rounded-2xl">
                     <p className="text-[17px] font-medium text-[#4A4A40] mb-2 leading-relaxed">{details.example}</p>
                     <p className="text-[14px] text-[#6A6A5A] leading-relaxed">{details.exampleTrans}</p>
                  </div>
               </div>
               
               <div className="flex gap-4 mt-8 pb-4">
                  <button 
                     onClick={handleFavoriteSentence}
                     disabled={isFavoriting}
                     className={`flex-1 py-3.5 rounded-2xl border-2 font-bold text-lg transition-colors overflow-hidden flex flex-col items-center justify-center gap-1 leading-none ${isFavorited ? 'border-[#E1B12C] text-[#E1B12C] bg-[#E1B12C]/10' : 'border-[#E0E0D5] text-[#5A5A40] hover:bg-[#F5F5F0]'} ${isFavoriting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                     <span className="flex items-center gap-2">
                        {isFavoriting ? '处理中...' : isFavorited ? <><Star className="w-5 h-5 fill-current" /> 已收藏</> : <><Star className="w-5 h-5" /> 收藏</>}
                     </span>
                  </button>
                  <button 
                     onClick={handleSaveToVocab}
                     disabled={isSaving}
                     className={`flex-1 py-3.5 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2 ${isSaved ? 'bg-[#F5F5F0] border border-[#E0E0D5] text-[#4A4A40]' : 'bg-[#2B6DF8] hover:bg-blue-600 text-white shadow-md shadow-blue-500/20'} ${isSaving ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                     {isSaving ? '处理中...' : isSaved ? '已加入' : '生词本'}
                  </button>
               </div>
             </>
           )}
        </div>
      </div>
    </>
  );
};
