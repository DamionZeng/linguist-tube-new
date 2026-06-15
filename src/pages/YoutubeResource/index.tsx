import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, TrendingUp, Link, Download, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';
import { FilterBar } from '../../components/FilterBar';
import { useLocalized } from '../../hooks/useLocalized';
import { fetchExploreData } from '@api/general';
import { submitParseTask } from '@api/parser';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 50;

export const YoutubeResourcePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { title: locTitle } = useLocalized();

  const [url, setUrl] = useState('');
  const [download, setDownload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [videos, setVideos] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeLevel, setActiveLevel] = useState('All');
  const [activeDuration, setActiveDuration] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const isMember = user?.role === 'vip' || user?.role === 'admin';
  const isAdmin = user?.username === 'admin';

  const loadExternalVideos = useCallback((offset: number = 0, isInitial: boolean = true, category?: string, level?: string, duration?: string) => {
    if (offset === 0) {
      if (isInitial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
    } else {
      setLoadingMore(true);
    }
    const cat = category && category !== 'All' ? category : undefined;
    const lvl = level && level !== 'All' ? level : undefined;
    const dur = duration && duration !== 'All' ? duration : undefined;
    fetchExploreData(offset, PAGE_SIZE, cat, 'external', lvl, dur)
      .then((res) => {
        setVideos(prev => offset === 0 ? res.videos : [...prev, ...res.videos]);
        if (offset === 0 && isInitial) {
          setCategories(res.categories);
        }
        setHasMore(res.hasMore);
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    if (!isMember) return;
    loadExternalVideos(0, true, activeCategory, activeLevel, activeDuration);
    isFirstLoad.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMember]);

  // 筛选变化时只刷新视频列表（不清空已有数据）
  useEffect(() => {
    if (!isMember || isFirstLoad.current) return;
    loadExternalVideos(0, false, activeCategory, activeLevel, activeDuration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, activeLevel, activeDuration]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    loadExternalVideos(videos.length, false, activeCategory, activeLevel, activeDuration);
  }, [videos.length, loadingMore, hasMore, loadExternalVideos, activeCategory, activeLevel, activeDuration]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore();
      },
      { threshold: 0.1 }
    );
    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => { if (target) observer.unobserve(target); };
  }, [loadMore, hasMore, loadingMore]);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitParseTask(url.trim(), user?.username || '', download);
      setUrl('');
      navigate(`/parse-tasks?highlight=${result.task_id}`);
    } catch (e: any) {
      setSubmitError(e.message || t('youtubeResource.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  // 未登录 → 显示登录组件
  if (!user) {
    return <LoginPrompt message={t('messages.loginResource')} />;
  }

  // 已登录但非会员 → 显示仅限会员
  if (!isMember) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-[#1E293B] rounded-[24px] border border-[#E0E0D5] dark:border-[#334155] p-8 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#D48166]/10 flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-[#D48166]" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#4A4A40] dark:text-[#F8FAFC] mb-2">
            {t('youtubeResource.vipOnly')}
          </h2>
          <p className="text-sm text-[#8A8A7A] dark:text-[#94A3B8] mb-6">
            {t('youtubeResource.vipOnlyDesc')}
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-3 bg-[#D48166] hover:bg-[#C27055] text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95"
          >
            {t('youtubeResource.backToExplore')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#4A4A40] dark:text-[#F8FAFC]">
          {t('youtubeResource.title')}
        </h1>
        <p className="text-sm text-[#8A8A7A] dark:text-[#94A3B8] mt-1">
          {t('youtubeResource.subtitle')}
        </p>
      </div>

      {/* 输入区域 */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[24px] border border-[#E0E0D5] dark:border-[#334155] p-5 md:p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A8A7A] dark:text-[#94A3B8]" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('youtubeResource.urlPlaceholder')}
              className="w-full pl-12 pr-4 py-3.5 bg-[#F9F9F7] dark:bg-[#0B0E14] border border-[#E0E0D5] dark:border-[#334155] rounded-2xl text-[#4A4A40] dark:text-[#F8FAFC] placeholder-[#8A8A7A] dark:placeholder-[#64748B] focus:outline-none focus:border-[#D48166] focus:ring-2 focus:ring-[#D48166]/20 transition-all text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => setDownload(!download)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-bold transition-all whitespace-nowrap ${
                download
                  ? 'bg-[#D48166] text-white border-[#D48166] shadow-md'
                  : 'bg-[#F9F9F7] dark:bg-[#0B0E14] text-[#6A6A5A] dark:text-[#94A3B8] border-[#E0E0D5] dark:border-[#334155] hover:border-[#D48166]'
              }`}
            >
              <Download className="w-4 h-4" />
              {download ? t('youtubeResource.downloadOn') : t('youtubeResource.downloadOff')}
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#D48166] hover:bg-[#C27055] disabled:bg-[#D48166]/50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {submitting ? t('youtubeResource.parsing') : t('youtubeResource.parse')}
          </button>
        </div>

        {submitError && (
          <p className="text-[#D48166] text-sm mt-3 font-medium">{submitError}</p>
        )}
      </div>

      {/* 外部资源视频列表 */}
      <section>
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#F8FAFC]">
            {t('youtubeResource.externalResources')}
          </h2>
          <button
            onClick={() => navigate('/parse-tasks')}
            className="text-xs sm:text-sm font-bold text-[#D48166] hover:text-[#C27055] transition-colors flex items-center gap-1 bg-[#D48166]/10 px-2 sm:px-3 py-1.5 rounded-lg shrink-0 whitespace-nowrap"
          >
            {t('youtubeResource.viewTasks')}
          </button>
        </div>

        {/* 多功能筛选栏 */}
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          activeLevel={activeLevel}
          activeDuration={activeDuration}
          onCategoryChange={setActiveCategory}
          onLevelChange={setActiveLevel}
          onDurationChange={setActiveDuration}
        />

        {loading ? (
          <div className="flex items-center justify-center p-8 min-h-[30vh]">
            <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
          </div>
        ) : videos.length === 0 && !refreshing ? (
          <div className="flex flex-col items-center justify-center p-12 min-h-[30vh] text-[#8A8A7A] dark:text-[#94A3B8]">
            <Play className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-bold text-lg mb-1">{t('youtubeResource.noResources')}</p>
            <p className="text-sm">{t('youtubeResource.noResourcesDesc')}</p>
          </div>
        ) : (
          <>
            {refreshing && (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 rounded-full border-2 border-[#D48166] border-t-transparent animate-spin" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate(`/video/${v.id}`)}
                className="bg-white dark:bg-[#1E293B] rounded-[24px] overflow-hidden border border-[#E0E0D5] dark:border-[#334155] hover:border-[#94A684] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden bg-[#EAEAE0] dark:bg-[#0B0E14] p-1">
                  <div className="w-full h-full rounded-[20px] overflow-hidden relative">
                    <img
                      src={v.thumb || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80'}
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
                    {v.tag && (
                      <div className="absolute top-2 right-2 flex gap-1 flex-wrap justify-end">
                        {v.tag.split(',').map((t: string) => t.trim().toUpperCase()).slice(0, 2).map((t: string, idx: number) => (
                          <div key={idx} className="bg-white/90 text-[#4A4A40] text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-lg font-bold shadow-sm backdrop-blur-md">
                            {t}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-[17px] text-[#4A4A40] dark:text-[#F8FAFC] line-clamp-2 leading-tight mb-3 group-hover:text-[#D48166] transition-colors">
                    {locTitle(v)}
                  </h3>
                  <div className="mt-auto flex items-center justify-between text-xs text-[#8A8A7A] font-bold">
                    <span className="flex items-center gap-1.5 bg-[#F9F9F7] dark:bg-[#0B0E14] px-2.5 py-1 rounded-md border border-[#E0E0D5] dark:border-[#334155] text-[#6A6A5A] dark:text-[#94A3B8]">
                      <TrendingUp className="w-3.5 h-3.5 text-[#94A684]" />
                      {v.level}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}

        {hasMore && (
          <div ref={observerTarget} className="w-full h-10 mt-6 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#D48166] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </section>
    </div>
  );
};
