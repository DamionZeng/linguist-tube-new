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
import { HistoryPage } from './pages/History';
import { FavoritesPage } from './pages/Favorites';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/vocab" element={<VocabularyPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Route>
        <Route path="/video/:id" element={<VideoLearningPage />} />
      </Routes>
    </BrowserRouter>
  );
}
