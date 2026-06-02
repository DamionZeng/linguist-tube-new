import React, { useEffect, useState } from "react";
import { Play, TrendingUp, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchExploreData } from "@api/general";
import { useTranslation } from "react-i18next";

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<{ categories: string[]; videos: any[]; carousel: any[] }>({
    categories: [],
    videos: [],
    carousel: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchExploreData()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load explore data.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (data.carousel.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % data.carousel.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [data.carousel.length]);

  const nextSlide = () =>
    setCurrentSlide((prev) => data.carousel.length > 0 ? (prev + 1) % data.carousel.length : 0);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => data.carousel.length > 0 ? (prev - 1 + data.carousel.length) % data.carousel.length : 0,
    );

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
    <div className="md:p-8 max-w-7xl mx-auto pb-10 mt-2 md:mt-0">
      {/* Hero Carousel */}
      <section className="relative w-full rounded-2xl md:rounded-[32px] overflow-hidden bg-[#2A2A25] h-[220px] md:h-[300px] shadow-lg group mb-6 md:mb-10">
        {data.carousel.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10"></div>
            <img
              src={item.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80'}
              className="w-full h-full object-cover"
              alt={item.title}
            />

            <div className="absolute inset-x-0 bottom-0 top-0 p-6 md:p-10 flex flex-col justify-center z-20 text-white w-full md:w-2/3">
              <div className="flex flex-wrap">
                {item.tag && item.tag.split(',').map((t, idx) => t.trim().toUpperCase()).slice(0, 2).map((t, idx) => (
                  <div key={idx} className="bg-white/20 backdrop-blur-md inline-block px-2.5 py-1 rounded w-max text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3 border border-white/20 shadow-sm mr-2">
                    {t}
                  </div>
                ))}
              </div>
              <h3 className="text-xl md:text-3xl font-serif font-bold mb-1.5 md:mb-2 leading-tight drop-shadow-md">
                {item.title}{" "}
                <span className="font-sans text-white/80 font-normal text-sm md:text-xl ml-1">
                  ({item.subtitle})
                </span>
              </h3>
              <p className="text-white/80 text-xs md:text-sm mb-4 md:mb-5 max-w-md font-medium leading-relaxed drop-shadow line-clamp-2 md:line-clamp-none">
                {item.desc}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/video/${item.id}`);
                }}
                className="bg-[#D48166] hover:bg-[#C27055] text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full font-bold transition-all shadow-md flex items-center gap-2 w-max text-sm"
              >
                <Play className="w-[18px] h-[18px] fill-current" /> {t('explore.startLearning')}
              </button>
            </div>
          </div>
        ))}

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-1.5 md:p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-1.5 md:p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 md:gap-2">
          {data.carousel.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      </section>

      {/* Grid List */}
      <section>
        <div className="flex items-center justify-between mb-4 md:mb-5 gap-2">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#5A5A40] truncate">
            {t('explore.recommended')}
          </h2>
          <button 
             onClick={() => navigate('/youtube-news')}
             className="text-xs sm:text-sm font-bold text-[#D48166] hover:text-[#C27055] transition-colors flex items-center gap-1 bg-[#D48166]/10 px-2 sm:px-3 py-1.5 rounded-lg shrink-0 whitespace-nowrap"
          >
            <Play className="w-3 h-3 sm:w-4 sm:h-4" /> {t('explore.youtubeNews')}
          </button>
        </div>

        {/* Categories */}
        <div 
          className="flex gap-2.5 overflow-x-auto pb-4 hide-scrollbar cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            const ele = e.currentTarget;
            let isDown = true;
            let startX = e.pageX - ele.offsetLeft;
            let scrollLeft = ele.scrollLeft;

            const onMouseMove = (e: MouseEvent) => {
              if (!isDown) return;
              e.preventDefault();
              const x = e.pageX - ele.offsetLeft;
              const walk = (x - startX) * 2; // scroll-fast
              ele.scrollLeft = scrollLeft - walk;
            };

            const onMouseUp = () => {
              isDown = false;
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        >
          {data.categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer shrink-0 ${activeCategory === cat ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm" : "bg-white border-[#E0E0D5] text-[#6A6A5A] hover:border-[#94A684] hover:text-[#4A4A40]"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2">
          {data.videos.filter(v => activeCategory === "All" || v.category === activeCategory).map((v) => (
            <div
              key={v.id}
              onClick={() => navigate(`/video/${v.id}`)}
              className="bg-white rounded-[24px] overflow-hidden border border-[#E0E0D5] hover:border-[#94A684] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
            >
              <div className="relative aspect-video overflow-hidden bg-[#EAEAE0] p-1">
                <div className="w-full h-full rounded-[20px] overflow-hidden relative">
                  <img
                    src={v.thumb || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt={v.title}
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded-md font-mono font-bold tracking-wide backdrop-blur-md">
                    {v.duration}
                  </div>
                  {/* VIP Tag / Free Tag - Top Left */}
                  {v.isVipOnly ? (
                    <div className="absolute top-2 left-2 bg-[#E1B12C]/90 text-white text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg font-bold shadow-sm backdrop-blur-md flex items-center gap-1">
                      <Lock className="w-3 h-3" /> VIP
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 bg-[#22c55e]/90 text-white text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg font-bold shadow-sm backdrop-blur-md">
                      {t('explore.free')}
                    </div>
                  )}
                  {/* Original Tags - Top Right */}
                  {v.tag && (
                    <div className="absolute top-2 right-2 flex gap-2 flex-wrap justify-end">
                      {v.tag.split(',').map((t, idx) => t.trim().toUpperCase()).slice(0, 2).map((t, idx) => (
                        <div key={idx} className="bg-white/90 text-[#4A4A40] text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg font-bold shadow-sm backdrop-blur-md">
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
