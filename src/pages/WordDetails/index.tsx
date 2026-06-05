import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchVocabularyData, deleteVocabularyWord, updateVocabMastery } from '@api/general';
import { useAuth } from '../../context/AuthContext';
import { WordScreen } from './WordScreen';
import { ArrowLeft, Maximize, ThumbsUp, ThumbsDown, Trash2, Eye, EyeOff, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { prefetchWord } from '../../hooks/useWordLookup';

const Sparkles: React.FC<{ progress: number }> = ({ progress }) => {
  const numSparkles = Math.floor(progress * 12); 
  
  return (
    <div className="absolute left-1/2 -translate-x-1/2 w-[40px] h-[40px] -mt-[20px] overflow-visible pointer-events-none z-40 transition-all duration-300" style={{ top: `${progress * 100}%`}}>
       {Array.from({ length: numSparkles }).map((_, i) => (
         <div 
           key={i}
           className="absolute w-[3px] h-[3px] bg-[#FFD700] rounded-full animate-ping opacity-80"
           style={{
             top: `${15 + (Math.random() - 0.5) * 30}px`,
             left: `${15 + (Math.random() - 0.5) * 30}px`,
             animationDuration: `${0.4 + Math.random() * 0.8}s`,
             animationDelay: `${Math.random() * 0.5}s`,
             transform: `scale(${0.5 + Math.random() * 0.8})`
           }}
         />
       ))}
    </div>
  );
};

const BottomActions: React.FC<{
  onDelete: () => void;
  isDeleting: boolean;
  currentWord: string;
  currentVocabId: string;
  onMastery: (vocabId: string, direction: number) => Promise<void>;
  isUpdatingMastery: boolean;
  canGoNext: boolean;
  lastMasteryClick: number | null;
}> = ({ onDelete, isDeleting, currentWord, currentVocabId, onMastery, isUpdatingMastery, canGoNext, lastMasteryClick }) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirm(false);
    onDelete();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      {/* Confirm Modal Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 animate-in fade-in duration-150">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleCancel} />
          <div className="relative bg-white rounded-2xl px-6 pt-6 pb-5 max-w-[320px] w-full shadow-xl animate-in zoom-in-95 fade-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#FCF0EC] flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-[#D48166]" />
              </div>
              <h3 className="text-base font-bold text-[#4A4A40] mb-1">确定删除？</h3>
              <p className="text-sm text-[#8A8A7A] leading-relaxed mb-5">
                将从生词本中移除 <span className="text-[#D48166] font-semibold">"{currentWord}"</span>
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 px-4 text-sm font-bold text-[#6A6A5A] bg-[#F5F5F0] rounded-xl hover:bg-[#EAEAE0] transition-colors active:scale-95"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-4 text-sm font-bold text-white bg-[#D48166] rounded-xl hover:bg-[#C07050] transition-colors active:scale-95"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center gap-4 z-50 pointer-events-none">
         <div className="bg-[#F4F5EF]/95 backdrop-blur-md px-5 py-3 rounded-full flex items-center gap-4 shadow-lg shadow-black/5 border border-white/50 pointer-events-auto">
           {/* 陌生按钮 */}
           <button
             onClick={async () => {
               if (currentVocabId !== 'direct') {
                 await onMastery(currentVocabId, -1);
               }
             }}
             disabled={isUpdatingMastery || currentVocabId === 'direct'}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all bg-white border active:scale-95
               ${lastMasteryClick === -1
                 ? 'bg-red-100 border-red-300 text-[#E74C3C] shadow-sm shadow-red-200'
                 : lastMasteryClick === 1
                   ? 'border-[#E0E0D5] text-[#C0C0B5] opacity-50'
                   : 'border-[#E0E0D5] hover:bg-red-50 hover:border-red-200 text-[#E74C3C]'}
               ${isUpdatingMastery || currentVocabId === 'direct' ? 'opacity-50 cursor-not-allowed' : ''}`}
             title="不熟悉"
           >
             <ThumbsDown className="w-5 h-5" />
           </button>

           {/* 删除 */}
           <button
             onClick={handleDeleteClick}
             disabled={isDeleting}
             className="w-10 h-10 rounded-full flex items-center justify-center bg-white hover:bg-[#F9F9F7] active:scale-95 transition-all text-[#D48166] border border-[#E0E0D5]"
           >
             {isDeleting ? (
               <div className="w-4 h-4 rounded-full border-2 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
             ) : (
               <Trash2 className="w-4 h-4" />
             )}
           </button>

           {/* 熟悉按钮 */}
           <button
             onClick={async () => {
               if (currentVocabId !== 'direct') {
                 await onMastery(currentVocabId, 1);
               }
             }}
             disabled={isUpdatingMastery || currentVocabId === 'direct'}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all bg-white border active:scale-95
               ${lastMasteryClick === 1
                 ? 'bg-green-100 border-green-300 text-[#2ECC71] shadow-sm shadow-green-200'
                 : lastMasteryClick === -1
                   ? 'border-[#E0E0D5] text-[#C0C0B5] opacity-50'
                   : 'border-[#E0E0D5] hover:bg-green-50 hover:border-green-200 text-[#2ECC71]'}
               ${isUpdatingMastery || currentVocabId === 'direct' ? 'opacity-50 cursor-not-allowed' : ''}`}
             title="熟悉"
           >
             <ThumbsUp className="w-5 h-5" />
           </button>
         </div>
      </div>
    </>
  );
};

