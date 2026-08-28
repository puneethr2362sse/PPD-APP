import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
import { ToastProvider } from './context/ToastContext';
import { ViewModeProvider, useViewMode } from './context/ViewModeContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DeviceSwitcher } from './components/common/DeviceSwitcher';
import { MobileFrameWrapper } from './components/layout/MobileFrameWrapper';

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

// Auth Screen Wrapper that honors Mobile Simulation mode on Desktop
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode } = useViewMode();
  if (mode === 'mobile-sim') {
    return (
      <>
        <div className="hidden lg:block">
          <MobileFrameWrapper>{children}</MobileFrameWrapper>
        </div>
        <div className="block lg:hidden">{children}</div>
      </>
    );
  }
  return <>{children}</>;
};

// App Shell with Device Switcher
const AppContent: React.FC = () => {
  const { mode, toggleMode } = useViewMode();

  return (
    <>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<AuthWrapper><AuthPage /></AuthWrapper>} />
        <Route path="/register" element={<AuthWrapper><AuthPage /></AuthWrapper>} />
        <Route path="/otp" element={<AuthWrapper><OtpPage /></AuthWrapper>} />

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

      {/* Floating Device Mode Switcher for testing on laptop screen or phone */}
      <DeviceSwitcher currentMode={mode} onToggleMode={toggleMode} />
    </>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ViewModeProvider>
        <AuthProvider>
          <HistoryProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </HistoryProvider>
        </AuthProvider>
      </ViewModeProvider>
    </BrowserRouter>
  );
}

export default App;
