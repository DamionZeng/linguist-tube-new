import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.2, 0.9, 0.3, 1] }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-white dark:bg-[#151B25] rounded-[24px] p-8 shadow-2xl border border-[#E0E0D5] dark:border-[#1E293B] max-w-[360px] w-full text-center pointer-events-auto relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-[#8A8A7A] dark:text-[#64748B] hover:text-[#4A4A40] dark:hover:text-[#E2E8F0] hover:bg-[#F9F9F7] dark:hover:bg-[#1E293B] rounded-full transition-colors"
                aria-label={t('video.close') || '关闭'}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-16 h-16 bg-[#F4F6F1] dark:bg-[#1E293B] text-[#94A684] rounded-full flex items-center justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: "backOut" }}
                >
                  <Check className="w-8 h-8" strokeWidth={3} />
                </motion.div>
              </div>

              <h2 className="text-xl font-serif font-bold text-[#5A5A40] dark:text-[#F8FAFC] mb-3 tracking-tight">
                {t('video.checkInSuccess') || '打卡成功'}
              </h2>

              <p className="text-[#848464] dark:text-[#94A3B8] text-sm mb-8 leading-relaxed">
                {t('video.checkInSuccessDesc') || '太棒了！今日的学习目标已经达成，继续保持。'}
              </p>

              <button
                onClick={onClose}
                className="w-full bg-[#D48166] text-white rounded-xl py-3.5 font-bold hover:bg-[#C27055] transition-colors active:scale-[0.98]"
              >
                {t('video.continue') || '继续学习'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
