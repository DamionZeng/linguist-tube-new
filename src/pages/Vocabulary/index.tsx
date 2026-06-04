import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { CheckSquare, Trash2, Volume2, Search, SlidersHorizontal, ChevronRight, ChevronDown, ChevronUp, BookOpen, EyeOff, Eye } from 'lucide-react';
import { fetchVocabularyData, batchDeleteVocabularyWords } from '@api/general';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';
import { useTranslation } from 'react-i18next';

type SortKey = 'added' | 'word' | 'pos';
type SortOrder = 'asc' | 'desc';

function useVocabSettings() {
  const [hideMeaning, setHideMeaning] = useState(() => {
    try {
      const saved = localStorage.getItem('vocab_hide_meaning');
      return saved ? saved === 'true' : true; // Default to true
    } catch { return true; }
  });

  const toggleHideMeaning = useCallback(() => {
    setHideMeaning(prev => {
      const next = !prev;
      try { localStorage.setItem('vocab_hide_meaning', String(next)); } catch {}
      return next;
    });
  }, []);

  return { hideMeaning, toggleHideMeaning };
}

function truncateMean(mean: string, maxParts: number = 2): string {
  if (!mean) return '';
  const parts = mean.split(/[；;、,，]/);
  const selected = parts.slice(0, maxParts);
  return selected.join('；') + (parts.length > maxParts ? '…' : '');
}

const BrushMask = () => (
  <svg 
    className="absolute inset-[0%] w-[105%] h-[120%] -left-[2.5%] -top-[10%] text-[#A8CDAE]" 
    preserveAspectRatio="none" 
    viewBox="0 0 100 30"
  >
    <path 
      fill="currentColor" 
      d="M2,15 Q20,5 50,15 T98,15 Q80,25 50,20 T2,15 Z" 
      opacity="0.9"
    />
    <path 
      fill="currentColor" 
      d="M0,18 Q30,8 60,22 T100,12 Q70,28 40,20 T0,18 Z" 
      opacity="0.7"
    />
    <path 
      fill="currentColor" 
      d="M5,10 Q40,20 70,5 T95,18 Q70,25 30,12 T5,10 Z" 
      opacity="0.6"
    />
  </svg>
);

