import { ChevronDownIcon, RotateCcwIcon } from 'lucide-react';
import { memo, type ReactNode, useCallback, useState } from 'react';

type CollapsibleSectionProps = {
  title: string;
  defaultExpanded?: boolean;
  hasChanges?: boolean;
  onReset?: () => void;
  children: ReactNode;
};

const CollapsibleSectionComponent = ({
  title,
  defaultExpanded = true,
  hasChanges = false,
  onReset,
  children,
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onReset?.();
    },
    [onReset],
  );

  return (
    <div className="rounded-lg border border-(--border-subtle) bg-(--surface)/50">
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-(--foreground)">
            {title}
          </h3>
          {hasChanges && (
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasChanges && onReset && isExpanded && (
            <button
              type="button"
              onClick={handleReset}
              className="mr-2 flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              title="Reset to defaults"
            >
              <RotateCcwIcon className="h-3 w-3" />
              Reset
            </button>
          )}
          <ChevronDownIcon
            className={`h-4 w-4 text-(--unselected-text) transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-(--border-subtle) px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
};

export const CollapsibleSection = memo(CollapsibleSectionComponent);
