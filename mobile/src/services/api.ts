import { Platform } from 'react-native';

// Dynamically use local Wi-Fi IP for real phones, localhost for iOS simulator, 10.0.2.2 for Android emulator
const DEFAULT_HOST = '192.168.1.9';
const PORT = '5000';

const API_BASE_URL = `http://${DEFAULT_HOST}:${PORT}/api`;

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
