import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { VerificationResult } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  ArrowLeft, 
  History, 
  RotateCcw, 
  Share2, 
  Check, 
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  ImageIcon,
  FileText,
  Calendar,
  Sparkles,
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
          Please run a text or image scan to view verification results.
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

  // Resolve standard verdict label
  const verdict = result.verdict;
  const verdictLabel = result.verdictLabel || (
    verdict === 'TRUE' || verdict === 'REAL' ? 'TRUE / SUPPORTED' :
    verdict === 'FALSE' || verdict === 'FAKE' ? 'FALSE / CONTRADICTED' :
    verdict === 'PARTLY_TRUE' ? 'PARTLY TRUE' :
    verdict === 'MISLEADING' ? 'MISLEADING / OUT OF CONTEXT' :
    'UNVERIFIED / INSUFFICIENT EVIDENCE'
  );

  // Verdict theme styling
  const isTrue = verdict === 'TRUE' || verdict === 'REAL';
  const isFalse = verdict === 'FALSE' || verdict === 'FAKE';
  const isPartlyTrue = verdict === 'PARTLY_TRUE';
  const isMisleading = verdict === 'MISLEADING';

  const verdictStyles = isTrue
    ? {
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-950/20',
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        icon: <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />,
        shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      }
    : isFalse
    ? {
        border: 'border-rose-500/40',
        bg: 'bg-rose-950/20',
        badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        icon: <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />,
        shadow: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]',
      }
    : isPartlyTrue
    ? {
        border: 'border-amber-500/40',
        bg: 'bg-amber-950/20',
        badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        icon: <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />,
        shadow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
      }
    : isMisleading
    ? {
        border: 'border-orange-500/40',
        bg: 'bg-orange-950/20',
        badgeBg: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
        icon: <AlertTriangle className="w-6 h-6 text-orange-400 shrink-0" />,
        shadow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]',
      }
    : {
        border: 'border-slate-700',
        bg: 'bg-slate-900/60',
        badgeBg: 'bg-slate-800 border-slate-700 text-slate-300',
        icon: <HelpCircle className="w-6 h-6 text-slate-400 shrink-0" />,
        shadow: 'shadow-none',
      };

  // Image Authenticity status (strictly separated from claim truth)
  const imageAuthenticityLabel = result.imageAuthenticityLabel || (
    result.type === 'IMAGE' ? 'IMAGE AUTHENTICITY: NOT VERIFIED' : undefined
  );

  // Claim text to display once
  const claimText = result.originalClaim || result.claim || result.fullContent || result.preview;

  // Filter sources to maximum 3
  const evidenceSources = (result.sources || []).slice(0, 3);

  const handleCopyReport = () => {
    const reportText = `[VerifyAI Verification Report]
VERDICT: ${verdictLabel}
${imageAuthenticityLabel ? `${imageAuthenticityLabel}\n` : ''}
Claim: ${claimText}
Explanation: ${result.explanation}
${evidenceSources.length > 0 ? `\nEvidence:\n${evidenceSources.map(s => `- ${s.name}: ${s.url}`).join('\n')}` : ''}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    showToast('Verification report copied!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Top navigation actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
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

      {/* Main Verification Card */}
      <div className={`glass-card rounded-3xl p-6 sm:p-8 border ${verdictStyles.border} ${verdictStyles.bg} ${verdictStyles.shadow} space-y-6`}>
        {/* Header: Verified Claim preview */}
        <div className="space-y-2 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            {result.type === 'IMAGE' ? (
              <ImageIcon className="w-4 h-4 text-cyan-400" />
            ) : (
              <FileText className="w-4 h-4 text-cyan-400" />
            )}
            <span>Claim Verified</span>
          </div>
          <p className="text-base sm:text-lg font-semibold text-white leading-snug">
            "{claimText}"
          </p>
        </div>

        {/* Prominent VERDICT */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border font-mono font-bold text-sm sm:text-base tracking-wide ${verdictStyles.badgeBg}`}>
              {verdictStyles.icon}
              <span>VERDICT: {verdictLabel}</span>
            </div>

            {/* Decoupled Image Authenticity Badge */}
            {result.type === 'IMAGE' && imageAuthenticityLabel && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 font-mono text-xs">
                <span>{imageAuthenticityLabel}</span>
              </div>
            )}
          </div>

          {/* Explanation — 1 or 2 clear sentences directly beneath verdict */}
          <div className="pt-2">
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
              <strong className="text-white font-semibold">Explanation: </strong>
              {result.explanation}
            </p>
          </div>
        </div>

        {/* Timeline context if dates are relevant */}
        {result.timeline && (result.timeline.eventDate || result.timeline.publicationDate) && (
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {result.timeline.eventDate && (
              <span>Event Date: <strong className="text-slate-200">{result.timeline.eventDate}</strong></span>
            )}
            {result.timeline.publicationDate && (
              <span>• Reported: <strong className="text-slate-200">{result.timeline.publicationDate}</strong></span>
            )}
          </div>
        )}

        {/* Evidence Section: Up to 3 clickable sources */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Evidence:
          </div>

          {evidenceSources.length > 0 ? (
            <ul className="space-y-2.5">
              {evidenceSources.map((source, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="text-cyan-400 font-mono text-xs mt-0.5">•</span>
                  <div className="flex-1">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-300 hover:text-cyan-200 hover:underline font-medium inline-flex items-center gap-1.5 group"
                      >
                        <span>{source.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-200 font-medium">{source.name}</span>
                    )}
                    {source.snippet && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {source.snippet}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No direct external sources were retrieved for this claim.
            </p>
          )}
        </div>

        {/* Media Preview (Thumbnail for uploaded image) */}
        {result.type === 'IMAGE' && result.imageUrl && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Uploaded Image:</span>
            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-64 flex items-center justify-center">
              <img
                src={result.imageUrl}
                alt="Inspected upload"
                className="max-h-64 object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          to={result.type === 'IMAGE' ? '/scan/image' : '/scan/text'}
          className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Verify Another Claim</span>
        </Link>

        <Link
          to="/history"
          className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-cyan transition-all cursor-pointer"
        >
          <History className="w-4 h-4" />
          <span>View Scan History</span>
        </Link>
      </div>
    </div>
  );
};
