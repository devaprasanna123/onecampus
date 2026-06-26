import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SubjectPage } from './pages/SubjectPage';
import { StudyPage } from './pages/StudyPage';
import { Bookmarks } from './pages/Bookmarks';
import { Revision } from './pages/Revision';
import { Profile } from './pages/Profile';
import { UnitAnswerKey } from './pages/UnitAnswerKey';
import { SignIn } from './pages/SignIn';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ProgressProvider } from './features/progress/ProgressContext';
import { ThemeProvider } from './features/theme/ThemeContext';





const AppRoutes: React.FC = () => {
  const { user, profile } = useAuth();





  const [activePage, setActivePage] = useState('Dashboard');

  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  if (!user) {
    return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <ProgressProvider userId={profile?.id}>
      <Layout
        activePage={activePage}
        setActivePage={setActivePage}
        globalSearchQuery={globalSearchQuery}
        setGlobalSearchQuery={setGlobalSearchQuery}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subject/subject-chem" element={<SubjectPage globalSearchQuery={globalSearchQuery} />} />
          {/* Per-unit study page */}
          <Route path="/subject/subject-chem/unit/:unitId/study" element={<StudyPage globalSearchQuery={globalSearchQuery} />} />
          {/* Unit answer key pages */}
          <Route path="/subject/subject-chem/unit/:unitNumber/answer-key" element={<UnitAnswerKey />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/revision" element={<Revision />} />
          <Route path="/profile" element={<Profile />} />
          {isAdmin && <Route path="/admin" element={<AdminDashboard />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ProgressProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
