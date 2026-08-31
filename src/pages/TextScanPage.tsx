import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { useToast } from '../context/ToastContext';
import { verificationService } from '../services/verificationService';
import { ScanLaserOverlay } from '../components/verification/ScanLaserOverlay';
import { SampleNewsPills } from '../components/verification/SampleNewsPills';
import { 
  FileText, 
  Sparkles, 
  Trash2, 
  ClipboardPaste, 
  Send, 
  ShieldCheck, 
  Info,
  ArrowLeft
} from 'lucide-react';

export const TextScanPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addScan } = useHistory();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Check if text was pre-filled from Home / NewsCard
  useEffect(() => {
    const prefilled = (location.state as any)?.prefilledText;
    if (prefilled) {
      setInputText(prefilled);
    }
  }, [location.state]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        showToast('Text pasted from clipboard!', 'info');
      }
    } catch {
      showToast('Please paste manually using Ctrl+V or right-click.', 'warning');
    }
  };

  const handleClear = () => {
    setInputText('');
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const clean = inputText.trim();
    if (!clean) {
      showToast('Please enter or paste some text to verify.', 'error');
      return;
    }

    if (!currentUser?.email) {
      showToast('Authentication error. Please login again.', 'error');
      return;
    }

    setIsScanning(true);

    try {
      const result = await verificationService.verifyText(clean, currentUser.email);
      // Auto-save to user history immediately
      addScan(result);
      setIsScanning(false);
      
      // Navigate to detailed result page
      navigate(`/result`, { state: { result } });
    } catch (err: any) {
      setIsScanning(false);
      showToast(err.message || 'Live verification is currently unavailable. Please try again.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-400" />
              <span>Text & News Verification</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Cross-reference articles, headlines, or claims against verified truth databases.
            </p>
          </div>
        </div>
      </div>

      {isScanning ? (
        <ScanLaserOverlay
          type="TEXT"
          label="Parsing semantic veracity, syntax tone, and multi-source credibility..."
        />
      ) : (
        <div className="space-y-6">
          {/* Main Input Card */}
          <div className="glass-card rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-4">
            {/* Action Bar above Textarea */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Input Claim or Article Content</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Paste</span>
                </button>
                {inputText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste any news article, viral WhatsApp message, Twitter/X post, or political statement here..."
                rows={6}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-y leading-relaxed font-sans"
              />
              <div className="absolute bottom-3 right-3 text-[11px] font-mono text-slate-500 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
                {inputText.length} chars
              </div>
            </div>

            {/* Submit CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Real-time search & Gemini grounding evaluates evidence into TRUE, FALSE, or UNVERIFIED.</span>
              </div>

              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={!inputText.trim()}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  inputText.trim()
                    ? 'bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-500 text-white shadow-glow-cyan hover:shadow-glow-brand hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Run Fact-Check Scan</span>
              </button>
            </div>
          </div>

          {/* Quick Test Demo Samples */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800">
            <SampleNewsPills onSelectSample={(sample) => setInputText(sample)} />
          </div>
        </div>
      )}
    </div>
  );
};
