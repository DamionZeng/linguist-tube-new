import React, { useState, useEffect } from 'react';
import { Volume2, X, Plus, Heart } from 'lucide-react';
import { Highlight } from '../types';
import { addVocabularyWord, fetchWordDetails, addFavoriteSentence } from '../api/general';
import { useTranslation } from 'react-i18next';

interface WordModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  onWordSaved?: (word: string) => void;
}

export const WordModal: React.FC<WordModalProps> = ({ isOpen, onClose, word, onWordSaved }) => {
  const { t } = useTranslation();
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
      if (onWordSaved) onWordSaved(details.word);
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
      <div className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto bg-white rounded-t-[24px] z-[70] shadow-2xl transform transition-transform animate-in slide-in-from-bottom-full overflow-hidden flex flex-col max-h-[60vh]">
        <div className="flex justify-center pt-2 pb-1.5" onClick={onClose}>
           <div className="w-10 h-1 bg-[#E0E0D5] rounded-full cursor-pointer" />
        </div>
        
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 text-[#8A8A7A] hover:bg-[#F5F5F0] rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 md:p-6 overflow-y-auto w-full">
           {loading || !details ? (
              <div className="flex items-center justify-center p-8 min-h-[25vh]"><div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" /></div>
           ) : (
             <>
               <div className="flex items-center gap-2 mb-1.5">
                 <h2 className="text-2xl font-bold text-[#4A4A40]">{details.word}</h2>
                 <button className="p-1.5 rounded-full text-[#D48166] bg-[#D48166]/10 hover:bg-[#D48166]/20 transition-colors">
                    <Volume2 className="w-4 h-4" />
                 </button>
               </div>
               
               <p className="text-[#8A8A7A] font-mono text-[15px] tracking-wide mb-3">{details.phonetic}</p>
               
               <h3 className="text-[17px] font-bold text-[#4A4A40] mb-4">{details.trans}</h3>
                              <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2 text-[#6A6A5A] font-bold text-xs">
                     <div className="w-3 h-3 bg-[#D48166] rounded-sm transform rotate-45 flex items-center justify-center opacity-80" />
                     <span>{t('video.subtitleExample')}</span>
                  </div>
                  <div className="bg-[#F9F9F7] border border-[#E0E0D5] p-3.5 rounded-xl">
                     <p className="text-[15px] font-medium text-[#4A4A40] mb-1.5 leading-relaxed">{details.example}</p>
                     <p className="text-[13px] text-[#6A6A5A] leading-relaxed">{details.exampleTrans}</p>
                  </div>
               </div>
               
               <div className="flex gap-3 mt-4 pb-2">
                  <button 
                     onClick={handleFavoriteSentence}
                     disabled={isFavoriting}
                     className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-[15px] transition-colors overflow-hidden flex flex-col items-center justify-center gap-1 leading-none ${isFavorited ? 'border-[#D48166] text-[#D48166] bg-[#D48166]/10' : 'border-[#E0E0D5] text-[#5A5A40] hover:bg-[#F5F5F0]'} ${isFavoriting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                     <span className="flex items-center gap-1.5">
                        {isFavoriting ? t('video.processing') : isFavorited ? <><Heart className="w-4 h-4 fill-current" /> {t('video.favorited')}</> : <><Heart className="w-4 h-4" /> {t('video.favorite')}</>}
                     </span>
                  </button>
                  <button 
                     onClick={handleSaveToVocab}
                     disabled={isSaving}
                     className={`flex-1 py-2.5 rounded-xl font-bold text-[15px] transition-colors flex items-center justify-center gap-1.5 ${isSaved ? 'bg-[#F5F5F0] border border-[#E0E0D5] text-[#4A4A40]' : 'bg-[#2B6DF8] hover:bg-blue-600 text-white shadow-md shadow-blue-500/20'} ${isSaving ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                     {isSaving ? t('video.processing') : isSaved ? t('video.saved') : t('video.saveToVocab')}
                  </button>
               </div>
             </>
           )}
        </div>
      </div>
    </>
  );
};
