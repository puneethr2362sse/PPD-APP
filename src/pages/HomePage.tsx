import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { newsService } from '../services/newsService';
import { NewsCard } from '../components/common/NewsCard';
import { 
  FileText, 
  Image as ImageIcon, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  History, 
  TrendingUp, 
  Zap,
  Activity,
  CheckCircle2
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { history, stats } = useHistory();
  const navigate = useNavigate();
  const trendingNews = newsService.getTrendingNews();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 shadow-2xl backdrop-blur-2xl">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 via-brand-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>VerifyAI Forensics Engine v2.4 Active</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome back, <span className="text-gradient-brand">{currentUser?.name || 'Puneeth'}</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
              Instantly analyze news articles, viral social claims, screenshots, and photos with real-time neural fact-checking and deepfake anomaly detection.
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-2 max-w-lg">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono">Your Scans</div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">
                  {stats.totalScans}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-emerald-500/20">
                <div className="text-xs text-emerald-400 font-mono">Real Verified</div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-300 mt-0.5">
                  {stats.realCount}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-rose-500/20">
                <div className="text-xs text-rose-400 font-mono">Fakes Flagged</div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-rose-300 mt-0.5">
                  {stats.fakeCount}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Start Action on Hero */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="glass-card p-5 rounded-2xl border border-cyan-500/20 shadow-glow-cyan">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider mb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Quick Fact-Check</span>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Got a suspicious headline or message? Paste it for instant 0/100 or 100/100 scoring.
              </p>
              <Link
                to="/scan/text"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Open Text Scanner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two Verification Workspaces (Desktop: 2 columns, Mobile: stacked) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Choose Verification Workspace
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select what type of content you want to investigate.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Text Verification */}
          <Link
            to="/scan/text"
            className="group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-glow-cyan hover:-translate-y-1 flex flex-col justify-between min-h-[220px]"
          >
            {/* Corner ambient glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-5 shadow-glow-cyan group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Text & Article Verification
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Paste breaking news, viral WhatsApp messages, political quotes, or social media posts to cross-reference global registries and check claim authenticity.
              </p>
            </div>

            <div className="relative z-10 pt-6 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                Supports Paste, URLs & Text
              </span>
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Card 2: Image Verification */}
          <Link
            to="/scan/image"
            className="group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 hover:border-brand-500/40 transition-all duration-300 hover:shadow-glow-brand hover:-translate-y-1 flex flex-col justify-between min-h-[220px]"
          >
            {/* Corner ambient glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-950/80 border border-brand-500/40 text-brand-400 flex items-center justify-center mb-5 shadow-glow-brand group-hover:scale-110 transition-transform">
                <ImageIcon className="w-7 h-7" />
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-brand-300 transition-colors">
                Image & Deepfake Forensics
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Upload photos, memes, news screenshots, or AI-generated portraits to run Error Level Analysis (ELA), synthetic noise detection, and EXIF integrity audits.
              </p>
            </div>

            <div className="relative z-10 pt-6 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-xs font-mono text-brand-400 font-semibold">
                JPG, PNG, WEBP & Gallery Upload
              </span>
              <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Current / Trending News Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Current & Trending News Verification
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Live fact-checking feed of viral stories and breaking claims.
              </p>
            </div>
          </div>

          <Link
            to="/scan/text"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300"
          >
            <span>Scan custom news</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {trendingNews.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      </section>
    </div>
  );
};
