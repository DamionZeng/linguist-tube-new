import React, { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Compass, BookText, Search, History, Heart, User, Maximize, Minimize } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { GlobalSearch } from "./GlobalSearch";
import { PullToRefresh } from "./PullToRefresh";

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setIsFullscreen(!!document.fullscreenElement);
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <div className="flex flex-col w-full bg-[#F5F5F0] font-sans text-[#4A4A40] overflow-hidden max-w-[1920px] mx-auto" style={{ height: '100dvh' }}>
      <PullToRefresh active={isFullscreen} onRefresh={handleRefresh} />

      {/* Top Nav (Desktop) */}
      <nav className="hidden md:flex h-16 px-8 items-center justify-between bg-white/50 border-b border-[#E0E0D5] backdrop-blur-sm shrink-0 shadow-sm z-40">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-serif italic font-bold text-[#5A5A40]">
            LinguistTube
          </h1>
          <div className="flex gap-2 text-sm font-bold">
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] text-white shadow-md" : "text-[#6A6A5A] hover:bg-[#EAEAE0]"}`
              }
            >
              {t('nav.explore')}
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] text-white shadow-md" : "text-[#6A6A5A] hover:bg-[#EAEAE0]"}`
              }
            >
              {t('nav.history')}
            </NavLink>
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] text-white shadow-md" : "text-[#6A6A5A] hover:bg-[#EAEAE0]"}`
              }
            >
              {t('nav.favorites')}
            </NavLink>
            <NavLink
              to="/vocab"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] text-white shadow-md" : "text-[#6A6A5A] hover:bg-[#EAEAE0]"}`
              }
            >
              {t('nav.vocab')}
            </NavLink>
            <NavLink
              to="/library"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] text-white shadow-md" : "text-[#6A6A5A] hover:bg-[#EAEAE0]"}`
              }
            >
              {t('nav.library')}
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div 
            onClick={() => setIsSearchOpen(true)}
            className="bg-[#EAEAE0] px-4 py-2 rounded-full flex items-center gap-3 border border-transparent hover:border-[#D48166] transition-colors cursor-pointer hover:bg-[#E0E0D5]"
          >
            <span className="text-sm text-[#8A8A7A] font-medium select-none">
              {t('nav.search')}
            </span>
            <Search className="w-4 h-4 text-[#4A4A40]" />
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full text-[#6A6A5A] hover:bg-[#EAEAE0] hover:text-[#D48166] transition-colors cursor-pointer"
            title={isFullscreen ? t('nav.exitFullscreen') : t('nav.fullscreen')}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          {user ? (
            <div onClick={() => navigate('/library')} className="w-10 h-10 rounded-full bg-[#D48166] text-white flex items-center justify-center font-bold font-serif shadow-md cursor-pointer hover:scale-105 transition-transform uppercase">
              {user.username.charAt(0)}
            </div>
          ) : (
            <div onClick={() => navigate('/library')} className="w-10 h-10 rounded-full bg-[#EAEAE0] text-[#6A6A5A] flex items-center justify-center font-bold font-serif shadow-sm cursor-pointer hover:bg-[#D48166] hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>
      </nav>

      {/* Top Header (Mobile) */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 bg-white/80 backdrop-blur border-b border-[#E0E0D5] shrink-0 z-40">
        <h1 className="text-xl font-serif italic font-bold text-[#5A5A40]">
          LinguistTube
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full text-[#4A4A40] hover:bg-[#EAEAE0] active:bg-[#EAEAE0] transition-colors"
            title={isFullscreen ? t('nav.exitFullscreen') : t('nav.fullscreen')}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsSearchOpen(true)} className="p-2 text-[#4A4A40]">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-0">
        <React.Fragment key={refreshKey}>
          <Outlet />
        </React.Fragment>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden flex items-center justify-around h-[68px] bg-white border-t border-[#E0E0D5] shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] hover:text-[#6A6A5A]"}`
          }
        >
          <Compass className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">{t('nav.explore')}</span>
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] hover:text-[#6A6A5A]"}`
          }
        >
          <History className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">{t('nav.history')}</span>
        </NavLink>
        <NavLink
          to="/favorites"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] hover:text-[#6A6A5A]"}`
          }
        >
          <Heart className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">{t('nav.favorites')}</span>
        </NavLink>
        <NavLink
          to="/vocab"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] hover:text-[#6A6A5A]"}`
          }
        >
          <BookText className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">{t('nav.vocab')}</span>
        </NavLink>
        <NavLink
          to="/library"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] hover:text-[#6A6A5A]"}`
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">{t('nav.library')}</span>
        </NavLink>
      </nav>
    </div>
  );
};
