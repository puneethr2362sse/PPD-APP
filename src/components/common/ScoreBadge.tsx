import React from 'react';
import { ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';
import { VerificationVerdict } from '../../types';

interface ScoreBadgeProps {
  score: 0 | 100 | number;
  verdict: VerificationVerdict;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  verdict,
  size = 'md',
  animated = false,
}) => {
  const isReal = verdict === 'REAL' || score >= 50;

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border shadow-sm ${
          isReal
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            : 'bg-rose-950/60 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
        }`}
      >
        {isReal ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
            <span>100/100 REAL</span>
          </>
        ) : (
          <>
            <X className="w-3.5 h-3.5 text-rose-400" strokeWidth={3} />
            <span>0/100 FAKE</span>
          </>
        )}
      </span>
    );
  }

  if (size === 'md') {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${
          isReal
            ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200 shadow-glow-real'
            : 'bg-rose-950/50 border-rose-500/30 text-rose-200 shadow-glow-fake'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isReal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          {isReal ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        </div>
        <div>
          <div className="font-mono text-lg font-extrabold tracking-tight">
            {isReal ? '100/100' : '0/100'}
          </div>
          <div
            className={`text-xs font-bold uppercase tracking-wider ${
              isReal ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isReal ? 'VERIFIED REAL' : 'DETECTED FAKE'}
          </div>
        </div>
      </div>
    );
  }

  // Large Hero badge for Result Page
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border backdrop-blur-2xl text-center transition-all ${
        isReal
          ? 'bg-gradient-to-b from-emerald-950/70 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-glow-real'
          : 'bg-gradient-to-b from-rose-950/70 via-slate-900/90 to-slate-950 border-rose-500/40 shadow-glow-fake'
      }`}
    >
      {/* Background ambient glow */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isReal ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border ${
            isReal
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
              : 'bg-rose-500/20 border-rose-400/40 text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
          } ${animated ? 'animate-bounce' : ''}`}
        >
          {isReal ? (
            <ShieldCheck className="w-10 h-10 text-emerald-400" strokeWidth={2.5} />
          ) : (
            <ShieldAlert className="w-10 h-10 text-rose-400" strokeWidth={2.5} />
          )}
        </div>

        <div className="font-mono text-5xl sm:text-6xl font-black tracking-tight mb-2">
          {isReal ? (
            <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]">100/100</span>
          ) : (
            <span className="text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">0/100</span>
          )}
        </div>

        <div
          className={`font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wider mb-2 ${
            isReal ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {isReal ? 'REAL CONTENT' : 'FAKE CONTENT'}
        </div>

        <div className="text-xs sm:text-sm text-slate-300 max-w-md font-medium">
          {isReal
            ? 'Neural analysis verified claim authenticity across corroborated sources.'
            : 'Forensic classifiers flagged critical disinformation and fabrication anomalies.'}
        </div>
      </div>
    </div>
  );
};
