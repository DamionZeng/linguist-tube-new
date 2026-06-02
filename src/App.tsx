/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
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
import { ResultMode } from './pages/Practice/ResultMode';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
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
            <Route path="/practice/result/:id" element={<ResultMode />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
