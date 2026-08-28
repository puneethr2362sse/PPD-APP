import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VerificationResult } from '../types';
import { historyService } from '../services/historyService';
import { useAuth } from './AuthContext';

interface UserStats {
  totalScans: number;
  realCount: number;
  fakeCount: number;
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
    trustRating: 98,
  });

  const userEmail = currentUser?.email || '';

  const refreshHistory = useCallback(async () => {
    if (!userEmail) {
      setHistory([]);
      setStats({ totalScans: 0, realCount: 0, fakeCount: 0, trustRating: 98 });
      return;
    }
    try {
      const records = await historyService.getHistory(userEmail);
      setHistory(records);

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
    setHistory(prev => [record, ...prev]);
    setStats(prev => {
      const isReal = record.verdict === 'REAL';
      const newTotal = prev.totalScans + 1;
      const newReal = prev.realCount + (isReal ? 1 : 0);
      const newFake = prev.fakeCount + (isReal ? 0 : 1);
      const newTrust = Math.round(90 + (newFake / Math.max(1, newTotal)) * 8);
      return {
        totalScans: newTotal,
        realCount: newReal,
        fakeCount: newFake,
        trustRating: newTrust,
      };
    });
  };

  const removeScan = async (id: string) => {
    if (!userEmail) return;
    setHistory(prev => prev.filter(item => item.id !== id));
    await historyService.deleteRecord(userEmail, id);
    const updatedStats = await historyService.getUserStats(userEmail);
    setStats(updatedStats);
  };

  const clearAll = async () => {
    if (!userEmail) return;
    setHistory([]);
    setStats({ totalScans: 0, realCount: 0, fakeCount: 0, trustRating: 98 });
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