export const VocabularyPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [vocab, setVocab] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Filter
  const [filterPos, setFilterPos] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('added');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Revealed words (when hideMeaning is on, track which are temporarily revealed)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const { hideMeaning, toggleHideMeaning } = useVocabSettings();

  useEffect(() => {
    if (!user || user.role !== 'vip') return;

    fetchVocabularyData()
      .then(res => {
        setVocab(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load vocabulary.");
        setLoading(false);
      });
  }, [user]);

  // Derive unique POS values for filter
  const posOptions = useMemo(() => {
    const set = new Set<string>();
    vocab.forEach(v => { if (v.pos) set.add(v.pos); });
    return Array.from(set).sort();
  }, [vocab]);

  // Filtered & sorted list
  const filteredVocab = useMemo(() => {
    let list = [...vocab];

    if (filterPos) {
      list = list.filter(v => v.pos === filterPos);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'word') {
        cmp = (a.word || '').localeCompare(b.word || '');
      } else if (sortKey === 'pos') {
        cmp = (a.pos || '').localeCompare(b.pos || '');
      } else {
        const aTime = a.added ? new Date(a.added).getTime() : 0;
        const bTime = b.added ? new Date(b.added).getTime() : 0;
        cmp = aTime - bTime;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [vocab, filterPos, sortKey, sortOrder]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedWords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedWords(next);
  };

  const handleSelectAll = () => {
    if (selectedWords.size === filteredVocab.length) {
      setSelectedWords(new Set());
    } else {
      setSelectedWords(new Set(filteredVocab.map(v => v.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedWords.size === 0) return;
    try {
      await batchDeleteVocabularyWords(Array.from(selectedWords));
      setSelectedWords(new Set());
      const res = await fetchVocabularyData();
      setVocab(res);
    } catch (e) {
      console.error('Failed to delete words', e);
    }
  };

  const playAudio = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleReveal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(revealedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedIds(next);
  };

  const cycleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'added' ? 'desc' : 'asc');
    }
  };

  if (!user) {
    return <LoginPrompt message={t('messages.loginVocab')} />;
  }

  if (user.role !== 'vip') {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F0] text-[#4A4A40] max-w-4xl mx-auto w-full relative pt-20 px-4 items-center flex-1">
         <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#E0E0D5] text-center max-w-md w-full">
            <h2 className="text-2xl font-serif font-bold text-[#5A5A40] mb-2">{t('messages.membersOnly')}</h2>
            <p className="text-[#848464] mb-6">{t('messages.vipVocab')}</p>
            <button className="bg-[#E1B12C] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#C29828] transition-colors" onClick={() => navigate(-1)}>
               {t('video.goBack')}
            </button>
         </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
        <div className="text-[#D48166] font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F5F0] text-[#4A4A40] max-w-4xl mx-auto w-full relative overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 pb-4 shrink-0">
         <div className="flex items-center gap-2">
            <h1 className="text-3xl font-serif font-bold text-[#5A5A40] tracking-tight">{t('vocab.title')}</h1>
            <span className="text-sm text-[#8A8A7A] font-medium mt-1">{vocab.length}</span>
         </div>
         <div className="flex gap-2">
            <button
              onClick={toggleHideMeaning}
              className="p-1.5 rounded-lg active:scale-95 transition-all text-[#6A6A5A] hover:bg-[#EAEAE0]"
              title={hideMeaning ? t('vocab.showMeaning', '显示释义') : t('vocab.hideMeaning', '隐藏释义')}
            >
              {hideMeaning ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`text-sm font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all ${showFilters ? 'bg-[#5A5A40] text-white' : 'text-[#6A6A5A] hover:bg-[#EAEAE0]'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all text-[#D48166] hover:bg-[#EAEAE0]"
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
         </div>
      </header>

      {/* Filter & Sort Bar */}
      {showFilters && (
        <div className="px-4 pb-3 shrink-0 animate-in slide-in-from-top-2">
          <div className="bg-white border border-[#E0E0D5] rounded-xl p-3 space-y-3">
            {posOptions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#8A8A7A] uppercase tracking-wider shrink-0">POS</span>
                <button
                  onClick={() => setFilterPos('')}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${filterPos === '' ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#6A6A5A] hover:bg-[#EAEAE0]'}`}
                >
                  All
                </button>
                {posOptions.map(pos => (
                  <button
                    key={pos}
                    onClick={() => setFilterPos(pos === filterPos ? '' : pos)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${filterPos === pos ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#6A6A5A] hover:bg-[#EAEAE0]'}`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#8A8A7A] uppercase tracking-wider shrink-0">Sort</span>
              {([['added', 'Time'], ['word', 'A-Z'], ['pos', 'POS']] as [SortKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => cycleSort(key)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${sortKey === key ? 'bg-[#D48166] text-white' : 'bg-[#F5F5F0] text-[#6A6A5A] hover:bg-[#EAEAE0]'}`}
                >
                  {label}
                  {sortKey === key && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editing Toolbar */}
      {isEditing && (
         <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#E0E0D5] text-sm animate-in slide-in-from-top-2 shrink-0">
            <button onClick={handleSelectAll} className="flex items-center gap-1.5 text-[#6A6A5A] hover:text-[#4A4A40]">
               <CheckSquare className="w-4 h-4" /> {selectedWords.size === filteredVocab.length ? t('vocab.unselectAll') : t('vocab.selectAll')}
            </button>
            <div className="flex gap-4">
               <button
                 onClick={handleDeleteSelected}
                 className={`flex items-center gap-1.5 ${selectedWords.size > 0 ? 'text-[#D48166]' : 'text-[#D48166] opacity-50 cursor-not-allowed'}`}
                 disabled={selectedWords.size === 0}
               >
                   <Trash2 className="w-4 h-4" /> {t('vocab.deleteSelected')}
               </button>
            </div>
         </div>
      )}

      {/* Empty State */}
      {vocab.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full border border-[#E0E0D5] shadow-sm">
            <BookOpen className="w-12 h-12 text-[#D48166] mx-auto mb-4" />
            <h2 className="text-xl font-serif font-bold text-[#5A5A40] mb-2">{t('vocab.emptyTitle', '生词本是空的')}</h2>
            <p className="text-sm text-[#8A8A7A] mb-6 leading-relaxed">{t('vocab.emptyDesc', '在看视频时点击单词即可加入生词本，开始你的词汇积累之旅吧！')}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#5A5A40] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#4A4A40] transition-colors active:scale-95"
            >
              {t('vocab.goLearn', '去学习')}
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {vocab.length > 0 && filteredVocab.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <Search className="w-10 h-10 text-[#E0E0D5] mb-3" />
          <p className="text-[#8A8A7A] text-sm">{t('vocab.noResults', '没有找到匹配的单词')}</p>
        </div>
      )}

      {/* Vocabulary List */}
      <div className="px-4 py-2 space-y-2">
         {filteredVocab.map(item => {
           const isRevealed = revealedIds.has(item.id);
           const shouldMask = hideMeaning && !isRevealed;
           const displayMean = truncateMean(item.mean || item.trans || '');

           return (
            <div key={item.id} className="flex items-center gap-3 group">
               {isEditing && (
                  <button onClick={() => toggleSelect(item.id)} className="shrink-0 transition-all">
                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedWords.has(item.id) ? 'bg-[#D48166] border-[#D48166]' : 'border-[#C0C0B5]'}`}>
                        {selectedWords.has(item.id) && <CheckSquare className="w-3 h-3 text-white" />}
                     </div>
                  </button>
               )}
               
               <div
                 className={`flex-1 bg-white rounded-2xl border border-[#E0E0D5] shadow-sm px-4 py-3 transition-all ${isEditing ? '' : 'cursor-pointer hover:border-[#D48166]/40 active:scale-[0.99]'}`}
                 onClick={() => isEditing ? undefined : navigate(`/vocab/${item.word}`)}
               >
                  <div className="flex items-center gap-4 md:gap-8">
                     {/* Left: word + phonetic + audio */}
                     <div className="flex items-center gap-2 min-w-[120px] md:min-w-[150px] shrink-0">
                       <span className="font-bold text-lg text-[#4A4A40] truncate max-w-[120px]">{item.word}</span>
                       <button
                         onClick={e => playAudio(e, item.word)}
                         className="p-1 rounded-full hover:bg-[#F5F5F0] text-[#D48166] active:scale-95 transition-all shrink-0"
                       >
                         <Volume2 className="w-3.5 h-3.5" />
                       </button>
                       {item.phonetic && <span className="text-xs font-mono text-[#8A8A7A] truncate hidden sm:inline">{item.phonetic}</span>}
                     </div>

                     {/* Right: pos + meaning + arrow */}
                     <div className="flex items-center gap-2 min-w-0 flex-1 justify-start">
                       {shouldMask ? (
                         <button
                           onClick={e => toggleReveal(e, item.id)}
                           className="relative flex items-center gap-1.5 group/mask active:scale-95 transition-transform"
                         >
                           {/* Brush-stroke mask effect */}
                           <span className="relative flex items-center gap-1 px-1">
                             <BrushMask />
                             {item.pos && (
                               <span
                                 className="text-[10px] font-serif px-1 rounded-sm relative"
                                 style={{ color: 'transparent' }}
                               >
                                 {item.pos}
                               </span>
                             )}
                             <span
                               className="text-sm font-medium px-1 relative truncate max-w-[200px]"
                               style={{ color: 'transparent' }}
                             >
                               {displayMean}
                             </span>
                           </span>
                           <Eye className="w-3.5 h-3.5 text-[#8A8A7A] opacity-0 group-hover/mask:opacity-100 transition-opacity" />
                         </button>
                       ) : (
                         <>
                           {item.pos && (
                             <span className="text-[10px] text-[#94A684] font-serif border border-[#94A684]/30 px-1.5 rounded-sm bg-[#94A684]/5 shrink-0">{item.pos}</span>
                           )}
                           <span className="text-sm text-[#4A4A40] font-medium truncate max-w-[240px]">{displayMean}</span>
                         </>
                       )}
                       {!isEditing && (
                         <div className="ml-auto flex items-center pr-2">
                           <ChevronRight className="w-4 h-4 text-[#C0C0B5] shrink-0 group-hover:text-[#D48166] transition-colors" />
                         </div>
                       )}
                     </div>
                  </div>
               </div>
            </div>
           );
         })}
      </div>
    </div>
  );
};
