import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, OTPState } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingOTP: OTPState | null;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithGoogle: (email?: string, name?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  startRegister: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string; otpState?: OTPState }>;
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

  // Direct login with email + password (no OTP required on standard login)
  const loginWithPassword = async (email: string, password: string) => {
    const res = await authService.loginWithPassword(email, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setPendingOTP(null);
    }
    return res;
  };

  // Direct sign in with Google
  const loginWithGoogle = async (email?: string, name?: string) => {
    const res = await authService.loginWithGoogle(email, name);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setPendingOTP(null);
    }
    return res;
  };

  // Initial registration (requires email confirmation via 4-digit OTP)
  const startRegister = async (name: string, email: string, password: string, phone?: string) => {
    const res = await authService.initiateRegistration(name, email, password, phone);
    if (res.success && res.otpState) {
      setPendingOTP(res.otpState);
    }
    return res;
  };

  // OTP verification for new registrations
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
        loginWithPassword,
        loginWithGoogle,
        startRegister,
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
