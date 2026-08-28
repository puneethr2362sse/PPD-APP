import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { VerificationResult } from '../types';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { ForensicSignals } from '../components/verification/ForensicSignals';
import { useToast } from '../context/ToastContext';
import { 
  ArrowLeft, 
  History, 
  RotateCcw, 
  Share2, 
  Check, 
  FileText, 
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export const ResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const result: VerificationResult = (location.state as any)?.result;

  if (!result) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <History className="w-7 h-7" />
        </div>
        <h2 className="font-display text-xl font-bold text-white">No Active Result Found</h2>
        <p className="text-xs text-slate-400">
          Please run a text or image scan to view verification forensics.
        </p>
        <Link
          to="/home"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-bold text-xs"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isReal = result.score === 100 && result.verdict === 'REAL';

  const handleCopyReport = () => {
    const reportText = `[VerifyAI Verification Report]
Type: ${result.type}
Verdict: ${result.verdict} (${result.score}/100)
Scanned: ${result.formattedDate}
Preview: ${result.preview}
Explanation: ${result.explanation}
Confidence: ${result.confidence}%`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    showToast('Verification report copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top navigation actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Copied!' : 'Share Report'}</span>
          </button>

          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            <History className="w-4 h-4 text-brand-400" />
            <span>History</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Column Score & Content, Right Column Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Hero Score & Inspected Media) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Prominent Hero Score Card */}
          <ScoreBadge
            score={result.score}
            verdict={result.verdict}
            size="lg"
            animated={true}
          />

          {/* Explanation Box */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              {isReal ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span>Forensic Reasoning & Verdict</span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              {result.explanation}
            </p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {result.formattedDate}
              </span>
              <span className="text-cyan-400 font-semibold">
                AI Confidence: {result.confidence}%
              </span>
            </div>
          </div>

          {/* Scanned Input Preview */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              {result.type === 'IMAGE' ? (
                <ImageIcon className="w-4 h-4 text-brand-400" />
              ) : (
                <FileText className="w-4 h-4 text-cyan-400" />
              )}
              <span>Analyzed {result.type} Payload</span>
            </div>

            {result.type === 'IMAGE' && result.imageUrl ? (
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={result.imageUrl}
                  alt={result.preview}
                  className="w-full max-h-[280px] object-contain"
                />
                <div className="p-2.5 bg-slate-900/90 text-xs font-mono text-slate-400 text-center truncate">
                  {result.preview}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans max-h-48 overflow-y-auto">
                {result.fullContent || result.preview}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Forensic Signal Meters & Corroborated Sources) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-white">
                Multi-Layer Neural Forensics
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                {result.signals.length} checks performed
              </span>
            </div>

            <ForensicSignals signals={result.signals} />
          </div>

          {/* Corroborating Sources (if Real) */}
          {result.sources && result.sources.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Corroborated Primary Sources</span>
              </div>

              <div className="space-y-2">
                {result.sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-slate-200">{src.name}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {src.reliability}% Reliability
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              to={result.type === 'IMAGE' ? '/scan/image' : '/scan/text'}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Scan Another {result.type}</span>
            </Link>

            <Link
              to="/history"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-cyan transition-all"
            >
              <History className="w-4 h-4" />
              <span>View in Scan History</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
