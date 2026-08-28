import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Cpu, Search } from 'lucide-react';

interface ScanLaserOverlayProps {
  label?: string;
  type?: 'TEXT' | 'IMAGE';
}

export const ScanLaserOverlay: React.FC<ScanLaserOverlayProps> = ({
  label = 'Analyzing semantic tokens & cross-referencing registries...',
  type = 'TEXT',
}) => {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950/90 border border-cyan-500/40 p-8 sm:p-12 flex flex-col items-center justify-center min-h-[280px] shadow-glow-cyan backdrop-blur-xl">
      {/* Grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40f_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40f_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Sweeping Laser beam */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06b6d4] z-10"
        initial={{ top: '5%' }}
        animate={{ top: ['5%', '92%', '5%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Pulsing Core Scanner Icon */}
      <div className="relative z-20 flex flex-col items-center text-center">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shadow-glow-cyan">
            {type === 'IMAGE' ? (
              <Search className="w-8 h-8 text-cyan-400 animate-pulse" />
            ) : (
              <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
            )}
          </div>
          <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-spin" />
        </div>

        <div className="font-display font-bold text-lg sm:text-xl text-white mb-2 tracking-tight">
          VerifyAI Neural Forensics Active
        </div>

        <p className="text-xs sm:text-sm text-cyan-300/80 font-mono max-w-sm">
          {label}
        </p>

        {/* Animated steps */}
        <div className="mt-5 flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Cross-checking 14+ fact registries & linguistic models...</span>
        </div>
      </div>
    </div>
  );
};
