import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/common/Logo';
import { 
  Mail, 
  User as UserIcon, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AtSign
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Registration fields
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { loginWithPassword, loginWithGoogle, startRegister } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle direct Email + Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithPassword(loginEmail, loginPassword);
      setLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Invalid email or password.');
        showToast(result.error || 'Login failed', 'error');
        return;
      }

      showToast(`Welcome back, ${result.user?.name || 'User'}!`, 'success');
      const destination = (location.state as any)?.from?.pathname || '/home';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Login error occurred.');
    }
  };

  // Trigger Real Google OAuth Authentication
  const handleGoogleClick = async () => {
    setErrorMessage('');
    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle();
      setGoogleLoading(false);

      if (result.cancelled) {
        // User closed or cancelled the Google popup — do not authenticate
        return;
      }

      if (!result.success) {
        setErrorMessage(result.error || 'Google authentication was not completed.');
        showToast(result.error || 'Google sign-in failed', 'error');
        return;
      }

      showToast(`Signed in with Google as ${result.user?.name || 'Google User'}!`, 'success');
      const destination = (location.state as any)?.from?.pathname || '/home';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setGoogleLoading(false);
      setErrorMessage(err.message || 'Google authentication error.');
    }
  };

  // Handle Registration (triggers 4-digit OTP for first-time email activation)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!userId.trim()) {
      setErrorMessage('Please enter a User ID.');
      return;
    }
    if (!registerEmail.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await startRegister(name, userId, registerEmail, registerPassword, phone);
      setLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to initiate registration.');
        showToast(result.error || 'Registration failed', 'error');
        return;
      }

      showToast('Verification code generated. Please enter your OTP.', 'success');
      navigate('/otp', { 
        state: { 
          email: registerEmail.trim().toLowerCase(), 
          purpose: 'register' 
        } 
      });
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Registration error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-brand-600/20 via-cyan-500/20 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" showTagline={true} />
          
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Secure Authentication • Firebase Cloud</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
          {/* Tabs: Login / Register */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <span className="shrink-0 text-rose-400 font-bold">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. LOGIN FORM (Google OAuth + Email/Password) */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 border border-slate-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {googleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                    <span>Connecting to Google OAuth...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google G Logo SVG */}
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#0F1626] px-3 text-[11px] text-slate-400 font-mono uppercase tracking-wider shrink-0">
                  or sign in with password
                </span>
                <div className="border-t border-white/10 w-full" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-500 text-white text-sm font-bold shadow-glow-cyan hover:shadow-glow-brand hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 2. REGISTER FORM (New user sets Name, Email, Password + verifies OTP first time) */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              {/* Google Sign Up Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 border border-slate-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {googleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                    <span>Connecting to Google OAuth...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Sign up with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#0F1626] px-3 text-[11px] text-slate-400 font-mono uppercase tracking-wider shrink-0">
                  or register with email
                </span>
                <div className="border-t border-white/10 w-full" />
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Full Name <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Puneeth R"
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    User ID <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={userId}
                      onChange={(e) => setUserId(e.target.value.toLowerCase().trim())}
                      placeholder="e.g. puneeth123"
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Email Address <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Create Password <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Phone Number <span className="text-slate-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/25 text-[11px] text-cyan-300 leading-snug flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>First-time registration generates a 4-digit OTP to verify your email, then your password is saved for direct login.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-500 text-white text-sm font-bold shadow-glow-cyan hover:shadow-glow-brand hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>Sending 4-Digit OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Verify OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Security footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Google OAuth & Password Security • Firebase Database</span>
        </div>
      </div>
    </div>
  );
};
