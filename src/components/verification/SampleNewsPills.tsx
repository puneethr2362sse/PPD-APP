import React from 'react';
import { Sparkles, ShieldCheck, ShieldAlert } from 'lucide-react';

interface SampleNewsPillsProps {
  onSelectSample: (text: string) => void;
}

export const SAMPLE_CLAIMS = [
  {
    type: 'FAKE',
    label: 'Fake Hoax Claim',
    text: 'BREAKING: Secret cure discovered that completely eliminates all cancer and diabetes in 48 hours without medicine, but government is hiding it from public. Share before it gets deleted!',
  },
  {
    type: 'REAL',
    label: 'Verified Scientific News',
    text: 'NASA announced that spectroscopic observations from the James Webb Space Telescope have detected methane and carbon dioxide in the atmosphere of habitable-zone exoplanet K2-18 b.',
  },
  {
    type: 'FAKE',
    label: 'Conspiracy Viral Claim',
    text: 'URGENT WARNING: 5G mobile towers are secretly emitting microchip frequencies to control human behavior and an asteroid will hit Earth tomorrow!',
  },
  {
    type: 'REAL',
    label: 'Verified Tech Report',
    text: 'Researchers at MIT published peer-reviewed findings in Nature demonstrating a new solid-state battery capable of 1,000 charging cycles with zero dendrite degradation.',
  },
];

export const SampleNewsPills: React.FC<SampleNewsPillsProps> = ({ onSelectSample }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
        <span>Quick Test Demo Samples (Click to load):</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SAMPLE_CLAIMS.map((sample, idx) => {
          const isReal = sample.type === 'REAL';
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSample(sample.text)}
              className="text-left p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-600 transition-all flex items-start gap-2.5 group"
            >
              <div
                className={`mt-0.5 p-1 rounded-md shrink-0 ${
                  isReal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isReal ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span
                    className={`text-[11px] font-mono font-bold uppercase ${
                      isReal ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {sample.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono group-hover:text-cyan-400 transition-colors">
                    Load ↗
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-1 leading-snug">
                  {sample.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
