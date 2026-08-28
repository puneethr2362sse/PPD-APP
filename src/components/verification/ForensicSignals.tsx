import React from 'react';
import { ForensicSignal } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ForensicSignalsProps {
  signals: ForensicSignal[];
}

export const ForensicSignals: React.FC<ForensicSignalsProps> = ({ signals }) => {
  return (
    <div className="space-y-3">
      {signals.map((sig, idx) => {
        const isPassed = sig.status === 'passed';
        const isFailed = sig.status === 'failed';

        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isFailed && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                {!isPassed && !isFailed && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                
                <span className="font-medium text-sm text-white">{sig.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    isPassed
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : isFailed
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {sig.status}
                </span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {sig.score}/100
                </span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isPassed
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : isFailed
                    ? 'bg-gradient-to-r from-rose-600 to-red-500'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${Math.max(5, sig.score)}%` }}
              />
            </div>

            {/* Detail explanation */}
            <p className="text-xs text-slate-400 leading-relaxed">
              {sig.detail}
            </p>
          </div>
        );
      })}
    </div>
  );
};
