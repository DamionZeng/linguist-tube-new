import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { CheckSquare, Trash2, Volume2, Search, SlidersHorizontal, ChevronRight, ChevronDown, ChevronUp, BookOpen, Brain } from 'lucide-react';
import { fetchVocabularyData, fetchRecommendedVocab, batchDeleteVocabularyWords } from '@api/general';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';
import { MasteryBar } from '../../components/MasteryBar';
import { useTranslation } from 'react-i18next';

type SortKey = 'added' | 'word' | 'pos';
type SortOrder = 'asc' | 'desc';

function truncateMean(mean: string, maxParts: number = 2): string {
  if (!mean) return '';
  const parts = mean.split(/[；;、,，]/);
  const selected = parts.slice(0, maxParts);
  return selected.join('；') + (parts.length > maxParts ? '…' : '');
}



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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecommendedMode, setIsRecommendedMode] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState<string[] | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'vip') return;

    fetchVocabularyData()
      .then(res => {
        setVocab(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(t('error.loadVocabulary'));
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

    // Sort
    if (isRecommendedMode && recommendedIds) {
      // Recommended mode: recommended words on top (A-Z), then rest
      const recSet = new Set(recommendedIds);
      list.sort((a, b) => {
        const aRec = recSet.has(a.id) ? 0 : 1;
        const bRec = recSet.has(b.id) ? 0 : 1;
        return aRec - bRec || (a.word || '').localeCompare(b.word || '');
      });
    } else {
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
    }

    return list;
  }, [vocab, filterPos, sortKey, sortOrder, isRecommendedMode, recommendedIds]);

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
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (selectedWords.size === 0) return;
    setIsDeleting(true);
    try {
      await batchDeleteVocabularyWords(Array.from(selectedWords));
      setSelectedWords(new Set());
      const res = await fetchVocabularyData();
      setVocab(res);
    } catch (e) {
      console.error('Failed to delete words', e);
    } finally {
      setIsDeleting(false);
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

  const cycleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'added' ? 'desc' : 'asc');
    }
  };

  const handleSmartRecommend = useCallback(async () => {
    // Toggle recommended mode
    if (isRecommendedMode) {
      setIsRecommendedMode(false);
      setRecommendedIds(null);
      return;
    }
    setIsRecommending(true);
    try {
      const recs = await fetchRecommendedVocab(20);
      setRecommendedIds(recs.map(r => r.id));
      // Merge recommended data into vocab list
      const existingMap = new Map(vocab.map(v => [v.id, v]));
      const merged = recs.map(r => ({ ...r, ...existingMap.get(r.id), ...r }));
      // Also keep non-recommended words that are already in vocab
      setVocab(prev => {
        const recSet = new Set(recs.map(r => r.id));
        const nonRecRetained = prev.filter(v => !recSet.has(v.id));
        return [...merged, ...nonRecRetained];
      });
      setIsRecommendedMode(true);
    } catch (e) {
      console.error('Failed to recommend', e);
    } finally {
      setIsRecommending(false);
    }
  }, [isRecommendedMode, vocab]);

  const toggleRecommended = (id: string) => {
    if (!recommendedIds) return;
    setRecommendedIds(prev => {
      if (!prev) return prev;
      return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    });
  };

  if (!user) {
    return <LoginPrompt message={t('messages.loginVocab')} />;
  }

  if (user.role !== 'vip') {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F0] text-[#4A4A40] max-w-4xl mx-auto w-full relative pt-20 px-4 items-center flex-1">
         <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#E0E0D5] text-center max-w-md w-full">
            <h2 className="text-2xl font-serif font-bold text-[#5A5A40] mb-2">{t('messages.membersOnly')}</h2>
            <p className="text-[#6A6A5A] mb-6">{t('messages.vipVocab')}</p>
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
      <header className="flex flex-col px-4 pt-6 pb-2 shrink-0">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
               <h1 className="text-3xl font-serif font-bold text-[#5A5A40] tracking-tight shrink-0">{t('vocab.title')}</h1>
               <span className="text-sm text-[#8A8A7A] font-medium mt-1 shrink-0">{vocab.length}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
               <button 
                 onClick={handleSmartRecommend}
                 disabled={isRecommending}
                 className={`text-sm font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 ${isRecommendedMode ? 'bg-[#7A8A54] text-white shadow-sm' : 'text-[#6A6A5A] hover:bg-[#EAEAE0]'}`}
                 title={isRecommendedMode ? t('vocab.showAll') : t('vocab.smartRecommend')}
               >
                 {isRecommending ? (
                   <div className="w-3.5 h-3.5 rounded-full border-2 border-[#E0E0D5] border-t-current animate-spin" />
                 ) : (
                   <Brain className="w-4 h-4" />
                 )}
                 <span className="hidden sm:inline text-xs">{isRecommendedMode ? t('vocab.showAll') : t('vocab.smartRecommend')}</span>
               </button>
               <button 
                 onClick={() => setShowFilters(!showFilters)}
                 className={`text-sm font-bold p-1.5 rounded-lg active:scale-95 transition-all ${showFilters ? 'bg-[#5A5A40] text-white' : 'text-[#6A6A5A] hover:bg-[#EAEAE0]'}`}
               >
                 <SlidersHorizontal className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setIsEditing(!isEditing)}
                 className="text-sm font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all text-[#D48166] hover:bg-[#EAEAE0]"
               >
                 {isEditing ? t('vocab.done') : t('vocab.edit')}
               </button>
            </div>
         </div>
         {/* Recommended mode sub-header */}
         {isRecommendedMode && recommendedIds && (
           <div className="flex items-center gap-2 mt-2 ml-1">
             <span className="text-xs font-bold text-[#7A8A54] bg-[#7A8A54]/10 px-2 py-0.5 rounded-full">
               {t('vocab.recommended')} {recommendedIds.length} {t('vocab.wordCount', { count: recommendedIds.length })}
             </span>
             <span className="text-[10px] text-[#7A7A6A]">{t('vocab.recommendedHint')}</span>
           </div>
         )}
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
                 disabled={selectedWords.size === 0 || isDeleting}
                 className={`flex items-center gap-1.5 ${selectedWords.size > 0 && !isDeleting ? 'text-[#D48166]' : 'text-[#D48166] opacity-50 cursor-not-allowed'}`}
               >
                   {isDeleting ? (
                     <div className="w-4 h-4 rounded-full border-2 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
                   ) : (
                     <Trash2 className="w-4 h-4" />
                   )}
                   {isDeleting ? t('vocab.deleting') : t('vocab.deleteSelected')}
               </button>
            </div>
         </div>
      )}

      {/* Empty State */}
      {vocab.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full border border-[#E0E0D5] shadow-sm">
            <BookOpen className="w-12 h-12 text-[#D48166] mx-auto mb-4" />
            <h2 className="text-xl font-serif font-bold text-[#5A5A40] mb-2">{t('vocab.emptyTitle')}</h2>
            <p className="text-sm text-[#8A8A7A] mb-6 leading-relaxed">{t('vocab.emptyDesc')}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#5A5A40] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#4A4A40] transition-colors active:scale-95"
            >
              {t('vocab.goLearn')}
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {vocab.length > 0 && filteredVocab.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <Search className="w-10 h-10 text-[#E0E0D5] mb-3" />
          <p className="text-[#8A8A7A] text-sm">{t('vocab.noResults')}</p>
        </div>
      )}

      {/* Vocabulary List */}
      <div className={`px-4 py-2 space-y-2 ${isRecommendedMode && recommendedIds ? 'pb-20' : ''}`}>
         {filteredVocab.map(item => {
           const displayMean = truncateMean(item.mean || item.trans || '');
           const isRecommended = isRecommendedMode && recommendedIds?.includes(item.id);

           return (
            <div key={item.id} className={`flex items-center gap-2.5 group ${isRecommendedMode && !isRecommended ? 'opacity-40' : ''}`}>
               {/* Recommended mode: toggle checkbox */}
               {isRecommendedMode && recommendedIds && (
                  <button onClick={(e) => { e.stopPropagation(); toggleRecommended(item.id); }} className="shrink-0 w-5 h-5 flex items-center justify-center transition-all active:scale-90" title={isRecommended ? t('vocab.removeFromRecommended') : t('vocab.addToRecommended')}>
                     <div className={`w-[16px] h-[16px] rounded border-2 flex items-center justify-center transition-colors ${isRecommended ? 'bg-[#7A8A54] border-[#7A8A54]' : 'border-[#9CA390] hover:border-[#7A8A54]/60 bg-white'}`}>
                        {isRecommended && <CheckSquare className="w-[10px] h-[10px] text-white" />}
                     </div>
                  </button>
               )}
               {isEditing && (
                  <button onClick={() => toggleSelect(item.id)} className="shrink-0 w-5 h-5 flex items-center justify-center transition-all">
                     <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${selectedWords.has(item.id) ? 'bg-[#D48166] border-[#D48166]' : 'border-[#9CA390]'}`}>
                        {selectedWords.has(item.id) && <CheckSquare className="w-3 h-3 text-white" />}
                     </div>
                  </button>
               )}

               <div
                 className={`flex-1 min-w-0 bg-white rounded-2xl border ${isRecommended ? 'border-[#7A8A54]/60 shadow-[#7A8A54]/10' : 'border-[#E0E0D5]'} shadow-sm px-4 py-3 transition-all relative ${isEditing ? '' : 'cursor-pointer hover:border-[#D48166]/40 active:scale-[0.99]'}`}
                 onClick={() => isEditing ? undefined : navigate(`/vocab/${item.word}${isRecommendedMode && recommendedIds ? `?ids=${recommendedIds.join(',')}` : ''}`)}
               >
                   <div className="flex flex-col gap-1 w-full">
                     {/* Row 1: word + audio + recommended tag + mastery + arrow */}
                     <div className="flex items-center gap-2 min-w-0">
                       <span className="font-bold text-base text-[#4A4A40] truncate" title={item.word}>{item.word}</span>
                       <button
                         onClick={e => playAudio(e, item.word)}
                         className="p-0.5 rounded-full hover:bg-[#F5F5F0] text-[#D48166] active:scale-95 transition-all shrink-0 outline-none"
                       >
                         <Volume2 className="w-3.5 h-3.5" />
                       </button>
                       {isRecommended && (
                         <span className="text-[9px] font-bold text-white bg-[#7A8A54] px-1.5 py-[1px] rounded-full shrink-0">
                           {t('vocab.recommended')}
                         </span>
                       )}
                       <div className="ml-auto flex items-center gap-1.5 shrink-0">
                         <MasteryBar mastery={item.mastery ?? 1} />
                         {!isEditing && (
                           <ChevronRight className="w-3.5 h-3.5 text-[#9CA390] group-hover:text-[#D48166] transition-colors" />
                         )}
                       </div>
                     </div>

                     {/* Row 2: pos + meaning */}
                     <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                       {item.pos && (
                         <span className="text-[10px] text-[#94A684] font-serif border border-[#94A684]/30 px-1.5 py-[1px] rounded-sm bg-[#94A684]/5 shrink-0">{item.pos}</span>
                       )}
                       <span className="text-xs text-[#6A6A5A] truncate" title={displayMean}>{displayMean}</span>
                     </div>
                  </div>
               </div>
            </div>
           );
         })}
      </div>

      {/* Recommended mode: start review button - floating above tab bar */}
      {isRecommendedMode && recommendedIds && recommendedIds.length > 0 && (
        <div className="fixed left-0 right-0 z-[45] px-4 pb-safe pointer-events-none" style={{ bottom: 'calc(68px + 12px + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={() => {
              const firstRecId = recommendedIds[0];
              const firstWord = vocab.find(v => v.id === firstRecId)?.word;
              if (firstWord) {
                navigate(`/vocab/${firstWord}?ids=${recommendedIds.join(',')}`);
              }
            }}
            className="w-full py-3 rounded-2xl bg-[#7A8A54] text-white font-bold text-base shadow-lg shadow-[#7A8A54]/25 hover:bg-[#6A7A44] active:scale-[0.98] transition-all flex items-center justify-center gap-2 pointer-events-auto"
          >
            <Brain className="w-5 h-5" />
            {t('vocab.startReview', { count: recommendedIds.length })}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 animate-in fade-in duration-150">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl px-6 pt-6 pb-5 max-w-[320px] w-full shadow-xl animate-in zoom-in-95 fade-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#FCF0EC] flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-[#D48166]" />
              </div>
              <h3 className="text-base font-bold text-[#4A4A40] mb-1">{t('vocab.confirmDelete')}</h3>
              <p className="text-sm text-[#8A8A7A] leading-relaxed mb-5">
                {t('vocab.deleteConfirmDesc')}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 px-4 text-sm font-bold text-[#6A6A5A] bg-[#F5F5F0] rounded-xl hover:bg-[#EAEAE0] transition-colors active:scale-95"
                >
                  {t('vocab.cancelDelete')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 text-sm font-bold text-white bg-[#D48166] rounded-xl hover:bg-[#C07050] transition-colors active:scale-95"
                >
                  {t('vocab.confirmDelete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brush shimmer animation keyframes */}
      <style>{`
        @keyframes brushShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};
