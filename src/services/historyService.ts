import { VerificationResult } from '../types';
import { apiClient } from './apiClient';

export const historyService = {
  // Get history for user from Firestore
  async getHistory(userEmail: string): Promise<VerificationResult[]> {
    if (!userEmail) return [];
    try {
      const res = await apiClient.get('/history', { email: userEmail });
      if (res.success && Array.isArray(res.history)) {
        return res.history;
      }
      return [];
    } catch (err) {
      console.warn('Could not fetch history from Firestore, using local cache:', err);
      const local = localStorage.getItem(`verifyai_hist_${userEmail}`);
      return local ? JSON.parse(local) : [];
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
  async getUserStats(userEmail: string): Promise<{ totalScans: number; realCount: number; fakeCount: number; trustRating: number }> {
    if (!userEmail) {
      return { totalScans: 0, realCount: 0, fakeCount: 0, trustRating: 98 };
    }
    try {
      const res = await apiClient.get('/history/stats', { email: userEmail });
      if (res.success && res.stats) {
        return res.stats;
      }
      return { totalScans: 0, realCount: 0, fakeCount: 0, trustRating: 98 };
    } catch {
      return { totalScans: 0, realCount: 0, fakeCount: 0, trustRating: 98 };
    }
  }
};
