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
  CheckCircle2,
  Sparkles
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

  const isTrue = result.verdict === 'TRUE' || result.verdict === 'REAL';
  const isFalse = result.verdict === 'FALSE' || result.verdict === 'FAKE';
  const isUnverified = result.verdict === 'UNVERIFIED';

  const handleCopyReport = () => {
    const reportText = `[VerifyAI Real-Time Verification Report]
Type: ${result.type}
Verdict: ${result.verdictLabel || result.verdict} (${result.score}/100)
Scanned: ${result.formattedDate}
${result.directAnswer ? `Direct Answer: ${result.directAnswer}\n` : ''}Preview: ${result.preview}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {result.isLiveWebVerified && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Live Web Verified</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
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

          {/* Direct Answer Card for Questions */}
          {result.directAnswer && (
            <div className="glass-card rounded-3xl p-5 border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.15)] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Direct Answer</span>
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {result.directAnswer}
              </p>
            </div>
          )}

          {/* Explanation Box */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              {isTrue ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : isFalse ? (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              )}
              <span>Live Evidence & Fact-Check Verdict</span>
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
                Evidence Confidence: {result.confidence}%
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
              <span>Inspected Claim Payload</span>
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
                {result.originalClaim || result.fullContent || result.claim || result.preview}
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

          {/* Real-Time Corroborating / Evidentiary Sources */}
          {result.sources && result.sources.length > 0 && (
            <div className={`glass-card rounded-3xl p-6 border space-y-3 ${
              isTrue ? 'border-emerald-500/30 bg-emerald-950/10' : isFalse ? 'border-rose-500/30 bg-rose-950/10' : 'border-amber-500/30 bg-amber-950/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-300">
                  <CheckCircle2 className={`w-4 h-4 ${isTrue ? 'text-emerald-400' : isFalse ? 'text-rose-400' : 'text-amber-400'}`} />
                  <span>Verified News & Reference Sources ({result.sources.length})</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">Live Search Grounded</span>
              </div>

              <div className="space-y-2.5">
                {result.sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition-colors group"
                        >
                          <span className="group-hover:underline">{src.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-slate-200">{src.name}</span>
                      )}

                      {src.reliability ? (
                        <span className={`text-[11px] font-mono font-bold ${
                          src.reliability >= 90 ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {src.reliability}% Reliability
                        </span>
                      ) : null}
                    </div>

                    {src.snippet && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {src.snippet}
                      </p>
                    )}
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
