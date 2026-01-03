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

    const applyTheme = (mode: ThemeMode, systemPrefersDark: boolean) => {
      // Remove existing theme classes
      root.classList.remove('light', 'dark');

      if (mode === 'light') {
        root.classList.add('light');
      } else if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        // Auto mode: add dark class if system prefers dark
        // This ensures Tailwind dark: classes work in auto mode
        if (systemPrefersDark) {
          root.classList.add('dark');
        }
      }
    };

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(theme, mediaQuery.matches);

    // Listen for system preference changes (only matters in auto mode)
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'auto') {
        applyTheme('auto', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  return { theme, setTheme };
};
