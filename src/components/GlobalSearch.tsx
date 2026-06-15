import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play, Clock, Video, BookText, Quote } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchExplore, searchHistory, searchFavorites, searchVocab, SearchResult } from '@api/search';
import { useLocalized } from '../hooks/useLocalized';
import { useTranslation } from 'react-i18next';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { title: locTitle } = useLocalized();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        let searchFn = searchExplore;
        if (location.pathname.startsWith('/history')) searchFn = searchHistory;
        else if (location.pathname.startsWith('/favorites')) searchFn = searchFavorites;
        else if (location.pathname.startsWith('/vocab')) searchFn = searchVocab;

        const res = await searchFn(query);
        setResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, location.pathname]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'vocab') {
      navigate(`/vocab/${result.title}`);
      onClose();
      return;
    }
    
    if (result.type === 'sentence') {
      navigate('/favorites');
      onClose();
      return;
    }

    if (result.type === 'transcript' && result.time) {
      const parts = result.time.split(':');
      let secs = 0;
      if (parts.length === 2) {
        secs = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      } else if (parts.length === 3) {
        secs = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
      }
      localStorage.setItem(`jump_time_${result.videoId}`, secs.toString());
    }
    
    if (result.videoId) {
      navigate(`/video/${result.videoId}`);
    }
    onClose();
  };

  const getSearchScopeLabel = () => {
    if (location.pathname.startsWith('/history')) return 'history records';
    if (location.pathname.startsWith('/favorites')) return 'favorites';
    if (location.pathname.startsWith('/vocab')) return 'vocabulary book';
    return 'videos, subtitles';
  };

  const getEmptyStateTitle = () => {
    if (location.pathname.startsWith('/history')) return 'Search History';
    if (location.pathname.startsWith('/favorites')) return 'Search Favorites';
    if (location.pathname.startsWith('/vocab')) return 'Search Vocabulary';
    return 'Search English Videos';
  };

  const getEmptyStateDesc = () => {
    if (location.pathname.startsWith('/history')) return 'Search through your recently watched videos.';
    if (location.pathname.startsWith('/favorites')) return 'Search your favorite videos and saved sentences.';
    if (location.pathname.startsWith('/vocab')) return 'Search for words and translations in your vocab book.';
    return 'You can search for video titles or specific subtitle lines.';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white md:bg-black/50 md:backdrop-blur-sm md:p-12 md:items-center pt-safe">
      <div className="flex flex-col w-full md:max-w-3xl md:bg-white md:rounded-[24px] md:shadow-2xl md:max-h-[80vh] h-full overflow-hidden">
        
        {/* Search Header */}
        <div className="flex items-center px-4 md:px-6 py-4 border-b border-[#E0E0D5] gap-3 shrink-0">
          <Search className="w-5 h-5 text-[#8A8A7A]" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-[#4A4A40] placeholder-[#8A8A7A]"
            placeholder={`Search ${getSearchScopeLabel()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-2 bg-[#F5F5F0] hover:bg-[#EAEAE0] rounded-full text-[#4A4A40] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
          {loading ? (
            <div className="flex py-12 justify-center">
               <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              {results.map((r, i) => (
                <div 
                  key={`${r.id}-${i}`} 
                  onClick={() => handleResultClick(r)}
                  className="flex gap-4 p-3 bg-white hover:bg-[#F5F5F0] rounded-2xl border border-transparent hover:border-[#E0E0D5] cursor-pointer transition-colors items-center group"
                >
                  {['video', 'transcript'].includes(r.type) && r.thumb ? (
                    <div className="w-20 md:w-24 aspect-video bg-[#EAEAE0] rounded-xl overflow-hidden shrink-0 relative">
                      <img src={r.thumb} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {r.type === 'video' ? (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-6 h-6 text-white fill-white shadow-md drop-shadow-md" />
                         </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-[#EAEAE0] rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center text-[#8A8A7A]">
                      {r.type === 'vocab' ? <BookText className="w-6 h-6" /> : <Quote className="w-6 h-6" />}
                    </div>
                  )}
                  
                  <div className="flex-1 truncate">
                    <div className="flex items-center gap-2 mb-1">
                      {r.type === 'video' ? (
                        <span className="text-[10px] uppercase font-bold bg-[#4A4A40] text-white px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"><Video className="w-3 h-3" /> VIDEO</span>
                      ) : r.type === 'transcript' ? (
                        <span className="text-[10px] uppercase font-bold bg-[#94A684] text-white px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" /> {r.time}</span>
                      ) : r.type === 'sentence' ? (
                        <span className="text-[10px] uppercase font-bold bg-[#D48166] text-white px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"><Quote className="w-3 h-3" /> SENTENCE</span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold bg-[#8B5CF6] text-white px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"><BookText className="w-3 h-3" /> VOCAB</span>
                      )}
                      <h4 className="font-bold text-[#4A4A40] truncate text-sm md:text-base">{locTitle(r)}</h4>
                    </div>
                    {r.subtitle && <p className="text-xs md:text-sm text-[#8A8A7A] truncate">{r.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() !== '' ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#8A8A7A]">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium text-lg">No findings for "{query}"</p>
              <p className="text-sm">Try searching for other keywords like "interview" or "coffee".</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#8A8A7A]">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium text-lg">{getEmptyStateTitle()}</p>
              <p className="text-sm">{getEmptyStateDesc()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
