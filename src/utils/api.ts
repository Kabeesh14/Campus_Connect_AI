/**
 * Production API Client Utility for Campus Connect AI
 */

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim();
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export function getAuthToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null' || !token.trim()) {
    return null;
  }
  return token.trim();
}

export function setAuthToken(token: string | null): void {
  if (token && token !== 'undefined' && token !== 'null') {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export function getImageUrl(pathOrUrl: string | undefined | null): string {
  const fallback = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200';
  if (!pathOrUrl || typeof pathOrUrl !== 'string' || !pathOrUrl.trim()) {
    return fallback;
  }
  const clean = pathOrUrl.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  const baseUrl = API_BASE_URL.replace(/\/api$/, '');
  return `${baseUrl}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

export function getMediaUrl(pathOrUrl: string | undefined | null): string {
  return getImageUrl(pathOrUrl);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: any;
  token?: string;
  avatar?: string;
  resume?: any;
  skill?: any;
  project?: any;
  certification?: any;
  errors?: any;
  [key: string]: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(
          `API Server returned non-JSON response (${response.status}) at ${url}. Check server health at /api/health`
        );
      }
    }

    if (response.status === 401) {
      setAuthToken(null);
      if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/profile')) {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }

    return data;
  } catch (error: unknown) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    console.error(`API Error [${endpoint}] target [${url}]:`, errObj.message);
    throw errObj;
  }
}
