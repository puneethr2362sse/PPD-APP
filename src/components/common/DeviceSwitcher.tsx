import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Smartphone, 
  Monitor, 
  QrCode, 
  X, 
  ExternalLink, 
  Check, 
  Copy, 
  Wifi, 
  Sparkles,
  Layers
} from 'lucide-react';

interface DeviceSwitcherProps {
  currentMode: 'desktop' | 'mobile-sim';
  onToggleMode: (mode: 'desktop' | 'mobile-sim') => void;
}

export const DeviceSwitcher: React.FC<DeviceSwitcherProps> = ({
  currentMode,
  onToggleMode,
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Network IP detected for mobile phone testing on Wi-Fi
  const localNetworkUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:5173/`
    : window.location.href;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(localNetworkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Floating View Switcher Bar (Visible on desktop viewports) */}
      <aside aria-label="Device Preview Toolbar" className="hidden lg:flex fixed bottom-5 left-1/2 -translate-x-1/2 z-50 items-center gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] text-xs font-mono">
        {/* Label */}
        <div className="px-3 py-1 text-slate-400 font-bold flex items-center gap-1.5 border-r border-slate-800">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>VIEW MODE:</span>
        </div>

        {/* Desktop Web Button */}
        <button
          type="button"
          onClick={() => onToggleMode('desktop')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            currentMode === 'desktop'
              ? 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-glow-cyan'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Desktop Web</span>
        </button>

        {/* Mobile App Simulator Button */}
        <button
          type="button"
          onClick={() => onToggleMode('mobile-sim')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            currentMode === 'mobile-sim'
              ? 'bg-gradient-to-r from-cyan-500 to-brand-500 text-slate-950 shadow-glow-cyan'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile App Preview</span>
        </button>

        {/* Test on Actual Phone via QR Code Button */}
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors ml-1"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Open on Real Phone</span>
        </button>
      </aside>

      {/* QR Code Modal for testing on physical phone */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 sm:p-8 border border-cyan-500/40 shadow-2xl relative space-y-6">
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-glow-cyan">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">
                Test VerifyAI on Your Phone
              </h3>
              <p className="text-xs text-slate-300">
                Scan this QR code with your mobile camera (iPhone or Android) on the same Wi-Fi network.
              </p>
            </div>

            {/* QR Code Canvas */}
            <div className="flex justify-center p-4 rounded-2xl bg-white/95 border border-slate-700 max-w-[220px] mx-auto shadow-xl">
              <QRCodeSVG
                value={localNetworkUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Network URL with Copy Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Local Wi-Fi Network URL:</span>
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300">
                <span className="flex-1 truncate">{localNetworkUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Tip */}
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Full native gesture support, camera file uploads, and 4-digit OTP enabled.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
