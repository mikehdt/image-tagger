import { useCallback, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectTheme,
  setTheme as setThemeAction,
  type ThemeMode,
} from '@/app/store/preferences';

export type { ThemeMode } from '@/app/store/preferences';

/**
 * Hook to manage theme (light/dark/auto) preference.
 * Reads from and writes to the Redux preferences slice (persisted to localStorage).
 * Applies the appropriate class to document.documentElement for Tailwind dark: support.
 */
export const useTheme = () => {
  const theme = useAppSelector(selectTheme);
  const dispatch = useAppDispatch();

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (mode: ThemeMode, systemPrefersDark: boolean) => {
      root.classList.remove('light', 'dark');

      if (mode === 'light') {
        root.classList.add('light');
      } else if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        // Auto mode: add dark class if system prefers dark
        if (systemPrefersDark) {
          root.classList.add('dark');
        }
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(theme, mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'auto') {
        applyTheme('auto', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      dispatch(setThemeAction(newTheme));
    },
    [dispatch],
  );

  return { theme, setTheme };
};
