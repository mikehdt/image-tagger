export type ThemeMode = 'light' | 'dark' | 'auto';

export enum TagEditMode {
  BUTTON = 'BUTTON',
  DOUBLE_CLICK = 'DOUBLE_CLICK',
}

export type PreferencesState = {
  theme: ThemeMode;
  tagEditMode: TagEditMode;
};
