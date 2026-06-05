import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ListMusic, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PracticeModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  currentTime?: number;
}

export const PracticeModeModal: React.FC<PracticeModeModalProps> = ({ isOpen, onClose, videoId, currentTime = 0 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0B0E14] rounded-t-[24px] z-[60] overflow-hidden shadow-2xl mx-auto max-w-xl border-t border-[#E0E0D5] dark:border-[#1E293B]"
          >
            <div className="p-6 pb-safe">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-serif text-[#4A4A40] dark:text-[#E2E8F0]">
                  {t('practice.title') || '选择练习模式'}
                </h2>
                <button 
                  onClick={onClose} 
                  className="p-1.5 bg-[#F9F9F7] dark:bg-[#1C222C] text-[#8A8A7A] dark:text-[#64748B] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] hover:text-[#4A4A40] dark:hover:text-[#E2E8F0] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    onClose();
                    navigate(`/practice/sentence/${videoId}`, { state: { initialTime: currentTime } });
                  }}
                  className="w-full bg-[#F5F8FA] dark:bg-[#151B25] border border-[#E0E0D5] dark:border-[#1E293B] rounded-[20px] p-5 text-left flex items-start gap-4 hover:border-[#D48166]/50 transition-all group"
                >
                  <div className="w-12 h-12 shrink-0 bg-[#F4F6F1] dark:bg-[#1C222C] text-[#94A684] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ListMusic className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-1 text-[#4A4A40] dark:text-[#E2E8F0]">{t('practice.sentenceTitle') || '跟读模式'}</h3>
                    <p className="text-[#8A8A7A] dark:text-[#94A3B8] text-sm leading-relaxed">
                      {t('practice.sentenceDesc') || '精准打磨每个发音。通过听、读、评的单句闭环，不断提升发音细节。'}
                    </p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    onClose();
                    navigate(`/practice/full/${videoId}`, { state: { initialTime: currentTime } });
                  }}
                  className="w-full bg-[#F5F8FA] dark:bg-[#151B25] border border-[#E0E0D5] dark:border-[#1E293B] rounded-[20px] p-5 text-left flex items-start gap-4 hover:border-[#D48166]/50 transition-all group"
                >
                  <div className="w-12 h-12 shrink-0 bg-[#FFF5F2] dark:bg-[#322323] text-[#D48166] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                    <Zap className="w-8 h-8 fill-current opacity-20 absolute" />
                    <Zap className="w-6 h-6 relative z-10" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-1 text-[#4A4A40] dark:text-[#E2E8F0]">{t('practice.fullTitle') || '全文挑战'}</h3>
                    <p className="text-[#8A8A7A] dark:text-[#94A3B8] text-sm leading-relaxed">
                      {t('practice.fullDesc') || '流利度影子跟读测试。不间断跟读原音，最终生成全面的发音报告分析。'}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
