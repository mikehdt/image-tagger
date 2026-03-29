import type { PreferencesState } from './types';
import { TagEditMode, type ThemeMode } from './types';

const STORAGE_KEY = 'preferences';
const LEGACY_THEME_KEY = 'theme-preference';

const VALID_THEMES = ['light', 'dark', 'auto'];
const VALID_EDIT_MODES = Object.values(TagEditMode);

const defaults: PreferencesState = {
  theme: 'auto',
  tagEditMode: TagEditMode.BUTTON,
};

/** Read preferences from localStorage, migrating the legacy theme key if present. */
export const loadPreferences = (): PreferencesState => {
  if (typeof window === 'undefined') return defaults;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        theme: VALID_THEMES.includes(parsed.theme)
          ? (parsed.theme as ThemeMode)
          : defaults.theme,
        tagEditMode: VALID_EDIT_MODES.includes(parsed.tagEditMode)
          ? parsed.tagEditMode
          : defaults.tagEditMode,
      };
    }

    // Migrate legacy theme key
    const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacyTheme && VALID_THEMES.includes(legacyTheme)) {
      const state: PreferencesState = {
        ...defaults,
        theme: legacyTheme as ThemeMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.removeItem(LEGACY_THEME_KEY);
      return state;
    }
  } catch {
    // Corrupt data — fall through to defaults
  }

  return defaults;
};

/** Write preferences to localStorage. */
export const savePreferences = (state: PreferencesState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
};
