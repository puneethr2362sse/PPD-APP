import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, FileText, Image as ImageIcon, History, User } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  // If not authenticated, do not show navigation
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const items = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Text', path: '/scan/text', icon: FileText },
    { label: 'Image', path: '/scan/image', icon: ImageIcon },
    { label: 'History', path: '/history', icon: History },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-2xl border-t border-white/10 px-3 py-2 pb-safe">
      <nav className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
