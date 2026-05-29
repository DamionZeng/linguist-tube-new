import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, TrendingUp, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NewsItem {
  id: string;
  title: string;
  thumb: string;
  duration: string;
  level: string;
  tag: string;
}

export const YoutubeNewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const channels = [
        'UCBi2mrWuNuyYy4gbM6fU18Q', // ABC News
        'UC16niRr50-MSBwiO3YDb3RA', // BBC News
        'UCupvZG-5ko_eiXAupbDfxWw', // CNN
        'UCXIJgqnII2ZOINSWNOGFThA', // Fox News
        'UCaXkIU1QidjPwiAYu6GcHjg', // MSNBC
      ];
      const randomChannel = channels[Math.floor(Math.random() * channels.length)];
      // Fetching from random News YouTube channel via rss2json
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2Ffeeds%2Fvideos.xml%3Fchannel_id%3D${randomChannel}`);
      const data = await response.json();
      
      if (data.status === 'ok') {
        const items: NewsItem[] = data.items.map((item: any) => {
          // extract the video id from guid like "yt:video:SlE-IRIs36Y"
          const videoId = item.guid.split(':')[2];
          return {
            id: `yt-${videoId}`,
            title: item.title,
            thumb: item.thumbnail,
            duration: "News",
            level: "Advanced",
            tag: item.author
          };
        });
        // shuffle items to give a mix effect as well, or just use as is
        setNews(items.sort(() => 0.5 - Math.random()));
      } else {
        setError("Failed to fetch news.");
      }
    } catch (e) {
      console.error("Failed to fetch news", e);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#F9F9F7] rounded-full transition-colors text-[#6A6A5A]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#4A4A40]">YouTube News</h1>
            <p className="text-sm text-[#8A8A7A]">Real-time news reports for learning</p>
          </div>
        </div>
        <button 
          onClick={fetchNews}
          disabled={loading}
          className="p-2 hover:bg-[#F9F9F7] rounded-full transition-colors text-[#6A6A5A] disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10 hide-scrollbar">
        {loading && news.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
            <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
            <div className="text-[#D48166] font-bold">{error}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map(v => (
              <div
                key={v.id}
                onClick={() => navigate(`/video/${v.id}`)}
                className="bg-white rounded-[24px] overflow-hidden border border-[#E0E0D5] hover:border-[#94A684] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden bg-[#EAEAE0] p-1">
                  <div className="w-full h-full rounded-[20px] overflow-hidden relative">
                    <img
                      src={v.thumb}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      alt={v.title}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="bg-white/90 p-3 rounded-full backdrop-blur-sm text-[#D48166] shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                          <Play className="w-6 h-6 fill-current" />
                       </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded-md font-mono font-bold tracking-wide backdrop-blur-md">
                      {v.duration}
                    </div>
                    <div className="absolute top-2 left-2 bg-[#D48166] text-white text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg font-bold shadow-sm backdrop-blur-md flex items-center gap-1">
                      YouTube
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-[17px] text-[#4A4A40] line-clamp-2 leading-tight mb-3 group-hover:text-[#D48166] transition-colors">
                    {v.title}
                  </h3>
                  <div className="mt-auto flex items-center justify-between text-xs text-[#8A8A7A] font-bold">
                    <span className="flex items-center gap-1.5 bg-[#F9F9F7] px-2.5 py-1 rounded-md border border-[#E0E0D5] text-[#6A6A5A]">
                      <TrendingUp className="w-3.5 h-3.5 text-[#94A684]" />{" "}
                      {v.level}
                    </span>
                    <span className="text-[#8A8A7A] hover:text-[#D48166] font-medium transition-colors">
                      {v.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
