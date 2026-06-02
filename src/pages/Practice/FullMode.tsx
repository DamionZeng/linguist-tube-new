import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Volume2, Mic, Play, Square } from 'lucide-react';
import { Header } from '../../components/Header';
import { useTranslation } from 'react-i18next';

export const FullMode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle');

  const sentences = [
    { en: 'A new meme has recently entered the chat: a possum standing with its little paws behind its back.', zh: '最近聊天中出现了一个新模因：一只负鼠把小爪子背在身后站着。' },
    { en: 'There is no dramatic story behind it, and no punchline is needed.', zh: '它的背后没有戏剧性的故事，也不需要任何妙语。' },
    { en: 'It simply stands there, quiet and still, as if taking a slow walk on a peaceful afternoon — or as if it has suddenly paused to think about life.', zh: '它只是静静地站在那里，一动不动，仿佛在一个宁静的下午慢慢散步——又或者仿佛突然停下来思考人生。' }
  ];

  const handleRecordClick = () => {
    setStatus('recording');
    // Mock recording auto end
    setTimeout(() => {
      setStatus(prev => prev === 'recording' ? 'done' : prev);
    }, 5000);
  };

  const handleStopRecording = () => {
    setStatus('done');
  };

  const handlePlayOriginal = () => {
    // play original
  };

  const handlePlayRecording = () => {
    // play recording
  };

  return (
    <div className="w-full h-screen bg-[#F5F8FA] dark:bg-[#0B0E14] text-[#333] dark:text-[#F8FAFC] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans relative">
      <Header title={t('practice.fullMode') || '全文挑战'} onBack={() => navigate(`/video/${id}`)} />
      
      <main className="flex-1 overflow-y-auto pb-48 pt-6 px-4 md:px-8 custom-scrollbar">
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
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#151B25] rounded-3xl p-6 md:p-10 shadow-sm border border-[#E0E0E0] dark:border-[#1E293B]">
          <div className="flex flex-col gap-8 text-xl md:text-2xl font-serif text-[#333] dark:text-[#E2E8F0]">
            {sentences.map((sentence, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <p className="leading-relaxed">{sentence.en}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Action Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F5F8FA] via-[#F5F8FA] dark:from-[#0B0E14] dark:via-[#0B0E14] to-transparent shrink-0 flex flex-col items-center justify-center pb-safe">
        <div className="flex flex-col items-center justify-center min-h-[100px] w-full mb-6">
          {status === 'idle' || status === 'done' ? (
            <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-6">
                <button 
                  onClick={handlePlayOriginal}
                  className="w-12 h-12 rounded-full bg-[#E5E7EB] dark:bg-[#334155] text-[#9CA3AF] dark:text-[#CBD5E1] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                >
                  <Volume2 className="w-6 h-6" />
                </button>

                <button 
                  onClick={handleRecordClick}
                  className="w-16 h-16 rounded-full bg-[#D48166] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all relative"
                >
                  <Mic className="w-8 h-8" />
                </button>

                {status === 'done' ? (
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
                {status === 'done' ? t('practice.rerecord') || '重新录音' : t('practice.tapToRecord') || '点击录音'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full animate-in fade-in duration-300" onClick={handleStopRecording}>
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
                {t('practice.tapToStop') || '点击结束录音'}
              </span>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate(`/practice/result/${id!}`)}
          className="w-[200px] h-14 rounded-full bg-[#D48166] text-white font-bold text-lg shadow-[0_4px_14px_rgba(212,129,102,0.4)] hover:bg-[#C27055] transition-colors active:scale-95"
        >
          {t('practice.finish') || '完成'}
        </button>
      </div>
    </div>
  );
};
