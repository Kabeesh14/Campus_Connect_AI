import { useEffect, useState } from 'react';
import type { Theme } from '../types';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem('cca-theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('cca-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, setTheme, toggleTheme };
}
