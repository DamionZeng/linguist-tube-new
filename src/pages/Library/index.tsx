import React, { useEffect, useState } from 'react';
import { BookOpen, Star, Clock, Trophy, ArrowRight, LogOut, ShieldCheck } from 'lucide-react';
import { fetchLibraryData } from '../../api/general';
import { useNavigate } from 'react-router-dom';
import { GithubHeatmap } from '../../components/GithubHeatmap';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';

export const LibraryPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    fetchLibraryData()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load library data.");
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return <LoginPrompt message="Please login to view your personal library and statistics." />;
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      {/* User Profile Card */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-[#E0E0D5] shadow-sm flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D48166]/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 right-20 w-40 h-40 bg-gradient-to-tl from-[#94A684]/5 to-transparent rounded-tl-full pointer-events-none" />
        
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#D48166] to-[#C27055] flex flex-shrink-0 items-center justify-center text-white text-3xl md:text-4xl font-serif font-bold shadow-lg uppercase border-[6px] border-[#F5F5F0]">
          {user.username.charAt(0)}
        </div>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#5A5A40]">
              {user.username}
            </h2>
            {user.role === 'vip' ? (
              <span className="bg-[#E1B12C]/10 border border-[#E1B12C]/30 text-[#C29828] text-[11px] md:text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> VIP Member
              </span>
            ) : (
              <span className="bg-[#94A684]/10 border border-[#94A684]/30 text-[#71855F] text-[11px] md:text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full flex items-center shadow-sm">
                Standard
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Trophy className="w-6 h-6 text-[#D48166]" />} label="Day Streak" value={data.stats.streak} />
        <StatCard icon={<BookOpen className="w-6 h-6 text-[#94A684]" />} label="Words Learned" value={data.stats.words} />
        <StatCard icon={<Star className="w-6 h-6 text-[#E1B12C]" />} label="Saved Sentences" value={data.stats.sentences} />
        <StatCard icon={<Clock className="w-6 h-6 text-[#5A5A40]" />} label="Hours Watched" value={data.stats.hours} />
      </div>

      <GithubHeatmap />
      
      {/* Settings / Sign Out Actions */}
      <div className="pt-8 flex justify-center md:justify-start">
        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#E0E0D5] text-[#8A8A7A] hover:bg-[#F9F9F7] hover:text-[#D48166] hover:border-[#D48166]/30 text-sm font-bold rounded-xl transition-all shadow-sm w-full md:w-auto"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: any) => (
  <div className="bg-white p-5 lg:p-6 rounded-[24px] border border-[#E0E0D5] shadow-sm flex flex-col gap-3 hover:border-[#94A684] hover:-translate-y-1 transition-all">
    <div className="w-12 h-12 bg-[#F9F9F7] rounded-xl border border-[#E0E0D5] flex items-center justify-center">
        {icon}
    </div>
    <div>
       <div className="text-3xl font-serif font-bold text-[#4A4A40] mb-0.5">{value}</div>
       <div className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-widest leading-tight">{label}</div>
    </div>
  </div>
);
