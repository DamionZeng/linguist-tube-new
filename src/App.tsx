/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FullscreenToolbar } from './components/FullscreenToolbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// ── 路由级代码分割：按需懒加载各页面 ──
const ExplorePage = lazy(() => import('./pages/Explore').then(m => ({ default: m.ExplorePage })));
const LibraryPage = lazy(() => import('./pages/Library').then(m => ({ default: m.LibraryPage })));
const VideoLearningPage = lazy(() => import('./pages/VideoLearning').then(m => ({ default: m.VideoLearningPage })));
const VocabularyPage = lazy(() => import('./pages/Vocabulary').then(m => ({ default: m.VocabularyPage })));
const WordDetailsPage = lazy(() => import('./pages/WordDetails').then(m => ({ default: m.WordDetailsPage })));
const HistoryPage = lazy(() => import('./pages/History').then(m => ({ default: m.HistoryPage })));
const FavoritesPage = lazy(() => import('./pages/Favorites').then(m => ({ default: m.FavoritesPage })));
const YoutubeNewsPage = lazy(() => import('./pages/YoutubeNews').then(m => ({ default: m.YoutubeNewsPage })));
const YoutubeResourcePage = lazy(() => import('./pages/YoutubeResource').then(m => ({ default: m.YoutubeResourcePage })));
const ParseTasksPage = lazy(() => import('./pages/ParseTasks').then(m => ({ default: m.ParseTasksPage })));
const CheckInVideosPage = lazy(() => import('./pages/CheckInVideos').then(m => ({ default: m.CheckInVideosPage })));
const SentenceMode = lazy(() => import('./pages/Practice/SentenceMode').then(m => ({ default: m.SentenceMode })));
const FullMode = lazy(() => import('./pages/Practice/FullMode').then(m => ({ default: m.FullMode })));
const GetKeyPage = lazy(() => import('./pages/GetKey').then(m => ({ default: m.GetKeyPage })));

/** 统一的页面加载占位 */
function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-[3px] border-[#E0E0D5] border-t-[#D48166] animate-spin" />
    </div>
  );
}

function GlobalFullscreenToolbar() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const isPracticeMode = location.pathname.startsWith('/practice/sentence/') || 
                         location.pathname.startsWith('/practice/full/');

  return (
    <FullscreenToolbar
      active={isFullscreen || isPracticeMode}
      isFullscreen={isFullscreen}
      onNavigate={(path) => navigate(path)}
      onToggleFullscreen={toggleFullscreen}
      onOpenSearch={() => {}}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <GlobalFullscreenToolbar />
            <Suspense fallback={<PageFallback />}>
              <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/explore" replace />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/youtube-news" element={<YoutubeNewsPage />} />
                <Route path="/youtube-resource" element={<YoutubeResourcePage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/vocab" element={<VocabularyPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
              </Route>
              <Route path="/video/:id" element={<VideoLearningPage />} />
              <Route path="/checkin/:date" element={<CheckInVideosPage />} />
              <Route path="/vocab/:word" element={<WordDetailsPage />} />
              <Route path="/parse-tasks" element={<ParseTasksPage />} />

              {/* Practice Module Routes */}
              <Route path="/practice/sentence/:id" element={<SentenceMode />} />
              <Route path="/practice/full/:id" element={<FullMode />} />

              {/* Standalone Pages */}
              <Route path="/get-key" element={<GetKeyPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
