import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { 
  Home, 
  FileText, 
  Image as ImageIcon, 
  History, 
  User, 
  LogOut, 
  PlusCircle, 
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If not authenticated, do not show navigation
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const navLinks = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Text Verification', path: '/scan/text', icon: FileText },
    { name: 'Image Verification', path: '/scan/image', icon: ImageIcon },
    { name: 'History', path: '/history', icon: History },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#090D16]/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link to="/home" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
          <Logo size="sm" />
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow-brand'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: User Profile & Quick Action */}
        <div className="flex items-center gap-3">
          {/* Download 1,500 Test QA Report CTA (Desktop) */}
          <a
            href="/VerifyAI_Test_Report.xlsx"
            download="VerifyAI_Test_Report.xlsx"
            title="Download QA Audit Workbook (1,500 Tests .xlsx)"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-300 hover:text-white hover:border-emerald-400 text-xs font-semibold hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>QA Report</span>
          </a>

          {/* Quick Scan CTA (Desktop) */}
          <Link
            to="/scan/text"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-brand-500 text-white text-xs font-bold hover:shadow-glow-cyan transition-all hover:scale-[1.03]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verify Claim</span>
          </Link>

          {/* User Avatar & Name */}
          <Link
            to="/profile"
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors group"
          >
            <div className="relative">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover border border-cyan-500/30"
                  onError={(e) => {
                    // Fallback to initial if photo fails to load
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className={`w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-500 to-cyan-400 items-center justify-center font-bold text-xs text-white uppercase ${
                  currentUser.photoUrl ? 'hidden' : 'flex'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                @{currentUser.userId || 'investigator'}
              </span>
            </div>
          </Link>

          {/* Quick Logout Button */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
