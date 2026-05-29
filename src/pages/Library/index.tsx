import React, { useEffect, useState } from 'react';
import { BookOpen, Star, Clock, Trophy, ArrowRight } from 'lucide-react';
import { fetchLibraryData } from '../../api/general';
import { useNavigate } from 'react-router-dom';
import { GithubHeatmap } from '../../components/GithubHeatmap';

export const LibraryPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLibraryData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-10">
      <h2 className="text-3xl font-serif font-bold text-[#5A5A40]">My Library</h2>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Trophy className="w-6 h-6 text-[#D48166]" />} label="Day Streak" value={data.stats.streak} />
        <StatCard icon={<BookOpen className="w-6 h-6 text-[#94A684]" />} label="Words Learned" value={data.stats.words} />
        <StatCard icon={<Star className="w-6 h-6 text-[#E1B12C]" />} label="Saved Sentences" value={data.stats.sentences} />
        <StatCard icon={<Clock className="w-6 h-6 text-[#5A5A40]" />} label="Hours Watched" value={data.stats.hours} />
      </div>

      <GithubHeatmap />
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
