/**
 * Production API Client Utility for Campus Connect AI
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  // Only attach Bearer header if token exists and is valid string (no 'Bearer undefined')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (response.status === 401) {
      // Clear localStorage and redirect to login if session expired on protected route
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
    console.error(`API Error [${endpoint}]:`, errObj.message);
    throw errObj;
  }
}
