import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import { ThemeMode } from '@/app/utils/use-theme';

const options: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'light', icon: <SunIcon />, label: 'Light' },
  { mode: 'dark', icon: <MoonIcon />, label: 'Dark' },
  { mode: 'auto', icon: <MonitorIcon />, label: 'Auto' },
];

type MenuThemeSwitcherProps = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
};

const MenuThemeSwitcherComponent = ({
  theme,
  setTheme,
}: MenuThemeSwitcherProps) => {
  const handleClick = useCallback(
    (mode: ThemeMode) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setTheme(mode);
    },
    [setTheme],
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-sm text-slate-700 dark:text-slate-300">Theme</span>
      <div className="ml-auto flex gap-0.5 rounded-md bg-slate-100 p-0.5 dark:bg-slate-700">
        {options.map(({ mode, icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={handleClick(mode)}
            title={label}
            className={`flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors ${
              theme === mode
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-500 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const MenuThemeSwitcher = memo(MenuThemeSwitcherComponent);
