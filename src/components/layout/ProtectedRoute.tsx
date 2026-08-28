import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shadow-glow-cyan animate-pulse">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
        <p className="mt-4 text-xs font-mono text-slate-400">
          Authenticating VerifyAI session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to login, preserving intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
