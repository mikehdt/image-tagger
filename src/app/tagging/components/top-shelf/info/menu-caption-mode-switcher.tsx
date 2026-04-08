import { HashIcon, TextIcon, WholeWordIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import type { CaptionMode } from '@/app/store/project/types';

const options: { mode: CaptionMode; icon: React.ReactNode; label: string }[] = [
  {
    mode: 'tags',
    icon: <HashIcon className="h-4 w-4" />,
    label: 'Tags',
  },
  // Sentences mode hidden until split logic is reworked
  // {
  //   mode: 'sentences',
  //   icon: <WholeWordIcon className="h-4 w-4" />,
  //   label: 'Sentences',
  // },
  {
    mode: 'caption',
    icon: <TextIcon className="h-4 w-4" />,
    label: 'Caption',
  },
];

type MenuCaptionModeSwitcherProps = {
  captionMode: CaptionMode;
  setCaptionMode: (mode: CaptionMode) => void;
};

const MenuCaptionModeSwitcherComponent = ({
  captionMode,
  setCaptionMode,
}: MenuCaptionModeSwitcherProps) => {
  const handleClick = useCallback(
    (mode: CaptionMode) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setCaptionMode(mode);
    },
    [setCaptionMode],
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-sm text-slate-700 dark:text-slate-300">
        Tagging
      </span>
      <div className="ml-auto flex gap-0.5 rounded-md bg-slate-100 p-0.5 dark:bg-slate-700">
        {options.map(({ mode, icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={handleClick(mode)}
            title={label}
            className={`flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors ${
              captionMode === mode
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

export const MenuCaptionModeSwitcher = memo(MenuCaptionModeSwitcherComponent);
