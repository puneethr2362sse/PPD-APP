import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/common/Logo';
import { OtpInput } from '../components/common/OtpInput';
import confetti from 'canvas-confetti';
import { 
  KeyRound, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';

export const OtpPage: React.FC = () => {
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const { pendingOTP, verifyOTP, resendOTP } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const targetEmail = pendingOTP?.email || (location.state as any)?.email || 'your email';
  const demoCode = pendingOTP?.code || '4837';

  useEffect(() => {
    // If no pending OTP session exists, redirect back to login
    if (!pendingOTP) {
      const timer = setTimeout(() => {
        if (!pendingOTP) {
          navigate('/login', { replace: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingOTP, navigate]);

  const handleVerify = async (codeToVerify: string = otpValue) => {
    setErrorMessage('');
    if (codeToVerify.length < 4) {
      setErrorMessage('Please enter the complete 4-digit OTP code.');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(codeToVerify);
      setLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Verification failed. Please try again.');
        showToast(result.error || 'Invalid OTP', 'error');
        return;
      }

      // Success confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#6366f1', '#10b981'],
        });
      } catch {
        // ignore
      }

      showToast(`Welcome back, ${result.user?.name || 'User'}!`, 'success');
      
      const destination = (location.state as any)?.from?.pathname || '/home';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Verification error occurred.');
    }
  };

  const handleAutoFill = () => {
    if (demoCode) {
      setOtpValue(demoCode);
      setErrorMessage('');
      showToast('Demo OTP auto-filled!', 'info');
      setTimeout(() => {
        handleVerify(demoCode);
      }, 300);
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    setOtpValue('');
    setLoading(true);
    try {
      const result = await resendOTP();
      setLoading(false);
      if (result.success) {
        showToast('New OTP generated and saved to Firebase.', 'success');
      } else {
        setErrorMessage(result.error || 'Failed to generate new OTP.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message);
    }
  };

  const handleCopyCode = () => {
    if (demoCode) {
      navigator.clipboard.writeText(demoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="md" />
        </div>

        {/* OTP Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
          {/* Back link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Email</span>
          </Link>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-glow-cyan">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-1.5">
              Enter Verification Code
            </h2>
            <p className="text-xs text-slate-300">
              We generated a secure 4-digit code for{' '}
              <span className="font-mono text-cyan-300 font-semibold">{targetEmail}</span>
            </p>
          </div>

          {/* DEMO OTP BANNER (Development & instant testing helper) */}
          <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-brand-950/80 border border-cyan-500/30 flex items-center justify-between shadow-glow-cyan">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400">
                  Demo Mode OTP
                </div>
                <div className="font-mono text-lg font-black text-white tracking-widest">
                  {demoCode}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy OTP"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleAutoFill}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                Auto-fill
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

          {/* 4-Box OTP Input */}
          <div className="mb-6">
            <OtpInput
              value={otpValue}
              onChange={(val) => {
                setOtpValue(val);
                setErrorMessage('');
              }}
              onComplete={(completedVal) => {
                handleVerify(completedVal);
              }}
              disabled={loading}
              hasError={!!errorMessage}
            />
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={loading || otpValue.length < 4}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              otpValue.length === 4 && !loading
                ? 'bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-500 text-white shadow-glow-cyan hover:shadow-glow-brand hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Verifying with Firebase Firestore...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Verify & Enter Dashboard</span>
              </>
            )}
          </button>

          {/* Resend OTP */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Didn't receive? Request new OTP</span>
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Automatic Firebase Session Synchronization</span>
        </div>
      </div>
    </div>
  );
};
