import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { AuthPage } from './pages/AuthPage';
import { OtpPage } from './pages/OtpPage';
import { HomePage } from './pages/HomePage';
import { TextScanPage } from './pages/TextScanPage';
import { ImageScanPage } from './pages/ImageScanPage';
import { ResultPage } from './pages/ResultPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';

// Root redirect helper
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? '/home' : '/login'} replace />;
};

// App Shell
const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/otp" element={<OtpPage />} />

      {/* Protected Application Routes inside Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/scan/text" element={<TextScanPage />} />
        <Route path="/scan/image" element={<ImageScanPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Root & Catch-all */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HistoryProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </HistoryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
