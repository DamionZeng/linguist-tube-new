import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Square } from 'lucide-react';
import { Header } from '../../components/Header';
import { useTranslation } from 'react-i18next';

export const FullMode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full h-screen bg-[#F5F5F0] dark:bg-[#0B0E14] text-[#4A4A40] dark:text-[#F8FAFC] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans">
      <Header title={t('practice.fullMode') || '全文挑战'} onBack={() => navigate(`/video/${id}`)} />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Subtitle Scroller Area */}
        <div className="flex-1 overflow-y-auto px-6 py-12 mask-image-y max-w-3xl mx-auto w-full relative">
          <div className="flex flex-col gap-12 text-center items-center justify-center min-h-full transition-transform duration-1000">
            <div className="text-3xl md:text-4xl font-serif font-bold opacity-30 blur-[2px]">
              The quick brown fox
            </div>
            <div className="text-4xl md:text-5xl font-serif font-bold text-[#D48166] pb-2 border-b-2 border-[#D48166]/30">
              jumps over the lazy dog.
            </div>
            <div className="text-3xl md:text-4xl font-serif font-bold opacity-30 blur-[2px]">
              A journey of a thousand miles
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="h-40 bg-white dark:bg-[#151B25] border-t border-[#E0E0D5] dark:border-[#1E293B] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-4 px-6 relative z-10 w-full shrink-0">
          <button 
            onClick={() => navigate(`/practice/result/${id}`)}
            className="w-20 h-20 rounded-full bg-[#E17055] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Square className="w-8 h-8 fill-current" />
          </button>
          <div className="text-sm font-medium text-[#8A8A7A] dark:text-[#94A3B8]">
            {t('practice.tapToStop') || '点击结束挑战'}
          </div>
        </div>
      </main>
    </div>
  );
};
