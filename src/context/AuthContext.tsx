import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, OTPState } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingOTP: OTPState | null;
  startRegister: (name: string, email: string, phone?: string) => Promise<{ success: boolean; error?: string; otpState?: OTPState }>;
  startLogin: (email: string) => Promise<{ success: boolean; error?: string; otpState?: OTPState }>;
  verifyOTP: (code: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  resendOTP: () => Promise<{ success: boolean; error?: string; otpState?: OTPState }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingOTP, setPendingOTP] = useState<OTPState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const activeUser = authService.getCurrentUser();
      const storedOtp = authService.getPendingOTP();
      setCurrentUser(activeUser);
      setPendingOTP(storedOtp);
    } catch (err) {
      console.error('Error restoring session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = () => {
    const active = authService.getCurrentUser();
    setCurrentUser(active);
  };

  const startRegister = async (name: string, email: string, phone?: string) => {
    const res = await authService.initiateRegistration(name, email, phone);
    if (res.success && res.otpState) {
      setPendingOTP(res.otpState);
    }
    return res;
  };

  const startLogin = async (email: string) => {
    const res = await authService.initiateLogin(email);
    if (res.success && res.otpState) {
      setPendingOTP(res.otpState);
    }
    return res;
  };

  const verifyOTP = async (code: string) => {
    const res = await authService.verifyOTP(code);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setPendingOTP(null);
    }
    return res;
  };

  const resendOTP = async () => {
    const res = await authService.resendOTP();
    if (res.success && res.otpState) {
      setPendingOTP(res.otpState);
    }
    return res;
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setPendingOTP(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        pendingOTP,
        startRegister,
        startLogin,
        verifyOTP,
        resendOTP,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
