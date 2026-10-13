import { VerificationResult } from '../types';
import { apiClient } from './apiClient';

export const historyService = {
  // Get history for user from Firestore
  async getHistory(userEmail: string): Promise<VerificationResult[]> {
    if (!userEmail) return [];
    try {
      const res = await apiClient.get('/history', { email: userEmail });
      if (res.success && Array.isArray(res.history)) {
        if (res.history.length > 0) {
          try {
            localStorage.setItem(`verifyai_hist_${userEmail}`, JSON.stringify(res.history));
          } catch {}
          return res.history;
        }
        // Fall back to local cache if serverless instance has cold memory
        const local = localStorage.getItem(`verifyai_hist_${userEmail}`);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          } catch {}
        }
        return [];
      }
      return [];
    } catch (err) {
      console.warn('Could not fetch history from Firestore, using local cache:', err);
      try {
        const local = localStorage.getItem(`verifyai_hist_${userEmail}`);
        return local ? JSON.parse(local) : [];
      } catch {
        return [];
      }
    }
  },

  // Delete scan from Firestore
  async deleteRecord(userEmail: string, id: string): Promise<void> {
    if (!userEmail || !id) return;
    try {
      await apiClient.delete(`/history/${id}`, { email: userEmail });
    } catch (err) {
      console.warn('Failed to delete scan on server:', err);
    }
  },

  // Clear all scans for user in Firestore
  async clearHistory(userEmail: string): Promise<void> {
    if (!userEmail) return;
    try {
      await apiClient.delete('/history', { email: userEmail });
    } catch (err) {
      console.warn('Failed to clear history on server:', err);
    }
  },

  // Get user stats
  async getUserStats(userEmail: string): Promise<{ totalScans: number; realCount: number; fakeCount: number; unverifiedCount: number; trustRating: number }> {
    if (!userEmail) {
      return { totalScans: 0, realCount: 0, fakeCount: 0, unverifiedCount: 0, trustRating: 0 };
    }
    try {
      const res = await apiClient.get('/history/stats', { email: userEmail });
      if (res.success && res.stats) {
        return {
          totalScans: Number(res.stats.totalScans) || 0,
          realCount: Number(res.stats.realCount) || 0,
          fakeCount: Number(res.stats.fakeCount) || 0,
          unverifiedCount: Number(res.stats.unverifiedCount) || 0,
          trustRating: Number(res.stats.trustRating) || 0,
        };
      }
      return { totalScans: 0, realCount: 0, fakeCount: 0, unverifiedCount: 0, trustRating: 0 };
    } catch {
      return { totalScans: 0, realCount: 0, fakeCount: 0, unverifiedCount: 0, trustRating: 0 };
    }
  }
};
