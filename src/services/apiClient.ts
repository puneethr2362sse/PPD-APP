const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return json.error || json.message || fallback;
    } catch {
      if (text && text.length < 200 && !text.includes('<!DOCTYPE') && !text.includes('<html')) {
        return text.trim();
      }
    }
  } catch {
    // ignore
  }
  return fallback;
}

export const apiClient = {
  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = `${API_BASE}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {};
    if (params?.refresh || params?._t) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }

    const res = await fetch(url, {
      headers,
      cache: (params?.refresh || params?._t) ? 'no-store' : 'default',
    });
    if (!res.ok) {
      const errorMsg = await parseErrorMessage(res, `HTTP ${res.status}`);
      throw new Error(errorMsg);
    }
    return res.json();
  },

  async post<T = any>(endpoint: string, body: any): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorMsg = await parseErrorMessage(res, `HTTP ${res.status}`);
      throw new Error(errorMsg);
    }
    return res.json();
  },

  async put<T = any>(endpoint: string, body: any): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorMsg = await parseErrorMessage(res, `HTTP ${res.status}`);
      throw new Error(errorMsg);
    }
    return res.json();
  },

  async delete<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = `${API_BASE}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const res = await fetch(url, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorMsg = await parseErrorMessage(res, `HTTP ${res.status}`);
      throw new Error(errorMsg);
    }
    return res.json();
  }
};
