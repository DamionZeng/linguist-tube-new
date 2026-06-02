import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Volume2, Mic, Play, Check, Square } from 'lucide-react';
import { Header } from '../../components/Header';
import { useTranslation } from 'react-i18next';

interface CardState {
  status: 'idle' | 'recording' | 'done';
  showTranslation: boolean;
}

export const SentenceMode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sentences = [
    { en: 'A new meme has recently entered the chat: a possum standing with its little paws behind its back.', zh: '最近聊天中出现了一个新模因：一只负鼠把小爪子背在身后站着。' },
    { en: 'There is no dramatic story behind it, and no punchline is needed.', zh: '它的背后没有戏剧性的故事，也不需要任何妙语。' },
    { en: 'It simply stands there, quiet and still, as if taking a slow walk on a peaceful afternoon — or as if it has suddenly paused to think about life.', zh: '它只是静静地站在那里，一动不动，仿佛在一个宁静的下午慢慢散步——又或者仿佛突然停下来思考人生。' }
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<number, CardState>>(
    sentences.reduce((acc, _, idx) => ({ ...acc, [idx]: { status: 'idle', showTranslation: false } }), {})
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to active card
  useEffect(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex]);

  const toggleTranslation = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card selection
    setCardStates(prev => ({
      ...prev,
      [idx]: { ...prev[idx], showTranslation: !prev[idx].showTranslation }
    }));
  };

  const handleRecordClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardStates(prev => ({
      ...prev,
      [idx]: { ...prev[idx], status: 'recording' }
    }));
    
    // Mock recording process
    setTimeout(() => {
      setCardStates(prev => ({
        ...prev,
        [idx]: { ...prev[idx], status: 'done' }
      }));
      if (idx < sentences.length - 1) {
         setActiveIndex(idx + 1);
      }
    }, 2000);
  };

  const handleStopRecording = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardStates(prev => ({
      ...prev,
      [idx]: { ...prev[idx], status: 'done' }
    }));
    if (idx < sentences.length - 1) {
      setActiveIndex(idx + 1);
    }
  };

  const handlePlayOriginal = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: implement actual audio playback
  };

  const handlePlayRecording = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: implement playing user's recorded audio
  };

  return (
    <div className="w-full h-screen bg-[#F5F8FA] dark:bg-[#0B0E14] text-[#333] dark:text-[#F8FAFC] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans relative">
      <Header title={t('practice.startReading') || '开始朗读'} onBack={() => navigate(`/video/${id!}`)} />
      
      <main className="flex-1 overflow-y-auto pb-32 pt-6 px-4 md:px-8 custom-scrollbar">
        <div ref={containerRef} className="max-w-2xl mx-auto flex flex-col gap-4">
          <style>{`
            @keyframes soundWave {
              0%, 100% { height: 8px; opacity: 0.6; }
              50% { height: 36px; opacity: 1; }
            }
            .sound-wave-bar {
              animation: soundWave 1.2s ease-in-out infinite;
              transform-origin: center;
            }
          `}</style>
          {sentences.map((sentence, idx) => {
            const isActive = idx === activeIndex;
            const state = cardStates[idx];
            
            return (
              <div 
                key={idx} 
                onClick={() => !isActive && setActiveIndex(idx)}
                className={`transition-all duration-300 w-full bg-white dark:bg-[#151B25] rounded-3xl p-6 md:p-8 relative
                  ${isActive ? 'opacity-100 shadow-md' : 'opacity-40 cursor-pointer hover:opacity-60'}`}
              >
                <div className="text-xl md:text-2xl font-serif text-[#333] dark:text-[#E2E8F0] mb-6 leading-relaxed">
                  {sentence.en}
                </div>
                
                {/* Translation with blur toggle */}
                <div 
                  onClick={(e) => toggleTranslation(idx, e)}
                  className={`mt-4 text-base md:text-lg text-[#666] dark:text-[#94A3B8] transition-all duration-300 cursor-pointer rounded-lg p-2 -mx-2
                    ${state.showTranslation ? 'filter-none bg-[#F5F8FA] dark:bg-[#1C222C]' : 'blur-sm select-none hover:bg-[#F5F8FA]/50 dark:hover:bg-[#1C222C]/50'}`}
                  title={state.showTranslation ? t('practice.hideTranslation') : t('practice.showTranslation')}
                >
                  {sentence.zh}
                </div>

                {/* Active state controls */}
                {isActive && (
                  <div className="mt-8 flex flex-col items-center justify-center min-h-[100px]">
                    {state.status === 'idle' || state.status === 'done' ? (
                      <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={handlePlayOriginal}
                            className="w-12 h-12 rounded-full bg-[#E5E7EB] dark:bg-[#334155] text-[#9CA3AF] dark:text-[#CBD5E1] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                          >
                            <Volume2 className="w-6 h-6" />
                          </button>

                          <button 
                            onClick={(e) => handleRecordClick(idx, e)}
                            className="w-16 h-16 rounded-full bg-[#D48166] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all relative"
                          >
                            <Mic className="w-8 h-8" />
                          </button>

                          {state.status === 'done' ? (
                            <button 
                              onClick={handlePlayRecording}
                              className="w-12 h-12 rounded-full bg-[#E5E7EB] dark:bg-[#334155] text-[#9CA3AF] dark:text-[#CBD5E1] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                            >
                              <Play className="w-6 h-6 ml-1" />
                            </button>
                          ) : (
                            <div className="w-12 h-12" />
                          )}
                        </div>
                        <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">
                          {state.status === 'done' ? t('practice.rerecord') : t('practice.tapToRecord')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 w-full animate-in fade-in duration-300" onClick={(e) => handleStopRecording(idx, e)}>
                        {/* Fake audio visualizer wave */}
                        <div className="flex items-center justify-center gap-1.5 h-12 my-2 cursor-pointer">
                           {[...Array(9)].map((_, i) => (
                             <div 
                               key={i} 
                               className="w-1.5 bg-[#D48166] rounded-full sound-wave-bar" 
                               style={{ 
                                 animationDelay: `${i * 0.15 - Math.random() * 0.5}s`,
                                 animationDuration: `${0.8 + Math.random() * 0.4}s`
                               }} 
                             />
                           ))}
                        </div>
                        <span className="text-sm text-[#9CA3AF] dark:text-[#64748B]">
                          {t('practice.tapToStop')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Done Indicator */}
                {state.status === 'done' && (
                  <div className="absolute bottom-4 right-4 text-[#D48166] bg-[#FCF5F3] dark:bg-[#1E293B] rounded-full p-1 animate-in zoom-in">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Complete Button */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F5F8FA] via-[#F5F8FA] dark:from-[#0B0E14] dark:via-[#0B0E14] to-transparent shrink-0 flex justify-center pb-safe">
        <button 
          onClick={() => navigate(`/practice/result/${id!}`)}
          className="w-[200px] h-14 rounded-full bg-[#D48166] text-white font-bold text-lg shadow-[0_4px_14px_rgba(212,129,102,0.4)] hover:bg-[#C27055] transition-colors active:scale-95"
        >
          {t('practice.finish')}
        </button>
      </div>
    </div>
  );
};
