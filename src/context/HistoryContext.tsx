import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VerificationResult } from '../types';
import { historyService } from '../services/historyService';
import { useAuth } from './AuthContext';

interface UserStats {
  totalScans: number;
  realCount: number;
  fakeCount: number;
  unverifiedCount: number;
  trustRating: number;
}

interface HistoryContextType {
  history: VerificationResult[];
  stats: UserStats;
  addScan: (record: VerificationResult) => void;
  removeScan: (id: string) => void;
  clearAll: () => void;
  refreshHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalScans: 0,
    realCount: 0,
    fakeCount: 0,
    unverifiedCount: 0,
    trustRating: 0,
  });

  const userEmail = currentUser?.email || '';

  const refreshHistory = useCallback(async () => {
    if (!userEmail) {
      setHistory([]);
      setStats({ totalScans: 0, realCount: 0, fakeCount: 0, unverifiedCount: 0, trustRating: 0 });
      return;
    }
    try {
      const serverRecords = await historyService.getHistory(userEmail);
      // Merge server records with existing local state by unique ID to prevent dropping fresh scans
      setHistory(prev => {
        const idMap = new Map<string, VerificationResult>();
        serverRecords.forEach(item => idMap.set(item.id, item));
        prev.forEach(item => {
          if (!idMap.has(item.id)) idMap.set(item.id, item);
        });
        const merged = Array.from(idMap.values());
        merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return merged;
      });

      const serverStats = await historyService.getUserStats(userEmail);
      setStats(serverStats);
    } catch (err) {
      console.warn('Error refreshing history:', err);
    }
  }, [userEmail]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const addScan = (record: VerificationResult) => {
    // Avoid duplicate additions
    setHistory(prev => {
      if (prev.some(item => item.id === record.id)) return prev;
      const updated = [record, ...prev];
      try {
        if (userEmail) {
          // Cap stored items at 100 to guard against browser localStorage quota limits
          localStorage.setItem(`verifyai_hist_${userEmail}`, JSON.stringify(updated.slice(0, 100)));
        }
      } catch {}
      return updated;
    });

    const isReal = record.verdict === 'REAL' || record.verdict === 'TRUE';
    const isFake = record.verdict === 'FAKE' || record.verdict === 'FALSE';
    const isUnverified = record.verdict === 'UNVERIFIED' || (record as any).verdictLabel === 'NOT ENOUGH EVIDENCE';

    setStats(prev => {
      const newTotal = prev.totalScans + 1;
      const newReal = prev.realCount + (isReal ? 1 : 0);
      const newFake = prev.fakeCount + (isFake ? 1 : 0);
      const newUnverified = (prev.unverifiedCount || 0) + (isUnverified ? 1 : 0);

      const recordConf = typeof record.confidence === 'number' && !isNaN(record.confidence)
        ? record.confidence
        : (isReal ? 95 : isFake ? 90 : 50);
      const prevTotalConf = prev.totalScans > 0 ? prev.trustRating * prev.totalScans : 0;
      const newTrust = Math.round((prevTotalConf + recordConf) / newTotal);

      return {
        totalScans: newTotal,
        realCount: newReal,
        fakeCount: newFake,
        unverifiedCount: newUnverified,
        trustRating: newTrust,
      };
    });

    // Re-sync with backend to guarantee persistent accuracy
    if (userEmail) {
      historyService.getUserStats(userEmail).then(serverStats => {
        if (serverStats) setStats(serverStats);
      }).catch(() => {});
    }
  };

  const removeScan = async (id: string) => {
    if (!userEmail) return;
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(`verifyai_hist_${userEmail}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    await historyService.deleteRecord(userEmail, id);
    const updatedStats = await historyService.getUserStats(userEmail);
    setStats(updatedStats);
  };

  const clearAll = async () => {
    if (!userEmail) return;
    setHistory([]);
    setStats({ totalScans: 0, realCount: 0, fakeCount: 0, unverifiedCount: 0, trustRating: 0 });
    try {
      localStorage.removeItem(`verifyai_hist_${userEmail}`);
    } catch {}
    await historyService.clearHistory(userEmail);
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        stats,
        addScan,
        removeScan,
        clearAll,
        refreshHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
