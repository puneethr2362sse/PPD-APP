import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { newsService, NewsCategory } from '../services/newsService';
import { NewsCard } from '../components/common/NewsCard';
import { NewsItem } from '../types';
import { 
  FileText, 
  Image as ImageIcon, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Activity,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { stats } = useHistory();

  // Dynamic news feed state
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string>('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [staleNotice, setStaleNotice] = useState<string>('');
  const [refreshFeedback, setRefreshFeedback] = useState<{ message: string; isUpToDate: boolean } | null>(null);

  // Fetch supported categories on mount
  useEffect(() => {
    newsService.getCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });
  }, []);

  // Fetch news articles when category changes or on refresh
  const fetchNews = useCallback(async (cat: string, isManualRefresh: boolean = false) => {
    setIsLoadingNews(true);
    setNewsError('');
    try {
      const res = await newsService.getLiveNews(cat, isManualRefresh);
      if (res.success && res.news.length > 0) {
        setNewsList(res.news);
        const timeStr = res.refreshedAt
          ? new Date(res.refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastRefreshedAt(timeStr);
        if (res.stale) {
          setStaleNotice(res.error || 'Live update delayed; showing cached news.');
        } else {
          setStaleNotice('');
        }

        if (isManualRefresh) {
          const feedbackText = res.statusMessage || (res.isUpToDate
            ? 'Feed is up to date — checked against live news feeds.'
            : `${res.newArticlesCount || res.news.length} articles verified.`);
          setRefreshFeedback({
            message: feedbackText,
            isUpToDate: Boolean(res.isUpToDate),
          });
          setTimeout(() => setRefreshFeedback(null), 5000);
        }
      } else if (res.success && res.news.length === 0) {
        setNewsList([]);
        setStaleNotice('');
      } else {
        // If error occurred but we already have news items, keep showing them and display notice
        setNewsList(prev => {
          if (prev.length > 0) {
            setStaleNotice(res.error || 'Could not reach live news servers. Displaying previous stories.');
            return prev;
          }
          setNewsError(res.error || 'Unable to load live articles for this category.');
          return [];
        });
      }
    } catch (err: any) {
      setNewsList(prev => {
        if (prev.length > 0) {
          setStaleNotice(err.message || 'Could not connect to live feed. Showing previous stories.');
          return prev;
        }
        setNewsError(err.message || 'Error connecting to live news feed.');
        return [];
      });
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(selectedCategory, false);
  }, [selectedCategory, fetchNews]);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
  };

  const handleRefresh = () => {
    if (isLoadingNews) return;
    fetchNews(selectedCategory, true);
  };

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
              Welcome back, <span className="text-gradient-brand">{currentUser?.name || 'Puneeth'}</span> <span className="text-cyan-400 font-mono text-xl sm:text-2xl font-normal">(@{currentUser?.userId || 'investigator'})</span>
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
                Upload photos, memes, news screenshots, or AI-generated portraits to run multimodal visual inspection, digital manipulation screening, metadata provenance, and multilingual OCR claim cross-referencing.
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

      {/* Current / Trending News Section (Real Dynamic Live Feed) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Current & Trending News Feed
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Real-time published news across India, Telugu, and World feeds ready for forensic verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastRefreshedAt && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
                Updated {lastRefreshedAt}
              </span>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoadingNews}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live news feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNews ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>{isLoadingNews ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <Link
              to="/scan/text"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 ml-2"
            >
              <span>Scan custom text</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Real-time Refresh Status Feedback */}
        {refreshFeedback && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 font-mono animate-in fade-in transition-all ${
            refreshFeedback.isUpToDate
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>{refreshFeedback.message}</span>
          </div>
        )}

        {/* Non-blocking Stale Notice if refresh experienced upstream delays */}
        {staleNotice && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between gap-3 font-mono">
            <span>{staleNotice}</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="underline text-amber-200 hover:text-white cursor-pointer font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {(categories.length > 0 ? categories : [
            { id: 'all', label: 'All / Trending' },
            { id: 'india', label: 'India' },
            { id: 'telugu', label: 'Telugu News (తెలుగు)' },
            { id: 'world', label: 'World' },
            { id: 'politics', label: 'Politics' },
            { id: 'business', label: 'Business' },
            { id: 'technology', label: 'Science & Tech' },
            { id: 'entertainment', label: 'Entertainment' },
            { id: 'sports', label: 'Sports' },
            { id: 'health', label: 'Health' },
          ]).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-glow-cyan'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 animate-pulse">
                <div className="h-40 bg-slate-800/60 rounded-xl" />
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-slate-800 rounded-full" />
                  <div className="h-4 w-16 bg-slate-800 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-slate-800 rounded-lg" />
                <div className="h-12 w-full bg-slate-800/60 rounded-lg" />
              </div>
            ))}
          </div>
        ) : newsError ? (
          /* Error State with Retry */
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-white">Live News Feed Unavailable</p>
                <p className="text-rose-300/90">{newsError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchNews(selectedCategory)}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-mono text-white transition-colors cursor-pointer shrink-0"
            >
              Retry Live Feed
            </button>
          </div>
        ) : newsList.length === 0 ? (
          /* Empty State */
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <p className="text-sm font-semibold text-white">No published articles found for this category.</p>
            <p className="text-xs text-slate-400">Please choose another category or refresh.</p>
          </div>
        ) : (
          /* Live Articles Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {newsList.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