const flipVariants = {
  enter: (direction: number) => ({
    rotateX: direction > 0 ? -90 : 90,
    opacity: 0,
    originY: direction > 0 ? 1 : 0, 
    y: direction > 0 ? "50%" : "-50%",
    scale: 0.9,
    z: -300
  }),
  center: {
    rotateX: 0,
    opacity: 1,
    y: 0,
    scale: 1,
    originY: 0.5,
    z: 0
  },
  exit: (direction: number) => ({
    rotateX: direction < 0 ? -90 : 90,
    opacity: 0,
    originY: direction < 0 ? 1 : 0,
    y: direction < 0 ? "50%" : "-50%",
    scale: 0.9,
    z: -300
  })
};

export const WordDetailsPage: React.FC = () => {
  const { word } = useParams<{ word: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [vocabList, setVocabList] = useState<{word: string; id: string}[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [direction, setDirection] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingMastery, setIsUpdatingMastery] = useState(false);
  const [memoryMode, setMemoryMode] = useState(true);
  const [lastMasteryClick, setLastMasteryClick] = useState<number | null>(null);
  const [allReviewed, setAllReviewed] = useState(false);

  // Initialize the list
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoadingList(true);
      try {
        let words: {word: string; id: string; added?: string | null}[] = [];
        if (user?.role === 'vip') {
          // Check if ids query param exists (from smart recommend)
          const idsParam = searchParams.get('ids');
          if (idsParam) {
            const ids = idsParam.split(',').filter(Boolean);
            const res = await fetchVocabularyData(ids);
            if (res) {
              words = res as any[];
              // Reorder to match the IDs sequence from recommend mode
              const idOrder = new Map(words.map((w: any, i: number) => [w.id, i]));
              words.sort((a: any, b: any) =>
                (ids.indexOf(a.id) !== -1 ? ids.indexOf(a.id) : 999) -
                (ids.indexOf(b.id) !== -1 ? ids.indexOf(b.id) : 999)
              );
            }
          } else {
            const res = await fetchVocabularyData();
            if (res) words = res as any[];
          }
        }
        
        // Sort by added desc only when not in recommended mode
        if (!idsParam) {
          words.sort((a, b) => {
            const aTime = a.added ? new Date(a.added).getTime() : 0;
            const bTime = b.added ? new Date(b.added).getTime() : 0;
            return bTime - aTime;
          });
        }
        
        if (mounted) {
          const foundIdx = words.findIndex(w => w.word.toLowerCase() === word?.toLowerCase());
          
          if (foundIdx !== -1) {
             setVocabList(words);
             setActiveIndex(foundIdx);
          } else {
             setVocabList([{ word: word || '', id: 'direct' }]);
             setActiveIndex(0);
          }
        }
      } catch (err) {
        if (mounted) {
           setVocabList([{ word: word || '', id: 'direct' }]);
           setActiveIndex(0);
        }
      } finally {
        if (mounted) setLoadingList(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, [word, user, searchParams]);

  // 预加载邻居单词：首位只预加载下一个，末位只预加载上一个，中间预加载两边
  useEffect(() => {
    if (vocabList.length === 0) return;

    const words = vocabList.map((v) => v.word);
    const isFirst = activeIndex === 0;
    const isLast = activeIndex === vocabList.length - 1;

    // 始终预加载当前单词
    prefetchWord(words[activeIndex]);

    // 第一个单词：只预加载下一个
    if (!isFirst) {
      prefetchWord(words[activeIndex - 1]);
    }

    // 最后一个单词：只预加载上一个
    if (!isLast) {
      prefetchWord(words[activeIndex + 1]);
    }
  }, [vocabList, activeIndex]);

  const paginate = useCallback((newDirection: number) => {
    setActiveIndex(prev => {
      const nextIndex = prev + newDirection;
      if (nextIndex >= 0 && nextIndex < vocabList.length) {
        setDirection(newDirection);
        // Use setTimeout to avoid setState during render
        const nextWord = vocabList[nextIndex].word;
        setTimeout(() => {
          window.history.replaceState(null, '', `/vocab/${nextWord}`);
        }, 0);
        return nextIndex;
      }
      return prev;
    });
  }, [vocabList]);

  const handleDelete = async () => {
    const current = vocabList[activeIndex];
    if (!current || current.id === 'direct') return;
    setIsDeleting(true);
    try {
      await deleteVocabularyWord(current.id);
      const nextList = vocabList.filter((_, i) => i !== activeIndex);
      if (nextList.length === 0) {
        navigate('/vocab', { replace: true });
        return;
      }
      setVocabList(nextList);
      const newIndex = activeIndex >= nextList.length ? nextList.length - 1 : activeIndex;
      setActiveIndex(newIndex);
      setDirection(0);
      window.history.replaceState(null, '', `/vocab/${nextList[newIndex].word}`);
    } catch (e) {
      console.error('Failed to delete word', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMastery = useCallback(async (vocabId: string, direction: number) => {
    if (vocabId === 'direct') return;
    setLastMasteryClick(direction);
    setIsUpdatingMastery(true);
    try {
      await updateVocabMastery(vocabId, direction);
    } catch (e) {
      console.error('Failed to update mastery', e);
    } finally {
      setIsUpdatingMastery(false);
    }
    // 最后一个单词 → 显示完成页面；否则切换到下一个
    if (activeIndex >= vocabList.length - 1) {
      setAllReviewed(true);
    } else {
      const nextIndex = activeIndex + 1;
      setDirection(1);
      setActiveIndex(nextIndex);
      setLastMasteryClick(null);
      window.history.replaceState(null, '', `/vocab/${vocabList[nextIndex].word}`);
    }
  }, [activeIndex, vocabList]);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < vocabList.length - 1;

  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe/wheel handler: let browser scroll naturally, only intercept at boundaries
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getScrollState = () => {
      const sc = el.querySelector('.no-scrollbar') as HTMLDivElement | null;
      if (!sc) return { atTop: true, atBottom: true };
      return {
        atTop: sc.scrollTop <= 1,
        atBottom: sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 3,
      };
    };

    // --- Touch: detect swipe on touchend ---
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(deltaX) > Math.abs(deltaY) * 0.6) return;
      if (Math.abs(deltaY) < 50) return;

      const { atTop, atBottom } = getScrollState();
      if (deltaY > 0 && atTop) paginate(-1);
      else if (deltaY < 0 && atBottom) paginate(1);
    };

    // --- Wheel ---
    const onWheel = (e: WheelEvent) => {
      const { atTop, atBottom } = getScrollState();
      if (e.deltaY < 0 && atTop) { e.preventDefault(); paginate(-1); }
      else if (e.deltaY > 0 && atBottom) { e.preventDefault(); paginate(1); }
    };

    // --- Keyboard ---
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); paginate(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); paginate(1); }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [paginate]);

  if (loadingList) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center p-12 relative bg-[#F4F5EF]">
        <div className="w-10 h-10 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin mb-4" />
      </div>
    );
  }

  const progressPercentage = vocabList.length > 1 ? activeIndex / (vocabList.length - 1) : 0;
  const currentWord = vocabList[activeIndex]?.word || word || '';

  // All reviewed — congratulations page
  if (allReviewed) {
    return (
      <div className="w-full h-[100dvh] bg-[#F4F5EF] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#7A8A54]/10 flex items-center justify-center mb-6">
            <PartyPopper className="w-10 h-10 text-[#7A8A54]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#4A4A40] mb-3">
            🎉 太棒了！
          </h1>
          <p className="text-[#8A8A7A] text-base leading-relaxed max-w-xs mb-8">
            所有单词已复习完毕，继续保持学习的好习惯！
          </p>
          <button
            onClick={() => navigate('/vocab')}
            className="bg-[#5A5A40] text-white px-8 py-3 rounded-2xl font-bold text-base hover:bg-[#4A4A40] transition-colors active:scale-95 shadow-md"
          >
            返回生词本
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-[100dvh] bg-[#F4F5EF] relative overflow-hidden flex font-sans"
      style={{ perspective: 1200 }}
    >
       {/* Top Navigation (Fixed) */}
       <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 safe-area-pt pointer-events-none">
         <button onClick={() => navigate(-1)} className="p-2.5 rounded-full bg-white/40 backdrop-blur hover:bg-white/60 active:scale-95 transition-all outline-none border border-white/40 shadow-sm pointer-events-auto">
           <ArrowLeft className="w-5 h-5 text-[#3A3A30]" />
         </button>
         <div className="flex gap-2 pointer-events-auto">
           <button
             onClick={() => setMemoryMode(!memoryMode)}
             className={`p-2.5 rounded-full backdrop-blur hover:bg-white/60 active:scale-95 transition-all outline-none border shadow-sm ${memoryMode ? 'bg-[#7A8A54]/60 text-white border-[#7A8A54]/30' : 'bg-white/40 border-white/40 text-[#3A3A30]'}`}
             title={memoryMode ? '关闭记忆模式' : '开启记忆模式'}
           >
             {memoryMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
           </button>
           <button className="p-2.5 rounded-full bg-white/40 backdrop-blur hover:bg-white/60 active:scale-95 transition-all outline-none border border-white/40 shadow-sm">
              <Maximize className="w-4 h-4 text-[#3A3A30]" />
           </button>
         </div>
       </div>

       {/* Book Flip Content */}
       <div className="flex-1 w-full relative">
         <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={flipVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                rotateX: { type: "spring", stiffness: 200, damping: 25 },
                opacity: { duration: 0.2 },
                y: { type: "spring", stiffness: 200, damping: 25 }
              }}
              className="absolute inset-0 w-full h-full bg-[#F4F5EF] pointer-events-none"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="w-full h-full pointer-events-auto">
              <WordScreen 
                word={currentWord} 
                isPreloaded={true} 
                isCurrent={true}
                memoryMode={memoryMode}
                onReveal={() => {}}
              />
              </div>
            </motion.div>
         </AnimatePresence>
       </div>

       {/* Bottom Actions Fixed Overlay */}
       <BottomActions
         onDelete={handleDelete}
         isDeleting={isDeleting}
         currentWord={currentWord}
         currentVocabId={vocabList[activeIndex]?.id || 'direct'}
         onMastery={handleMastery}
         isUpdatingMastery={isUpdatingMastery}
         canGoNext={canGoNext}
         lastMasteryClick={lastMasteryClick}
       />

       {/* Vertical Progress Bar */}
       {vocabList.length > 1 && (
         <div className="absolute right-4 top-[25%] bottom-[25%] w-1.5 bg-[#EAEAE0] rounded-full pointer-events-none z-40 shadow-inner">
            <div 
              className="absolute top-0 w-full bg-gradient-to-b from-[#A8CDAE] to-[#7A8A54] rounded-full transition-all duration-300 ease-out shadow-sm origin-top"
              style={{ height: `${progressPercentage * 100}%` }}
            />
            <div 
              className="absolute w-3 h-3 bg-white border-2 border-[#7A8A54] rounded-full transition-all duration-300 ease-out shadow-md"
              style={{ left: '50%', top: `${progressPercentage * 100}%`, transform: 'translate(-50%, -50%)' }}
            />
            <Sparkles progress={progressPercentage} />
         </div>
       )}
    </div>
  );
};
