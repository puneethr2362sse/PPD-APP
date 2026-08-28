import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VerificationResult } from '../types';
import { api } from '../services/api';
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
  removeScan: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
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
      const res = await api.get('/history', { email: userEmail });
      if (res.success && Array.isArray(res.history)) {
        setHistory(res.history);
        await AsyncStorage.setItem(`verifyai_hist_${userEmail}`, JSON.stringify(res.history));
      }

      const statsRes = await api.get('/history/stats', { email: userEmail });
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      // Local fallback
      try {
        const local = await AsyncStorage.getItem(`verifyai_hist_${userEmail}`);
        if (local) {
          const parsed = JSON.parse(local);
          setHistory(parsed);
          const total = parsed.length;
          const real = parsed.filter((s: any) => s.verdict === 'REAL').length;
          const fake = parsed.filter((s: any) => s.verdict === 'FAKE').length;
          setStats({
            totalScans: total,
            realCount: real,
            fakeCount: fake,
            trustRating: total === 0 ? 98 : Math.round(90 + (fake / Math.max(1, total)) * 8),
          });
        }
      } catch {
        // ignore
      }
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
    setHistory(prev => prev.filter(item => item.id !== id));
    try {
      await api.delete(`/history/${id}`, { email: userEmail });
    } catch {
      // ignore
    }
  };

  const clearAll = async () => {
    setHistory([]);
    setStats({ totalScans: 0, realCount: 0, fakeCount: 0, trustRating: 98 });
    try {
      await api.delete('/history', { email: userEmail });
      await AsyncStorage.removeItem(`verifyai_hist_${userEmail}`);
    } catch {
      // ignore
    }
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
