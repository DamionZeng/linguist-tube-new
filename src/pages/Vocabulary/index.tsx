import React, { useEffect, useState } from 'react';
import { ChevronLeft, CheckSquare, Trash2, Edit2, Play, Volume2 } from 'lucide-react';
import { fetchVocabularyData } from '../../api/general';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';

export const VocabularyPage: React.FC = () => {
  const { user } = useAuth();
  const [vocab, setVocab] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

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

  const toggleSelect = (id: string) => {
    const next = new Set(selectedWords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedWords(next);
  };

  const handleSelectAll = () => {
    if (selectedWords.size === vocab.length) {
      setSelectedWords(new Set());
    } else {
      setSelectedWords(new Set(vocab.map(v => v.id)));
    }
  };

  if (!user) {
    return <LoginPrompt message="Please login to access the Vocabulary Book." />;
  }

  if (user.role !== 'vip') {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F0] text-[#4A4A40] max-w-4xl mx-auto w-full relative pt-20 px-4 items-center flex-1">
         <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#E0E0D5] text-center max-w-md w-full">
            <h2 className="text-2xl font-serif font-bold text-[#5A5A40] mb-2">Members Only</h2>
            <p className="text-[#848464] mb-6">Vocabulary Book is exclusively available for VIP members.</p>
            <button className="bg-[#E1B12C] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#C29828] transition-colors" onClick={() => navigate(-1)}>
               Go Back
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
    <div className="flex flex-col h-full bg-[#F5F5F0] text-[#4A4A40] max-w-4xl mx-auto w-full relative">
      {/* Custom Header for standard operations */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-[#E0E0D5]">
         <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/50 transition-colors">
               <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-serif font-bold text-[#5A5A40]">Vocabulary Book</h1>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all text-[#D48166] hover:bg-[#EAEAE0]"
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
         </div>
      </header>

      {/* Editing Toolbar */}
      {isEditing && (
         <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#E0E0D5] text-sm animate-in slide-in-from-top-2">
            <button onClick={handleSelectAll} className="flex items-center gap-1.5 text-[#6A6A5A] hover:text-[#4A4A40]">
               <CheckSquare className="w-4 h-4" /> {selectedWords.size === vocab.length ? 'Deselect All' : 'Select All'}
            </button>
            <div className="flex gap-4">
               <button className="flex items-center gap-1.5 text-[#94A684] disabled:opacity-50" disabled={selectedWords.size === 0}>
                   <Edit2 className="w-4 h-4" /> Move
               </button>
               <button className="flex items-center gap-1.5 text-[#D48166] disabled:opacity-50" disabled={selectedWords.size === 0}>
                   <Trash2 className="w-4 h-4" /> Delete
               </button>
            </div>
         </div>
      )}

      {/* Vocabulary List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
         {vocab.map(item => (
            <div key={item.id} className="flex items-start gap-3 group">
               {isEditing && (
                  <button onClick={() => toggleSelect(item.id)} className="mt-4 shrink-0 transition-all">
                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedWords.has(item.id) ? 'bg-[#D48166] border-[#D48166]' : 'border-[#C0C0B5]'}`}>
                        {selectedWords.has(item.id) && <CheckSquare className="w-3 h-3 text-white" />}
                     </div>
                  </button>
               )}
               
               <div className="flex-1 bg-white p-5 rounded-[24px] border border-[#E0E0D5] shadow-sm hover:border-[#D48166]/40 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                     <span className="font-bold text-xl text-[#4A4A40] flex items-center gap-2">
                         {item.word}
                         <button className="p-1.5 rounded-full hover:bg-[#F5F5F0] text-[#D48166] active:scale-95 transition-all">
                             <Volume2 className="w-4 h-4" />
                         </button>
                     </span>
                     <span className="text-[10px] text-[#8A8A7A] uppercase tracking-widest font-bold">Review</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                     <span className="text-sm font-mono text-[#6A6A5A]">{item.phonetic}</span>
                     <span className="text-xs text-[#94A684] font-serif border border-[#94A684]/30 px-2 rounded-sm bg-[#94A684]/5">{item.pos}</span>
                  </div>
                  <p className="text-[15px] font-medium text-[#4A4A40] mb-1">{item.trans}</p>
                  <p className="text-[13px] text-[#8A8A7A] mb-3">{item.mean}</p>
                  
                  <div className="bg-[#F9F9F7] rounded-xl p-3 border-l-2 border-[#D48166]">
                     <p className="text-sm font-bold text-[#5A5A40] mb-0.5">{item.example}</p>
                     <p className="text-[12px] text-[#6A6A5A]">{item.exampleTrans}</p>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
