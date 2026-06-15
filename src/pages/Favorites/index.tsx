import React, { useEffect, useState } from 'react';
import { Heart, PlayCircle, Quote, Trash2 } from 'lucide-react';
import { fetchFavoritesData, removeFavoriteSentence } from '@api/general';
import { getFavoriteVideos, toggleFavoriteVideoStorage } from '@api/storage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';
import { useLocalized } from '../../hooks/useLocalized';
import { useTranslation } from 'react-i18next';

export const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { title: locTitle } = useLocalized();
  const [data, setData] = useState<{videos: any[], sentences: any[]}>({ videos: [], sentences: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'sentences'>('videos');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    fetchFavoritesData()
      .then(res => {
        // Merge mocked initial data with real local storage
        const storageVideos = getFavoriteVideos();
        // Simple deduplication based on ID
        const mergedVideos = [...storageVideos];
        for (const v of res.videos) {
          if (!mergedVideos.some(mv => mv.id === v.id)) {
            mergedVideos.push(v);
          }
        }

        setData({
          videos: mergedVideos,
          sentences: res.sentences
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(t('error.loadFavorites'));
        setLoading(false);
      });

    const handleUpdate = () => {
       const storageVideos = getFavoriteVideos();
       setData(prev => {
          const merged = [...storageVideos];
          for (const v of prev.videos) {
             if (!merged.some(mv => mv.id === v.id)) {
                merged.push(v);
             }
          }
          return { ...prev, videos: merged };
       });
    };
    window.addEventListener('favorites-updated', handleUpdate);
    return () => window.removeEventListener('favorites-updated', handleUpdate);
  }, [user]);

  const handleRemoveVideo = (e: React.MouseEvent, v: any) => {
    e.stopPropagation();
    toggleFavoriteVideoStorage(v);
    setData(prev => ({
      ...prev,
      videos: prev.videos.filter(mv => mv.id !== v.id)
    }));
  };

  const handleRemoveSentence = async (e: React.MouseEvent, sId: string) => {
    e.stopPropagation();
    await removeFavoriteSentence(sId);
    setData(prev => ({
      ...prev,
      sentences: prev.sentences.filter(s => s.id !== sId)
    }));
  };

  if (!user) {
    return <LoginPrompt message={t('messages.loginFavorites')} />;
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
    <div className="flex flex-col h-full bg-[#F5F5F0] text-[#4A4A40] max-w-4xl mx-auto w-full">
      <div className="pt-6 px-6 pb-2 shrink-0">
          <h2 className="text-2xl font-serif font-bold text-[#5A5A40] mb-5">{t('favorites.title')}</h2>
          
          <div className="flex bg-[#EAEAE0] p-1 rounded-2xl mb-2">
             <button 
               onClick={() => setActiveTab('videos')}
               className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'videos' ? 'bg-white text-[#4A4A40] shadow-sm' : 'text-[#8A8A7A] hover:bg-white/50'}`}
             >
                <div className="relative">
                   <PlayCircle className={`w-[18px] h-[18px] ${activeTab === 'videos' ? 'text-[#D48166]' : ''}`} />
                   {activeTab === 'videos' && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#D48166] rounded-full border-2 border-white -mt-0.5 -mr-0.5" />}
                </div>
                {t('favorites.videos')} ({data.videos.length})
             </button>
             <button 
               onClick={() => setActiveTab('sentences')}
               className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sentences' ? 'bg-white text-[#4A4A40] shadow-sm' : 'text-[#8A8A7A] hover:bg-white/50'}`}
             >
                <Quote className={`w-[18px] h-[18px] ${activeTab === 'sentences' ? 'text-[#94A684]' : ''}`} />
                {t('favorites.sentences')} ({data.sentences.length})
             </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
         {activeTab === 'videos' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.videos.map((v, i) => (
                <div key={`${v.id}-${i}`} onClick={() => navigate(`/video/${v.id}`)} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E0E0D5] hover:border-[#D48166] cursor-pointer group">
                  <div className="aspect-video bg-[#EAEAE0] relative">
                     <img src={v.thumb || v.thumbnail || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <button onClick={(e) => handleRemoveVideo(e, v)} className="absolute top-2 right-2 bg-[#FCF5F3] backdrop-blur-md p-1.5 rounded-full text-[#D48166] hover:bg-[#EAEAE0] hover:text-[#5A5A40] transition-colors">
                        <Heart className="w-4 h-4 fill-current" />
                     </button>
                  </div>
                  <div className="p-3">
                     <h3 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-[#D48166] transition-colors">{locTitle(v)}</h3>
                  </div>
                </div>
              ))}
            </div>
         )}
         
         {activeTab === 'sentences' && (
            <div className="space-y-4">
              {data.sentences.map(s => (
                <div key={s.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E0E0D5] relative group hover:border-[#94A684] transition-colors cursor-pointer">
                  <button onClick={(e) => handleRemoveSentence(e, s.id)} className="absolute top-5 right-5 text-[#D48166] hover:text-[#5A5A40] bg-[#FCF5F3] hover:bg-[#EAEAE0] p-1.5 rounded-full transition-colors">
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                  <div className="pr-8 mb-4">
                     <p className="text-[17px] font-bold text-[#4A4A40] leading-snug mb-1.5 text-balance">{s.en}</p>
                     <p className="text-[14px] text-[#6A6A5A] leading-snug">{s.zh}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-[#8A8A7A]">
                     <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F9F9F7] rounded-md border border-[#EAEAE0]">
                        <PlayCircle className="w-3.5 h-3.5 text-[#D48166]" /> {s.videoTitle}
                     </div>
                     <span className="font-mono bg-[#EAEAE0] px-2 py-0.5 rounded text-[#4A4A40]">{s.time}</span>
                  </div>
                </div>
              ))}
            </div>
         )}
      </div>
    </div>
  );
};

