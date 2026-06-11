import React, { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Compass, BookText, Search, History, Heart, User, Maximize, Minimize, Moon, Sun, Youtube, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { GlobalSearch } from "./GlobalSearch";
export const Layout: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);

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

  return (
    <div className="flex flex-col w-full bg-[#F5F5F0] dark:bg-[#0B0E14] font-sans text-[#4A4A40] dark:text-[#F8FAFC] overflow-hidden max-w-[1920px] mx-auto" style={{ height: '100dvh' }}>
      {/* Top Nav (Desktop) */}
      <nav className="hidden md:flex h-16 px-8 items-center justify-between bg-white/50 dark:bg-[#151B25] border-b border-[#E0E0D5] dark:border-[#1E293B] backdrop-blur-sm shrink-0 shadow-sm z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/explore')}>
            <img src="/logo.png" alt="Subly" className="h-12 w-auto" />
            <div className="flex flex-col">
              <span className="text-2xl font-serif italic font-bold">
                <span style={{ color: theme === 'dark' ? '#fff' : '#1959a1' }}>Sub</span><span className="text-[#fd363f]">ly</span>
              </span>
              <span className="text-xs font-semibold tracking-wider mt-[-2px]" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
                ENGLISH VIDEO SHADOWING
              </span>
            </div>
          </div>
          <div className="flex gap-2 text-sm font-bold">
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] dark:bg-[#D48166] text-white shadow-md" : "text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B]"}`
              }
            >
              {t('nav.explore')}
            </NavLink>
            <NavLink
              to="/youtube-resource"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] dark:bg-[#D48166] text-white shadow-md" : "text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B]"}`
              }
            >
              {t('nav.youtubeResource')}
            </NavLink>
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] dark:bg-[#D48166] text-white shadow-md" : "text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B]"}`
              }
            >
              {t('nav.favorites')}
            </NavLink>
            <NavLink
              to="/vocab"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] dark:bg-[#D48166] text-white shadow-md" : "text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B]"}`
              }
            >
              {t('nav.vocab')}
            </NavLink>
            <NavLink
              to="/library"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] dark:bg-[#D48166] text-white shadow-md" : "text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B]"}`
              }
            >
              {t('nav.library')}
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setIsSearchOpen(true)}
            className="bg-[#EAEAE0] dark:bg-[#1E293B] px-4 py-2 rounded-full flex items-center gap-3 border border-transparent hover:border-[#D48166] transition-colors cursor-pointer hover:bg-[#E0E0D5] dark:hover:bg-[#2a323f]"
          >
            <span className="text-sm text-[#8A8A7A] dark:text-[#94A3B8] font-medium select-none">
              {t('nav.search')}
            </span>
            <Search className="w-4 h-4 text-[#4A4A40] dark:text-[#F8FAFC]" />
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] hover:text-[#D48166] transition-colors cursor-pointer"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] hover:text-[#D48166] transition-colors cursor-pointer"
            title={isFullscreen ? t('nav.exitFullscreen') : t('nav.fullscreen')}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          {user ? (
            <div onClick={() => navigate('/library')} className="w-10 h-10 rounded-full bg-[#D48166] text-white flex items-center justify-center font-bold font-serif shadow-md cursor-pointer hover:scale-105 transition-transform uppercase">
              {user.username.charAt(0)}
            </div>
          ) : (
            <div onClick={() => navigate('/library')} className="w-10 h-10 rounded-full bg-[#EAEAE0] dark:bg-[#1E293B] text-[#6A6A5A] dark:text-[#94A3B8] flex items-center justify-center font-bold font-serif shadow-sm cursor-pointer hover:bg-[#D48166] hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>
      </nav>

      {/* Top Header (Mobile) */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-[#151B25] border-b border-[#E0E0D5] dark:border-[#1E293B] shrink-0 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/explore')}>
          <img src="/logo.png" alt="Subly" className="h-9 w-auto" />
          <div className="flex flex-col">
            <span className="text-xl font-serif italic font-bold">
              <span style={{ color: theme === 'dark' ? '#fff' : '#1959a1' }}>Sub</span><span className="text-[#fd363f]">ly</span>
            </span>
            <span className="text-[9px] font-semibold tracking-wider mt-[-2px]" style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
              ENGLISH VIDEO SHADOWING
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-[#4A4A40] dark:text-[#F8FAFC] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] active:bg-[#EAEAE0] transition-colors"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full text-[#4A4A40] dark:text-[#F8FAFC] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] active:bg-[#EAEAE0] transition-colors"
            title={isFullscreen ? t('nav.exitFullscreen') : t('nav.fullscreen')}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsSearchOpen(true)} className="p-2 text-[#4A4A40] dark:text-[#F8FAFC]">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-0">
        <Outlet />
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden flex items-center justify-around h-[68px] bg-white dark:bg-[#151B25] border-t border-[#E0E0D5] dark:border-[#1E293B] shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] dark:text-[#94A3B8] hover:text-[#6A6A5A] dark:hover:text-[#CBD5E1]"}`
          }
        >
          <Compass className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">{t('nav.explore')}</span>
        </NavLink>
        <NavLink
          to="/youtube-resource"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] dark:text-[#94A3B8] hover:text-[#6A6A5A] dark:hover:text-[#CBD5E1]"}`
          }
        >
          <Youtube className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">{t('nav.external')}</span>
        </NavLink>
        <NavLink
          to="/favorites"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] dark:text-[#94A3B8] hover:text-[#6A6A5A] dark:hover:text-[#CBD5E1]"}`
          }
        >
          <Heart className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">{t('nav.favorites')}</span>
        </NavLink>
        <NavLink
          to="/vocab"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] dark:text-[#94A3B8] hover:text-[#6A6A5A] dark:hover:text-[#CBD5E1]"}`
          }
        >
          <BookText className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">{t('nav.vocab')}</span>
        </NavLink>
        <NavLink
          to="/library"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] dark:text-[#94A3B8] hover:text-[#6A6A5A] dark:hover:text-[#CBD5E1]"}`
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
