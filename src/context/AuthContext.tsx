import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role, User } from '../types';
import { apiRequest, setAuthToken, getAuthToken } from '../utils/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password?: string, role?: Role) => Promise<User>;
  signup: (name: string, email: string, password?: string, role?: Role) => Promise<User>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const persist = (u: User | null, t: string | null = null) => {
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
    setAuthToken(t);
    setToken(t);
    setUser(u);
  };

  useEffect(() => {
    const initAuth = async () => {
      const existingToken = getAuthToken();
      if (existingToken) {
        try {
          const res = await apiRequest('/auth/me');
          if (res.success && res.user) {
            persist(res.user, existingToken);
          }
        } catch {
          // Token expired or server unreachable
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password = 'password', role: Role = 'student'): Promise<User> => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    if (res.success && res.user && res.token) {
      persist(res.user, res.token);
      return res.user;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const signup = async (name: string, email: string, password = 'password', role: Role = 'student'): Promise<User> => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });

    if (res.success && res.user && res.token) {
      persist(res.user, res.token);
      return res.user;
    }
    throw new Error(res.message || 'Registration failed.');
  };

  const forgotPassword = async (email: string): Promise<void> => {
    await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = async (email: string, newPassword: string): Promise<void> => {
    await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  };

  const logout = () => persist(null, null);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, forgotPassword, resetPassword, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
