import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl sm:text-4xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative flex items-center justify-center">
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-brand-cyan/40 via-brand-500/40 to-purple-500/40 blur-md opacity-70 animate-pulse-glow" />
        
        {/* Icon container */}
        <div className={`relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 p-2 sm:p-2.5 flex items-center justify-center shadow-glow-cyan`}>
          <ShieldCheck className={`${iconSizes[size]} text-brand-cyan`} strokeWidth={2.2} />
          <Sparkles className="w-3.5 h-3.5 text-brand-400 absolute -top-1 -right-1 animate-float" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className={`font-display font-black tracking-tight ${textSizes[size]} flex items-center gap-1`}>
          <span className="text-white">Verify</span>
          <span className="text-gradient-brand">AI</span>
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 ml-1">
            CORE
          </span>
        </div>
        {showTagline && (
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            Neural Truth & Deepfake Verification Engine
          </span>
        )}
      </div>
    </div>
  );
};
