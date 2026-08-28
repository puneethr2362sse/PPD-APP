import React, { useState } from 'react';
import { useHistory } from '../context/HistoryContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { VerificationResult } from '../types';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { ForensicSignals } from '../components/verification/ForensicSignals';
import { Link, useNavigate } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Calendar, 
  ArrowUpRight, 
  ShieldCheck, 
  Filter,
  X,
  PlusCircle,
  ExternalLink
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { history, removeScan, clearAll } = useHistory();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'TEXT' | 'IMAGE' | 'REAL' | 'FAKE'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<VerificationResult | null>(null);

  // Filter and search
  const filteredHistory = history.filter(item => {
    // Type/verdict filter
    if (filterType === 'TEXT' && item.type !== 'TEXT') return false;
    if (filterType === 'IMAGE' && item.type !== 'IMAGE') return false;
    if (filterType === 'REAL' && item.verdict !== 'REAL') return false;
    if (filterType === 'FAKE' && item.verdict !== 'FAKE') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPreview = item.preview?.toLowerCase().includes(q);
      const matchExplanation = item.explanation?.toLowerCase().includes(q);
      const matchVerdict = item.verdict.toLowerCase().includes(q);
      const matchType = item.type.toLowerCase().includes(q);
      return matchPreview || matchExplanation || matchVerdict || matchType;
    }
    return true;
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeScan(id);
    showToast('Scan record deleted.', 'info');
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire scan history?')) {
      clearAll();
      showToast('All scan history cleared.', 'info');
      setSelectedRecord(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <HistoryIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white">
                Verification History
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                User-scoped forensic scan records for <span className="text-cyan-300 font-semibold">{currentUser?.name || 'Puneeth'}</span> ({currentUser?.email})
              </p>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
            <Link
              to="/scan/text"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white text-xs font-bold shadow-glow-cyan"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scans by text, headline, or verdict..."
            className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'TEXT', 'IMAGE', 'REAL', 'FAKE'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                filterType === filter
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Records List or Empty State */}
      {filteredHistory.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">No Scan Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || filterType !== 'ALL'
              ? 'No records match your active search or filter criteria.'
              : 'You have not performed any text or image verification scans yet.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/scan/text"
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400"
            >
              Verify Text
            </Link>
            <Link
              to="/scan/image"
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500"
            >
              Verify Image
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map((record) => {
            const isImage = record.type === 'IMAGE';
            const isReal = record.score === 100 && record.verdict === 'REAL';

            return (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className="glass-card-interactive rounded-2xl p-5 border border-slate-800/80 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Subtle left glow border indicator */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isReal ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />

                <div className="space-y-3">
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          isImage
                            ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {isImage ? (
                          <ImageIcon className="w-3 h-3" />
                        ) : (
                          <FileText className="w-3 h-3" />
                        )}
                        <span>{record.type}</span>
                      </span>

                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {record.formattedDate}
                      </span>
                    </div>

                    {/* Prominent Score Badge */}
                    <ScoreBadge score={record.score} verdict={record.verdict} size="sm" />
                  </div>

                  {/* Body Preview with Image Thumbnail if Image */}
                  <div className="flex items-start gap-3">
                    {isImage && record.imageUrl && (
                      <img
                        src={record.imageUrl}
                        alt="Scan preview"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-950"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                        {record.preview}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {record.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Confidence: {record.confidence}%</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, record.id)}
                      title="Delete record"
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 font-semibold">
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED INSPECTION MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-white/10 shadow-2xl relative space-y-6">
            {/* Close Button */}
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {selectedRecord.type} Scan Archive
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedRecord.formattedDate}
              </span>
            </div>

            {/* Prominent Score */}
            <ScoreBadge
              score={selectedRecord.score}
              verdict={selectedRecord.verdict}
              size="md"
            />

            {/* Media or Text Content */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold uppercase text-slate-400">
                Analyzed Content
              </div>
              {selectedRecord.type === 'IMAGE' && selectedRecord.imageUrl ? (
                <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-64 flex items-center justify-center">
                  <img
                    src={selectedRecord.imageUrl}
                    alt="Scan detail"
                    className="max-h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed max-h-48 overflow-y-auto">
                  {selectedRecord.fullContent || selectedRecord.preview}
                </div>
              )}
            </div>

            {/* Reasoning */}
            <div className="space-y-1.5">
              <div className="text-xs font-mono font-bold uppercase text-slate-400">
                Forensic Reasoning
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                {selectedRecord.explanation}
              </p>
            </div>

            {/* Signals */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold uppercase text-slate-400">
                Neural Signals Breakdown
              </div>
              <ForensicSignals signals={selectedRecord.signals} />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const recordToOpen = selectedRecord;
                  setSelectedRecord(null);
                  navigate('/result', { state: { result: recordToOpen } });
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span>Full Forensic View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
