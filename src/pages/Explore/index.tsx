import React, { useEffect, useState, useRef, useCallback } from "react";
import { Play, TrendingUp, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchExploreData } from "@api/general";
import { FilterBar } from "../../components/FilterBar";
import { useLocalized } from "../../hooks/useLocalized";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 50;

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { title: locTitle, desc: locDesc } = useLocalized();
  const [categories, setCategories] = useState<string[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [carousel, setCarousel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLevel, setActiveLevel] = useState("All");
  const [activeDuration, setActiveDuration] = useState("All");
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 首次加载 / 切换筛选时重新加载
  const loadData = useCallback((category: string, level: string, duration: string, isInitial: boolean) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    setHasMore(false);
    fetchExploreData(0, PAGE_SIZE, category, 'platform', level, duration)
      .then((res) => {
        if (isInitial) {
          setCategories(res.categories);
          setCarousel(res.carousel);
        }
        setVideos(res.videos);
        setTotal(res.total);
        setHasMore(res.hasMore);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load explore data.");
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    loadData(activeCategory, activeLevel, activeDuration, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 筛选变化时刷新（不触发全页 loading）
  useEffect(() => {
    if (!loading) {
      loadData(activeCategory, activeLevel, activeDuration, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, activeLevel, activeDuration]);

  // 滚动加载更多
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchExploreData(videos.length, PAGE_SIZE, activeCategory, 'platform', activeLevel, activeDuration)
      .then((res) => {
        setVideos(prev => [...prev, ...res.videos]);
        setTotal(res.total);
        setHasMore(res.hasMore);
        setLoadingMore(false);
      })
      .catch(() => {
        setLoadingMore(false);
      });
  }, [videos.length, activeCategory, activeLevel, activeDuration, loadingMore, hasMore]);

  // IntersectionObserver 触发加载更多
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, hasMore, loadingMore]);

  useEffect(() => {
    if (carousel.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carousel.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [carousel.length]);

  const nextSlide = () =>
    setCurrentSlide((prev) => carousel.length > 0 ? (prev + 1) % carousel.length : 0);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => carousel.length > 0 ? (prev - 1 + carousel.length) % carousel.length : 0,
    );

  if (loading && carousel.length === 0 && videos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[50vh] gap-4">
        <div className="text-[#D48166] font-bold">{error}</div>
        <button 
          onClick={() => loadData(activeCategory, activeLevel, activeDuration)}
          className="bg-[#D48166] hover:bg-[#C27055] text-white px-6 py-2 rounded-full font-bold transition-all shadow-md active:scale-95"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="md:p-8 max-w-7xl mx-auto pb-10 mt-2 md:mt-0">
      {/* Hero Carousel */}
      <section className="relative w-full rounded-2xl md:rounded-[32px] overflow-hidden bg-[#2A2A25] h-[220px] md:h-[300px] shadow-lg group mb-6 md:mb-10">
        {carousel.map((item, index) => (
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
                {locTitle(item)}{" "}
                <span className="font-sans text-white/80 font-normal text-sm md:text-xl ml-1">
                  ({item.subtitle})
                </span>
              </h3>
              <p className="text-white/80 text-xs md:text-sm mb-4 md:mb-5 max-w-md font-medium leading-relaxed drop-shadow line-clamp-3">
                {locDesc(item)}
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
          {carousel.map((_, idx) => (
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
             onClick={() => navigate('/youtube-resource')}
             className="text-xs sm:text-sm font-bold text-[#D48166] hover:text-[#C27055] transition-colors flex items-center gap-1 bg-[#D48166]/10 px-2 sm:px-3 py-1.5 rounded-lg shrink-0 whitespace-nowrap"
          >
            <Play className="w-3 h-3 sm:w-4 sm:h-4" /> {t('explore.youtubeResource')}
          </button>
        </div>

        {/* Multi-function Filter Bar */}
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          activeLevel={activeLevel}
          activeDuration={activeDuration}
          onCategoryChange={setActiveCategory}
          onLevelChange={setActiveLevel}
          onDurationChange={setActiveDuration}
        />

        {/* Videos Grid */}
        {refreshing && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 rounded-full border-2 border-[#D48166] border-t-transparent animate-spin" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2">
          {videos.map((v) => (
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
                  {locTitle(v)}
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
        
        {/* Intersection Observer Target — 触底加载更多 */}
        {hasMore && (
          <div ref={observerTarget} className="w-full h-10 mt-6 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#D48166] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </section>
    </div>
  );
};
