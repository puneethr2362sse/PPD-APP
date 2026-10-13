import { NewsItem } from '../types';
import { apiClient } from './apiClient';

export interface NewsCategory {
  id: string;
  label: string;
}

export const newsService = {
  // Fetch live articles by category from the backend
  async getLiveNews(
    category: string = 'all',
    forceRefresh: boolean = false
  ): Promise<{
    success: boolean;
    news: NewsItem[];
    error?: string;
    cached?: boolean;
    stale?: boolean;
    refreshedAt?: string;
    newArticlesCount?: number;
    isUpToDate?: boolean;
    statusMessage?: string;
  }> {
    try {
      const params: Record<string, string> = { category };
      if (forceRefresh) {
        params.refresh = 'true';
        params._t = String(Date.now());
      }
      const res = await apiClient.get('/news', params);
      if (res.success && Array.isArray(res.news)) {
        return {
          success: true,
          news: res.news,
          cached: res.cached,
          stale: res.stale,
          refreshedAt: res.refreshedAt,
          newArticlesCount: res.newArticlesCount,
          isUpToDate: res.isUpToDate,
          statusMessage: res.statusMessage,
          error: res.error,
        };
      }
      return { success: false, news: [], error: res.error || 'Failed to load news articles.' };
    } catch (err: any) {
      return { success: false, news: [], error: err.message || 'Could not connect to news service.' };
    }
  },

  // Get available news categories
  async getCategories(): Promise<NewsCategory[]> {
    try {
      const res = await apiClient.get('/news/categories');
      if (res.success && Array.isArray(res.categories)) {
        return res.categories;
      }
    } catch {
      // Fallback categories if server endpoint is temporarily unavailable
    }
    return [
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
    ];
  },
};
