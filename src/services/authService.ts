import { User, OTPState } from '../types';
import { apiClient } from './apiClient';

const STORAGE_SESSION_KEY = 'verifyai_active_session_v1';
const STORAGE_PENDING_OTP_KEY = 'verifyai_pending_otp_v1';

export const authService = {
  // Get active logged in user from session
  getCurrentUser(): User | null {
    const session = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      return null;
    }
  },

  // Initiate Registration via Firebase Backend
  async initiateRegistration(name: string, email: string, phone?: string): Promise<{ success: boolean; error?: string; otpState?: OTPState }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      return { success: false, error: 'Full name is required.' };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      const res = await apiClient.post('/auth/register', {
        name: cleanName,
        email: cleanEmail,
        phone: phone?.trim() || undefined,
      });

      if (res.success && res.otpState) {
        localStorage.setItem(STORAGE_PENDING_OTP_KEY, JSON.stringify(res.otpState));
        return { success: true, otpState: res.otpState };
      }
      return { success: false, error: res.error || 'Registration failed.' };
    } catch (err: any) {
      // Fallback local OTP generation if offline
      const fallbackOtp: OTPState = {
        email: cleanEmail,
        code: Math.floor(1000 + Math.random() * 9000).toString(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        purpose: 'register',
        tempName: cleanName,
        tempPhone: phone?.trim(),
      };
      localStorage.setItem(STORAGE_PENDING_OTP_KEY, JSON.stringify(fallbackOtp));
      return { success: true, otpState: fallbackOtp };
    }
  },

  // Initiate Login via Firebase Backend
  async initiateLogin(email: string): Promise<{ success: boolean; error?: string; otpState?: OTPState }> {
    const cleanEmail = email.trim().toLowerCase();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      const res = await apiClient.post('/auth/login', { email: cleanEmail });
      if (res.success && res.otpState) {
        localStorage.setItem(STORAGE_PENDING_OTP_KEY, JSON.stringify(res.otpState));
        return { success: true, otpState: res.otpState };
      }
      return { success: false, error: res.error || 'Login failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Account not found. Please register first.' };
    }
  },

  // Get active pending OTP state
  getPendingOTP(): OTPState | null {
    const stored = localStorage.getItem(STORAGE_PENDING_OTP_KEY);
    if (!stored) return null;
    try {
      const otp: OTPState = JSON.parse(stored);
      if (Date.now() > otp.expiresAt) {
        localStorage.removeItem(STORAGE_PENDING_OTP_KEY);
        return null;
      }
      return otp;
    } catch {
      return null;
    }
  },

  // Resend OTP via Firebase Backend
  async resendOTP(): Promise<{ success: boolean; error?: string; otpState?: OTPState }> {
    const pending = this.getPendingOTP();
    if (!pending) {
      return { success: false, error: 'No active verification session. Please restart.' };
    }

    try {
      const res = await apiClient.post('/auth/resend-otp', { email: pending.email });
      if (res.success && res.otpState) {
        localStorage.setItem(STORAGE_PENDING_OTP_KEY, JSON.stringify(res.otpState));
        return { success: true, otpState: res.otpState };
      }
      return { success: false, error: res.error || 'Failed to resend OTP.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Verify OTP & complete login/registration
  async verifyOTP(enteredCode: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const pending = this.getPendingOTP();
    if (!pending) {
      return { success: false, error: 'OTP has expired or is invalid. Please request a new code.' };
    }

    try {
      const res = await apiClient.post('/auth/verify-otp', {
        email: pending.email,
        code: enteredCode.trim(),
      });

      if (res.success && res.user) {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(res.user));
        localStorage.removeItem(STORAGE_PENDING_OTP_KEY);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Incorrect OTP entered.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Incorrect OTP entered.' };
    }
  },

  // Logout
  logout(): void {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(STORAGE_PENDING_OTP_KEY);
  }
};
