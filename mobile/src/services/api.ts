import { Platform } from 'react-native';

// Deployed Production Backend
const API_BASE_URL = 'https://app-eight-woad-32.vercel.app/api';

export const api = {
  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const search = new URLSearchParams(params).toString();
      url += `?${search}`;
    }

    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    } catch (err: any) {
      console.warn(`[Mobile API] Error GET ${endpoint}:`, err.message);
      throw err;
    }
  },

  async post<T = any>(endpoint: string, body: any): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    } catch (err: any) {
      console.warn(`[Mobile API] Error POST ${endpoint}:`, err.message);
      throw err;
    }
  },

  async delete<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const search = new URLSearchParams(params).toString();
      url += `?${search}`;
    }

    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    } catch (err: any) {
      console.warn(`[Mobile API] Error DELETE ${endpoint}:`, err.message);
      throw err;
    }
  }
};
