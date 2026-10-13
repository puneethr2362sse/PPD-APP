import React from 'react';
import { ShieldCheck, ShieldAlert, AlertCircle, Check, X, HelpCircle } from 'lucide-react';
import { VerificationVerdict } from '../../types';

interface ScoreBadgeProps {
  score: number;
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
  const isTrue = verdict === 'TRUE' || verdict === 'REAL';
  const isFalse = verdict === 'FALSE' || verdict === 'FAKE';
  const isPartlyTrue = verdict === 'PARTLY_TRUE';
  const isMisleading = verdict === 'MISLEADING';

  const label = isTrue
    ? 'TRUE / SUPPORTED'
    : isFalse
    ? 'FALSE / CONTRADICTED'
    : isPartlyTrue
    ? 'PARTLY TRUE'
    : isMisleading
    ? 'MISLEADING / OUT OF CONTEXT'
    : 'UNVERIFIED / INSUFFICIENT EVIDENCE';

  const colorClass = isTrue
    ? 'emerald'
    : isFalse
    ? 'rose'
    : isPartlyTrue
    ? 'amber'
    : isMisleading
    ? 'orange'
    : 'slate';

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border shadow-sm ${
          isTrue
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            : isFalse
            ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
            : isPartlyTrue
            ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
            : isMisleading
            ? 'bg-orange-950/60 border-orange-500/40 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
            : 'bg-slate-900 border-slate-700 text-slate-300'
        }`}
      >
        {isTrue ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
            <span>{score}/100 TRUE</span>
          </>
        ) : isFalse ? (
          <>
            <X className="w-3.5 h-3.5 text-rose-400" strokeWidth={3} />
            <span>{score}/100 FALSE</span>
          </>
        ) : isPartlyTrue ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" strokeWidth={3} />
            <span>{score}/100 PARTLY TRUE</span>
          </>
        ) : isMisleading ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-orange-400" strokeWidth={3} />
            <span>{score}/100 MISLEADING</span>
          </>
        ) : (
          <>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" strokeWidth={3} />
            <span>{score}/100 UNVERIFIED</span>
          </>
        )}
      </span>
    );
  }

  if (size === 'md') {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${
          isTrue
            ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200 shadow-glow-real'
            : isFalse
            ? 'bg-rose-950/50 border-rose-500/30 text-rose-200 shadow-glow-fake'
            : isPartlyTrue
            ? 'bg-amber-950/50 border-amber-500/30 text-amber-200'
            : isMisleading
            ? 'bg-orange-950/50 border-orange-500/30 text-orange-200'
            : 'bg-slate-900 border-slate-700 text-slate-200'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isTrue 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : isFalse 
              ? 'bg-rose-500/20 text-rose-400' 
              : isPartlyTrue
              ? 'bg-amber-500/20 text-amber-400'
              : isMisleading
              ? 'bg-orange-500/20 text-orange-400'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isTrue ? (
            <ShieldCheck className="w-5 h-5" />
          ) : isFalse ? (
            <ShieldAlert className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>
        <div>
          <div className="font-mono text-lg font-extrabold tracking-tight">
            {score}/100
          </div>
          <div
            className={`text-xs font-bold uppercase tracking-wider ${
              isTrue ? 'text-emerald-400' : isFalse ? 'text-rose-400' : isPartlyTrue ? 'text-amber-400' : isMisleading ? 'text-orange-400' : 'text-slate-400'
            }`}
          >
            {label}
          </div>
        </div>
      </div>
    );
  }

  // Large Hero badge for Result Page
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border backdrop-blur-2xl text-center transition-all ${
        isTrue
          ? 'bg-gradient-to-b from-emerald-950/70 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-glow-real'
          : isFalse
          ? 'bg-gradient-to-b from-rose-950/70 via-slate-900/90 to-slate-950 border-rose-500/40 shadow-glow-fake'
          : isPartlyTrue
          ? 'bg-gradient-to-b from-amber-950/70 via-slate-900/90 to-slate-950 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
          : isMisleading
          ? 'bg-gradient-to-b from-orange-950/70 via-slate-900/90 to-slate-950 border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.25)]'
          : 'bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-950 border-slate-700 shadow-[0_0_30px_rgba(100,116,139,0.2)]'
      }`}
    >
      {/* Background ambient glow */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isTrue ? 'bg-emerald-500' : isFalse ? 'bg-rose-500' : isPartlyTrue ? 'bg-amber-500' : isMisleading ? 'bg-orange-500' : 'bg-slate-600'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border ${
            isTrue
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
              : isFalse
              ? 'bg-rose-500/20 border-rose-400/40 text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
              : isPartlyTrue
              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
              : isMisleading
              ? 'bg-orange-500/20 border-orange-400/40 text-orange-300 shadow-[0_0_30px_rgba(249,115,22,0.4)]'
              : 'bg-slate-800 border-slate-600 text-slate-300 shadow-[0_0_30px_rgba(100,116,139,0.4)]'
          } ${animated ? 'animate-bounce' : ''}`}
        >
          {isTrue ? (
            <ShieldCheck className="w-10 h-10 text-emerald-400" strokeWidth={2.5} />
          ) : isFalse ? (
            <ShieldAlert className="w-10 h-10 text-rose-400" strokeWidth={2.5} />
          ) : isPartlyTrue || isMisleading ? (
            <AlertCircle className={`w-10 h-10 ${isPartlyTrue ? 'text-amber-400' : 'text-orange-400'}`} strokeWidth={2.5} />
          ) : (
            <HelpCircle className="w-10 h-10 text-slate-400" strokeWidth={2.5} />
          )}
        </div>

        <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-slate-400 mb-1">
          VERDICT
        </div>

        <div
          className={`font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wider mb-2 ${
            isTrue ? 'text-emerald-300' : isFalse ? 'text-rose-300' : isPartlyTrue ? 'text-amber-300' : isMisleading ? 'text-orange-300' : 'text-slate-300'
          }`}
        >
          {label}
        </div>
      </div>
    </div>
  );
};
