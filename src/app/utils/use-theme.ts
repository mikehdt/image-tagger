import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'theme-preference';

/**
 * Hook to manage theme (light/dark/auto) preference.
 * Persists to localStorage and applies class to document.documentElement.
 */
export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>('auto');

  // Initialise from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Apply class based on preference
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    }
    // 'auto' = no class, CSS media query handles it
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  return { theme, setTheme };
};
