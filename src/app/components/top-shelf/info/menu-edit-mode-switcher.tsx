import { MousePointerClickIcon, PencilIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import { TagEditMode } from '@/app/store/project';

const options: { mode: TagEditMode; icon: React.ReactNode; label: string }[] = [
  {
    mode: TagEditMode.BUTTON,
    icon: <PencilIcon className="h-4 w-4" />,
    label: 'Button',
  },
  {
    mode: TagEditMode.DOUBLE_CLICK,
    icon: <MousePointerClickIcon className="h-4 w-4" />,
    label: 'Dbl-Click',
  },
];

type MenuEditModeSwitcherProps = {
  editMode: TagEditMode;
  setEditMode: (mode: TagEditMode) => void;
};

const MenuEditModeSwitcherComponent = ({
  editMode,
  setEditMode,
}: MenuEditModeSwitcherProps) => {
  const handleClick = useCallback(
    (mode: TagEditMode) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditMode(mode);
    },
    [setEditMode],
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-sm text-slate-700 dark:text-slate-300">
        Tag Edit
      </span>
      <div className="ml-auto flex gap-0.5 rounded-md bg-slate-100 p-0.5 dark:bg-slate-700">
        {options.map(({ mode, icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={handleClick(mode)}
            title={label}
            className={`flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors ${
              editMode === mode
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

export const MenuEditModeSwitcher = memo(MenuEditModeSwitcherComponent);
