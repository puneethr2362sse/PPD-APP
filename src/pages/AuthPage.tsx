import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/common/Logo';
import { 
  Mail, 
  User as UserIcon, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound, 
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Registration fields
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Login field
  const [loginEmail, setLoginEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { startRegister, startLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!registerEmail.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await startRegister(name, registerEmail, phone);
      setLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to initiate registration.');
        showToast(result.error || 'Registration failed', 'error');
        return;
      }

      showToast('OTP sent to your email. Please verify.', 'success');
      navigate('/otp', { state: { email: registerEmail.trim().toLowerCase(), purpose: 'register' } });
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Registration error occurred.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await startLogin(loginEmail);
      setLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to initiate login.');
        showToast(result.error || 'Login failed', 'error');
        return;
      }

      showToast('OTP sent to your email. Please verify.', 'success');
      navigate('/otp', { state: { email: loginEmail.trim().toLowerCase(), purpose: 'login' } });
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Login error occurred.');
    }
  };

  const fillDemoPuneeth = () => {
    setActiveTab('login');
    setLoginEmail('puneeth@example.com');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-brand-600/20 via-cyan-500/20 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" showTagline={true} />
          
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <KeyRound className="w-3.5 h-3.5" />
            <span>100% Passwordless Authentication • Firebase Powered</span>
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
              Login
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

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. puneeth@example.com"
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  Demo account in DB: <strong className="text-cyan-300">puneeth@example.com</strong>
                </span>
                <button
                  type="button"
                  onClick={fillDemoPuneeth}
                  className="text-cyan-400 hover:text-cyan-300 font-bold underline font-mono text-[10px]"
                >
                  Autofill
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-500 text-white text-sm font-bold shadow-glow-cyan hover:shadow-glow-brand hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Connecting to Firebase...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP & Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
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
                    placeholder="e.g. Puneeth"
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
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
                    placeholder="e.g. puneeth@example.com"
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                  />
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

              <div className="text-[11px] text-slate-400 leading-snug px-1">
                By continuing, a 4-digit verification code will be generated to activate your profile in the database.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-500 text-white text-sm font-bold shadow-glow-cyan hover:shadow-glow-brand hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Creating Firebase Account...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security assurance footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Session • Zero Passwords • Firebase Firestore</span>
        </div>
      </div>
    </div>
  );
};
