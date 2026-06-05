import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVocabularyData } from '@api/general';
import { useAuth } from '../../context/AuthContext';
import { WordScreen } from './WordScreen';
import { ArrowLeft, Maximize, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWordLookup } from '../../hooks/useWordLookup';

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

// Extracted fixed actions to handle its own saved state without re-rendering the whole page
const BottomActions: React.FC<{ word: string }> = ({ word }) => {
  const { isWordSaved, handleSaveToVocab } = useWordLookup({ word, enabled: true });

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-50 pointer-events-none">
       <div className="bg-[#F4F5EF]/95 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-6 shadow-lg shadow-black/5 border border-white/50 pointer-events-auto">
         <button 
           onClick={handleSaveToVocab}
           className={`w-11 h-11 rounded-full flex items-center justify-center transition-all bg-white hover:bg-[#F9F9F7] active:scale-95 border border-[#E0E0D5] ${isWordSaved ? 'text-[#D48166]' : 'text-[#3A3A30]'}`}
         >
           <Star className={`w-5 h-5 ${isWordSaved ? 'fill-current' : ''}`} />
         </button>
         <button className="w-11 h-11 rounded-full flex items-center justify-center bg-white hover:bg-[#F9F9F7] active:scale-95 transition-all text-[#3A3A30] border border-[#E0E0D5]">
           <Trash2 className="w-5 h-5" />
         </button>
         <button className="w-11 h-11 rounded-full flex items-center justify-center bg-[#E5F1E3] hover:bg-[#D5E1D3] active:scale-95 transition-all text-[#4A8A64] shadow-inner shadow-white/50 border border-[#4A8A64]/10">
           <div className="w-5 h-5 bg-current mask-brain" style={{ maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z%22/%3E%3Cpath d=%22M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z%22/%3E%3C/svg%3E")', WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z%22/%3E%3Cpath d=%22M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z%22/%3E%3C/svg%3E")', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
         </button>
       </div>
    </div>
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
  const { user } = useAuth();
  
  const [vocabList, setVocabList] = useState<{word: string; id: string}[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [direction, setDirection] = useState(0);

  // Initialize the list
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoadingList(true);
      try {
        let words: {word: string; id: string}[] = [];
        if (user?.role === 'vip') {
          const res = await fetchVocabularyData();
          if (res) words = res;
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
  }, [word, user]);

  const paginate = (newDirection: number) => {
    const nextIndex = activeIndex + newDirection;
    if (nextIndex >= 0 && nextIndex < vocabList.length) {
      setDirection(newDirection);
      setActiveIndex(nextIndex);
      window.history.replaceState(null, '', `/vocab/${vocabList[nextIndex].word}`);
    }
  };

  const touchStartY = useRef(0);
  const innerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - touchStartY.current;
    
    // Check inner scroll bounds to allow scrolling content safely
    let canSwipeDown = true; // swipe down -> prev
    let canSwipeUp = true;   // swipe up -> next

    const scrollContainer = document.querySelector('.no-scrollbar') as HTMLDivElement;
    if (scrollContainer) {
       canSwipeDown = scrollContainer.scrollTop <= 0;
       canSwipeUp = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 1;
    }

    if (deltaY > 60 && canSwipeDown) {
       paginate(-1); // swipe down, go to prev
    } else if (deltaY < -60 && canSwipeUp) {
       paginate(1); // swipe up, go to next
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Basic wheel logic for flip if not scrolling internally
    const scrollContainer = document.querySelector('.no-scrollbar') as HTMLDivElement;
    if (scrollContainer) {
      const canSwipeDown = scrollContainer.scrollTop <= 0;
      const canSwipeUp = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 1;
      if (e.deltaY < -50 && canSwipeDown) paginate(-1);
      if (e.deltaY > 50 && canSwipeUp) paginate(1);
    }
  }

  if (loadingList) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center p-12 relative bg-[#F4F5EF]">
        <div className="w-10 h-10 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin mb-4" />
      </div>
    );
  }

  const progressPercentage = vocabList.length > 1 ? activeIndex / (vocabList.length - 1) : 0;
  const currentWord = vocabList[activeIndex]?.word || word || '';

  return (
    <div 
      className="w-full h-[100dvh] bg-[#F4F5EF] relative overflow-hidden flex font-sans"
      style={{ perspective: 1200 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
       {/* Top Navigation (Fixed) */}
       <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 safe-area-pt pointer-events-none">
         <button onClick={() => navigate(-1)} className="p-2.5 rounded-full bg-white/40 backdrop-blur hover:bg-white/60 active:scale-95 transition-all outline-none border border-white/40 shadow-sm pointer-events-auto">
           <ArrowLeft className="w-5 h-5 text-[#3A3A30]" />
         </button>
         <button className="p-2.5 rounded-full bg-white/40 backdrop-blur hover:bg-white/60 active:scale-95 transition-all outline-none border border-white/40 shadow-sm pointer-events-auto">
            <Maximize className="w-4 h-4 text-[#3A3A30]" />
         </button>
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
              className="absolute inset-0 w-full h-full bg-[#F4F5EF]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <WordScreen 
                word={currentWord} 
                isPreloaded={true} 
                isCurrent={true}
              />
            </motion.div>
         </AnimatePresence>
       </div>

       {/* Bottom Actions Fixed Overlay */}
       <BottomActions word={currentWord} />

       {/* Vertical Progress Bar */}
       {vocabList.length > 1 && (
         <div className="absolute right-4 top-[25%] bottom-[25%] w-1.5 bg-[#EAEAE0] rounded-full pointer-events-none z-30 shadow-inner">
            <div 
              className="absolute top-0 w-full bg-gradient-to-b from-[#A8CDAE] to-[#7A8A54] rounded-full transition-all duration-300 ease-out shadow-sm origin-top"
              style={{ height: `${progressPercentage * 100}%` }}
            />
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#7A8A54] rounded-full transition-all duration-300 ease-out shadow-md"
              style={{ top: `calc(${progressPercentage * 100}% - 6px)` }}
            />
            <Sparkles progress={progressPercentage} />
         </div>
       )}
    </div>
  );
};
