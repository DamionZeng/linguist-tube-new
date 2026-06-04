/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FullscreenToolbar } from './components/FullscreenToolbar';
import { ExplorePage } from './pages/Explore';
import { LibraryPage } from './pages/Library';
import { VideoLearningPage } from './pages/VideoLearning';
import { VocabularyPage } from './pages/Vocabulary';
import { WordDetailsPage } from './pages/WordDetails';
import { HistoryPage } from './pages/History';
import { FavoritesPage } from './pages/Favorites';
import { YoutubeNewsPage } from './pages/YoutubeNews';
import { CheckInVideosPage } from './pages/CheckInVideos';
import { SentenceMode } from './pages/Practice/SentenceMode';
import { FullMode } from './pages/Practice/FullMode';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function GlobalFullscreenToolbar() {
  const navigate = useNavigate();
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
    <FullscreenToolbar
      active={isFullscreen}
      onNavigate={(path) => navigate(path)}
      onToggleFullscreen={toggleFullscreen}
      onOpenSearch={() => {}}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <GlobalFullscreenToolbar />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/explore" replace />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/youtube-news" element={<YoutubeNewsPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/vocab" element={<VocabularyPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
            </Route>
            <Route path="/video/:id" element={<VideoLearningPage />} />
            <Route path="/checkin/:date" element={<CheckInVideosPage />} />
            <Route path="/vocab/:word" element={<WordDetailsPage />} />

            {/* Practice Module Routes */}
            <Route path="/practice/sentence/:id" element={<SentenceMode />} />
            <Route path="/practice/full/:id" element={<FullMode />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
