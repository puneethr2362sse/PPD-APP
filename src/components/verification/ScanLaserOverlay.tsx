import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Cpu, Search, Globe, Brain, CheckCircle } from 'lucide-react';

interface ScanLaserOverlayProps {
  label?: string;
  type?: 'TEXT' | 'IMAGE';
}

const TEXT_STEPS = [
  { icon: Globe,   text: 'Performing live web search across multiple engines...' },
  { icon: Globe,   text: 'Fetching real-time evidence from top sources...' },
  { icon: Search,  text: 'Extracting article body content from web pages...' },
  { icon: Search,  text: 'Ranking sources by relevance and reliability...' },
  { icon: Brain,   text: 'Decomposing claim into factual components...' },
  { icon: Brain,   text: 'Comparing claim against retrieved live evidence...' },
  { icon: Shield,  text: 'Running contradiction and temporal consistency checks...' },
  { icon: CheckCircle, text: 'Generating evidence-grounded verdict...' },
];

const IMAGE_STEPS = [
  { icon: Search,  text: 'Scanning pixel-level forensic artifacts...' },
  { icon: Brain,   text: 'Running GAN & diffusion model fingerprint analysis...' },
  { icon: Shield,  text: 'Checking error-level analysis (ELA) consistency...' },
  { icon: CheckCircle, text: 'Generating forensic authenticity report...' },
];

export const ScanLaserOverlay: React.FC<ScanLaserOverlayProps> = ({
  label,
  type = 'TEXT',
}) => {
  const steps = type === 'IMAGE' ? IMAGE_STEPS : TEXT_STEPS;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex(prev => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [steps.length]);

  const CurrentIcon = steps[stepIndex].icon;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950/90 border border-cyan-500/40 p-8 sm:p-12 flex flex-col items-center justify-center min-h-[300px] shadow-glow-cyan backdrop-blur-xl">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40f_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40f_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Sweeping laser beam */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06b6d4] z-10"
        initial={{ top: '5%' }}
        animate={{ top: ['5%', '92%', '5%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Core content */}
      <div className="relative z-20 flex flex-col items-center text-center gap-4">
        {/* Animated icon */}
        <div className="relative mb-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.35 }}
              className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shadow-glow-cyan"
            >
              <CurrentIcon className="w-8 h-8 text-cyan-400" />
            </motion.div>
          </AnimatePresence>
          <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-spin" />
        </div>

        <div className="font-display font-bold text-lg sm:text-xl text-white tracking-tight">
          VerifyAI Live Verification
        </div>

        {/* Progress step text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="text-xs sm:text-sm text-cyan-300/90 font-mono max-w-xs leading-relaxed"
          >
            {label || steps[stepIndex].text}
          </motion.p>
        </AnimatePresence>

        {/* Step indicator dots */}
        <div className="flex items-center gap-1.5 mt-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? 'w-4 h-1.5 bg-cyan-400'
                  : 'w-1.5 h-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Live web search &amp; AI evidence comparison in progress…</span>
        </div>
      </div>
    </div>
  );
};
