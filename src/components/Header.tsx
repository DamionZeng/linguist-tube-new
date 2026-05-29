import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  rightNode?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, rightNode }) => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-white/50 border-b border-[#E0E0D5] backdrop-blur-sm w-full shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-[#4A4A40] hover:bg-[#EAEAE0] rounded-full transition-colors cursor-pointer">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-serif font-bold text-[#5A5A40] line-clamp-1">{title}</h1>
      </div>
      {rightNode && (
        <div className="flex items-center justify-end gap-3 text-[#6A6A5A]">
          {rightNode}
        </div>
      )}
    </header>
  );
};

