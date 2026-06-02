import React, { useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Award, ArrowRight, RefreshCw, Home, Trophy, Target, Activity } from 'lucide-react';
import { Header } from '../../components/Header';
import { useTranslation } from 'react-i18next';
import { SentenceScore } from '../../utils/scoring';

interface ScoreData {
  scores: Record<number, SentenceScore>;
  overallScore: number;
  transcripts: Array<{ id: string; en: string; zh: string; startTime: string }>;
}

export const ResultMode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const stateData = (location.state as ScoreData) || null;
  const hasRealData = stateData?.scores && Object.keys(stateData.scores).length > 0;

  const totalScore = hasRealData ? stateData!.overallScore : 85;

  const metrics = useMemo(() => {
    if (!hasRealData) {
      return [
        { label: 'Fluency', value: 92, icon: <Activity className="w-4 h-4" /> },
        { label: 'Completeness', value: 88, icon: <Trophy className="w-4 h-4" /> },
        { label: 'Accuracy', value: 76, icon: <Target className="w-4 h-4" /> },
      ];
    }

    const allScores = Object.values(stateData!.scores);
    const scoredSentences = allScores.filter((s) => s.words.some((w) => w.status !== 'unrecognized'));

    const accuracy = scoredSentences.length > 0
      ? Math.round(scoredSentences.reduce((sum, s) => sum + s.score, 0) / scoredSentences.length)
      : 0;

    const completeness = allScores.length > 0
      ? Math.round((scoredSentences.length / allScores.length) * 100)
      : 0;

    const correctCount = scoredSentences.reduce(
      (sum, s) => sum + s.words.filter((w) => w.status === 'correct').length, 0
    );
    const totalWords = scoredSentences.reduce(
      (sum, s) => sum + s.words.filter((w) => w.status !== 'unrecognized').length, 0
    );
    const fluency = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;

    return [
      { label: 'Accuracy', value: accuracy, icon: <Target className="w-4 h-4" /> },
      { label: 'Fluency', value: fluency, icon: <Activity className="w-4 h-4" /> },
      { label: 'Completeness', value: completeness, icon: <Trophy className="w-4 h-4" /> },
    ];
  }, [hasRealData, stateData]);

  const weaknesses = useMemo(() => {
    if (!hasRealData) {
      return [
        { id: 1, text: "It's not that I'm so smart, it's just that I stay with problems longer.", score: 62 },
        { id: 2, text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", score: 65 },
        { id: 3, text: "The measure of intelligence is the ability to change.", score: 70 },
      ];
    }

    const entries = Object.entries(stateData!.scores)
      .map(([idxStr, score]) => {
        const idx = parseInt(idxStr, 10);
        const hasEval = score.words.some((w) => w.status !== 'unrecognized');
        return {
          index: idx,
          text: stateData!.transcripts[idx]?.en || '',
          score: hasEval ? score.score : -1,
          id: stateData!.transcripts[idx]?.id || '',
        };
      })
      .filter((e) => e.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    return entries.map((e, i) => ({
      id: i + 1,
      text: e.text,
      score: e.score,
    }));
  }, [hasRealData, stateData]);

  return (
    <div className="w-full h-screen bg-[#F5F5F0] dark:bg-[#0B0E14] text-[#4A4A40] dark:text-[#F8FAFC] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans relative">
      <Header title={t('practice.reportTitle') || '挑战报告'} onBack={() => navigate(`/video/${id}`)} />
      
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-xl mx-auto p-6 md:p-8 space-y-10">
          
          {/* Total Score Section */}
          <section className="flex flex-col items-center justify-center pt-4">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" className="text-[#EAEAE0] dark:text-[#1E293B]" />
                <circle 
                  cx="96" cy="96" r="88" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="none" 
                  strokeLinecap="round"
                  className="text-[#D48166]"
                  strokeDasharray="552.92"
                  strokeDashoffset={552.92 - (552.92 * totalScore) / 100}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <Award className="w-8 h-8 text-[#E1B12C] mb-1" />
                <span className="text-5xl font-black font-serif tracking-tighter">{totalScore}</span>
              </div>
            </div>
          </section>

          {/* Metrics */}
          <section className="bg-white dark:bg-[#151B25] rounded-[24px] p-6 shadow-sm border border-[#E0E0D5] dark:border-[#1E293B]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#E17055]" />
              {t('practice.performance') || '发音多维表现'}
            </h3>
            <div className="space-y-5">
              {metrics.map((metric, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2 text-[#5A5A40] dark:text-[#F8FAFC]">
                      <span className="text-[#8A8A7A] dark:text-[#94A3B8]">{metric.icon}</span>
                      {metric.label}
                    </div>
                    <span>{metric.value}</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F4F6F1] dark:bg-[#1C222C] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        metric.value >= 90 ? 'bg-[#94A684]' : metric.value >= 80 ? 'bg-[#E1B12C]' : 'bg-[#D48166]'
                      }`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Weakness Analysis */}
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 px-2 text-[#5A5A40] dark:text-[#F8FAFC]">
              <Target className="w-5 h-5 text-[#D48166]" />
              {t('practice.weaknessAnalysis') || '发音攻坚（最低评分）'}
            </h3>
            <div className="space-y-4">
              {weaknesses.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-[#151B25] rounded-[24px] p-5 border border-[#E0E0D5] dark:border-[#1E293B] shadow-sm flex flex-col gap-4 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-lg font-serif font-bold text-[#4A4A40] dark:text-[#E2E8F0] leading-snug">
                      "{item.text}"
                    </div>
                    <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#FCF5F3] dark:bg-[#322323] text-[#D48166] font-bold text-sm">
                      {item.score}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => navigate(`/practice/sentence/${id}?index=${item.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F9F9F7] dark:bg-[#1C222C] text-[#D48166] text-sm font-bold hover:bg-[#D48166] hover:text-white transition-colors"
                    >
                      {t('practice.refine') || '去精修'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F5F5F0] via-[#F5F5F0] dark:from-[#0B0E14] dark:via-[#0B0E14] to-transparent pointer-events-none pb-safe pt-24">
        <div className="max-w-xl mx-auto flex gap-4 pointer-events-auto">
          <button 
            onClick={() => navigate(`/video/${id}`)}
            className="flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl bg-white dark:bg-[#151B25] text-[#8A8A7A] hover:text-[#5A5A40] dark:hover:text-[#F8FAFC] shadow-sm border border-[#E0E0D5] dark:border-[#1E293B] transition-colors"
          >
            <Home className="w-6 h-6" />
          </button>
          <button 
            onClick={() => navigate(`/practice/full/${id}`)}
            className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-[#D48166] text-white font-bold text-lg shadow-md hover:bg-[#C27055] transition-colors active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" />
            {t('practice.retry') || '重新挑战'}
          </button>
        </div>
      </div>
    </div>
  );
};
