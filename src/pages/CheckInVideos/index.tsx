import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarCheck, Play, TrendingUp } from 'lucide-react';
import { Header } from '../../components/Header';
import { getCheckInVideosByDate } from '@api/storage';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';
import { useTranslation } from 'react-i18next';

export const CheckInVideosPage: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    getCheckInVideosByDate(date).then(data => {
      setVideos(data);
      setLoading(false);
    }).catch(() => {
      setVideos([]);
      setLoading(false);
    });
  }, [date]);

  if (!user) {
    return <LoginPrompt message={t('messages.loginHistory')} />;
  }

  const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('default', {
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <div className="w-full h-screen bg-[#F5F5F0] text-[#4A4A40] flex flex-col overflow-hidden max-w-[1920px] mx-auto font-sans" style={{ height: '100dvh' }}>
      <Header title={formattedDate ? `${t('checkin.title')} · ${formattedDate}` : t('checkin.title')} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-[3px] border-[#E0E0D5] border-t-[#D48166] animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[#8A8A7A]">
            <CalendarCheck className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-bold">{t('checkin.noVideos')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {videos.map(v => {
              const tagList = typeof v.tag === 'string'
                ? v.tag.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 2)
                : [];
              return (
              <div
                key={v.id}
                onClick={() => navigate(`/video/${v.id}`)}
                className="flex gap-3 py-3.5 px-3 bg-white rounded-xl border border-[#E0E0D5] cursor-pointer hover:border-[#94A684] hover:shadow-sm transition-all group"
              >
                <div className="w-24 md:w-36 aspect-video bg-[#EAEAE0] rounded-lg overflow-hidden shrink-0 relative self-center">
                  <img
                    src={v.thumb || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="thumbnail"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                  {v.duration && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-mono font-bold tracking-wide backdrop-blur-md">
                      {v.duration}
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0 justify-center gap-2 py-0.5">
                  <h3 className="text-sm md:text-[15px] font-bold text-[#4A4A40] line-clamp-2 leading-snug group-hover:text-[#D48166] transition-colors">
                    {v.title}
                  </h3>
                  {tagList.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {tagList.map((tg, i) => (
                        <span key={i} className="text-[8px] uppercase tracking-wider font-bold bg-[#F5F5F0] text-[#6A6A5A] px-1.5 py-0.5 rounded border border-[#E0E0D5]">
                          {tg}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] text-[#94A684] font-bold">
                      <CalendarCheck className="w-3 h-3" />
                      {t('checkin.checkedIn')}
                    </span>
                    {v.level && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#6A6A5A] bg-[#F9F9F7] px-2 py-0.5 rounded-md border border-[#E0E0D5]">
                        <TrendingUp className="w-3 h-3 text-[#94A684]" />
                        {v.level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
