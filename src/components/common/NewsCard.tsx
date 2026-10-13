import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsItem } from '../../types';
import { ArrowRight, Clock, Globe, ExternalLink, ShieldAlert } from 'lucide-react';

interface NewsCardProps {
  news: NewsItem;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleVerify = () => {
    const claimToVerify = news.claimText || (news.summary ? `${news.title}. ${news.summary}` : news.title);
    navigate('/scan/text', {
      state: {
        prefilledText: claimToVerify,
        sourceTitle: news.title,
        sourceUrl: news.link,
      },
    });
  };

  return (
    <div className="glass-card-interactive rounded-2xl p-5 flex flex-col justify-between border border-slate-800/80 hover:border-cyan-500/30 group transition-all duration-200">
      <div className="space-y-3">
        {/* Optional Article Thumbnail */}
        {news.imageUrl && !imageError && (
          <div className="relative w-full h-44 overflow-hidden rounded-xl bg-slate-950 border border-slate-800/60">
            <img
              src={news.imageUrl}
              alt={news.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Header: Category & Source */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
              {news.category}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>{news.source}</span>
            </span>
          </div>

          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono shrink-0">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{news.timeAgo}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
          {news.title}
        </h3>

        {/* Summary */}
        <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed font-normal">
          {news.summary}
        </p>
      </div>

      {/* Footer Info & CTA */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {/* Link to original published article */}
        {news.link && news.link !== '#' ? (
          <a
            href={news.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            title="Read original article source"
          >
            <span>Original Story</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-slate-500">Live Wire</span>
        )}

        {/* Verify Claim Button */}
        <button
          type="button"
          onClick={handleVerify}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer group-hover:translate-x-0.5"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Verify Claim</span>
          <ArrowRight className="w-3 h-3 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
