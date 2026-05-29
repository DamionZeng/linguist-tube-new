import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Compass, BookText, Search, History, Star } from "lucide-react";

export const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-full bg-[#F5F5F0] font-sans text-[#4A4A40] overflow-hidden max-w-[1920px] mx-auto">
      {/* Top Nav (Desktop) */}
      <nav className="hidden md:flex h-16 px-8 items-center justify-between bg-white/50 border-b border-[#E0E0D5] backdrop-blur-sm shrink-0 shadow-sm z-50">
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
              首页
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] text-white shadow-md" : "text-[#6A6A5A] hover:bg-[#EAEAE0]"}`
              }
            >
              最近学习
            </NavLink>
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] text-white shadow-md" : "text-[#6A6A5A] hover:bg-[#EAEAE0]"}`
              }
            >
              我的收藏
            </NavLink>
            <NavLink
              to="/vocab"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] text-white shadow-md" : "text-[#6A6A5A] hover:bg-[#EAEAE0]"}`
              }
            >
              单词本
            </NavLink>
            <NavLink
              to="/library"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all ${isActive ? "bg-[#4A4A40] text-white shadow-md" : "text-[#6A6A5A] hover:bg-[#EAEAE0]"}`
              }
            >
              我的
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="bg-[#EAEAE0] px-4 py-2 rounded-full flex items-center gap-3 border border-transparent focus-within:border-[#D48166] transition-colors cursor-text hover:bg-[#E0E0D5]">
            <span className="text-sm text-[#8A8A7A] font-medium select-none">
              Search lessons...
            </span>
            <Search className="w-4 h-4 text-[#4A4A40]" />
          </div>
          <div className="w-10 h-10 rounded-full bg-[#D48166] text-white flex items-center justify-center font-bold font-serif shadow-md cursor-pointer hover:scale-105 transition-transform">
            A
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-0">
        <Outlet />
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden flex items-center justify-around h-[68px] bg-white border-t border-[#E0E0D5] pb-safe shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50">
        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] hover:text-[#6A6A5A]"}`
          }
        >
          <Compass className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">首页</span>
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] hover:text-[#6A6A5A]"}`
          }
        >
          <History className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">最近学习</span>
        </NavLink>
        <NavLink
          to="/favorites"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] hover:text-[#6A6A5A]"}`
          }
        >
          <Star className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">我的收藏</span>
        </NavLink>
        <NavLink
          to="/vocab"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 w-[20%] transition-colors ${isActive ? "text-[#D48166]" : "text-[#8A8A7A] hover:text-[#6A6A5A]"}`
          }
        >
          <BookText className="w-[20px] h-[20px]" />
          <span className="text-[10px] font-bold tracking-wide">单词本</span>
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
          <span className="text-[10px] font-bold tracking-wide">我的</span>
        </NavLink>
      </nav>
    </div>
  );
};
