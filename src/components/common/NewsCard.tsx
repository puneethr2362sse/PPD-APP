import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsItem } from '../../types';
import { ScoreBadge } from './ScoreBadge';
import { ArrowRight, Clock, Globe } from 'lucide-react';

interface NewsCardProps {
  news: NewsItem;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const navigate = useNavigate();

  const handleVerify = () => {
    navigate('/scan/text', { state: { prefilledText: news.claimText } });
  };

  return (
    <div className="glass-card-interactive rounded-2xl p-5 flex flex-col justify-between border border-slate-800/80 hover:border-brand-500/30 group">
      <div>
        {/* Header Tags & Score */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/25">
              {news.category}
            </span>
          </div>
          <ScoreBadge score={news.score} verdict={news.verifiedVerdict} size="sm" />
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2 leading-snug">
          {news.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-slate-300 line-clamp-3 mb-4 leading-relaxed font-normal">
          {news.summary}
        </p>
      </div>

      {/* Footer Info & CTA */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-medium">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            {news.source}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {news.timeAgo}
          </span>
        </div>

        <button
          onClick={handleVerify}
          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Verify Claim</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
