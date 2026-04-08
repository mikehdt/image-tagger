import { RotateCcwIcon } from 'lucide-react';
import { useCallback } from 'react';

type SectionResetButtonProps = {
  onClick: () => void;
};

export const SectionResetButton = ({ onClick }: SectionResetButtonProps) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick();
    },
    [onClick],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mr-2 flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
      title="Reset to defaults"
    >
      <RotateCcwIcon className="h-3 w-3" />
      Reset
    </button>
  );
};
