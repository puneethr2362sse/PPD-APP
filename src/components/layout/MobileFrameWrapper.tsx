import React from 'react';
import { useViewMode } from '../../context/ViewModeContext';
import { Wifi, Battery, Signal, Sparkles } from 'lucide-react';

export const MobileFrameWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode } = useViewMode();

  if (mode === 'desktop') {
    return <>{children}</>;
  }

  // Mobile App Simulator Mode for desktop viewports
  return (
    <div className="hidden lg:flex min-h-screen bg-[#06080e] items-center justify-center p-6 pb-20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Banner Info */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-300 shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Mobile App Mode Active (390px × 844px Native Viewport)</span>
      </div>

      {/* Simulated Mobile Device Frame */}
      <div className="relative w-[390px] h-[844px] bg-[#090D16] rounded-[50px] border-[10px] border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ring-1 ring-white/10">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-50 flex items-center justify-center border border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 ml-12" />
        </div>

        {/* Mobile Status Bar */}
        <div className="h-10 pt-2 px-6 flex items-center justify-between text-[11px] font-mono text-slate-300 shrink-0 select-none z-40 bg-[#090D16]/90 backdrop-blur-md">
          <span className="font-bold">9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-300" />
            <Battery className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* Mobile App Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          {children}
        </div>

        {/* Mobile Home Indicator Bar */}
        <div className="h-4 bg-[#090D16] flex items-center justify-center shrink-0 pb-1">
          <div className="w-32 h-1 rounded-full bg-slate-600" />
        </div>
      </div>
    </div>
  );
};
