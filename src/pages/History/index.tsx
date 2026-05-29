import React, { useEffect, useState } from 'react';
import { Play, TrendingUp, Clock } from 'lucide-react';
import { fetchHistoryData } from '../../api/general';
import { useNavigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistoryData().then(res => {
      setHistory(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20">
      <h2 className="text-2xl font-serif font-bold text-[#5A5A40] mb-2 px-2">Recent Learning</h2>
      
      <div className="space-y-4">
         {history.map(v => (
            <div key={v.id} onClick={() => navigate(`/video/${v.id}`)} className="flex gap-4 p-4 bg-white rounded-[24px] border border-[#E0E0D5] cursor-pointer hover:border-[#94A684] hover:shadow-md transition-all group">
               <div className="w-32 md:w-48 aspect-video bg-[#EAEAE0] rounded-xl overflow-hidden shrink-0 relative">
                  <img src={v.thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="thumbnail" />
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
                     <div className="h-full bg-[#D48166]" style={{ width: `${v.progress}%` }}></div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wide backdrop-blur-md">
                     {v.duration}
                  </div>
               </div>
               
               <div className="flex flex-col flex-1 py-1">
                  <h3 className="font-bold text-[15px] md:text-[17px] text-[#4A4A40] line-clamp-2 leading-snug group-hover:text-[#D48166] transition-colors mb-1">{v.title}</h3>
                  <div className="flex items-center gap-2 mb-auto shrink-0">
                     <span className="text-[10px] uppercase tracking-widest font-bold bg-[#F5F5F0] text-[#6A6A5A] px-2 py-0.5 rounded-md border border-[#E0E0D5]">{v.tag}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8A8A7A] font-bold mt-2">
                     <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Watched {v.lastWatched}</span>
                     <span className="text-[#94A684]">{v.progress}% Complete</span>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
