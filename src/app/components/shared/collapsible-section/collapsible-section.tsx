import { ChevronDownIcon } from 'lucide-react';
import { memo, type ReactNode, useCallback, useState } from 'react';

type CollapsibleSectionProps = {
  title: string;
  defaultExpanded?: boolean;
  /** Content rendered inline after the title (e.g. status dots, badges) */
  headerExtra?: ReactNode;
  /** Actions rendered before the chevron; receives expanded state for conditional visibility */
  headerActions?: ReactNode | ((expanded: boolean) => ReactNode);
  children: ReactNode;
};

const CollapsibleSectionComponent = ({
  title,
  defaultExpanded = true,
  headerExtra,
  headerActions,
  children,
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const actions =
    typeof headerActions === 'function'
      ? headerActions(isExpanded)
      : headerActions;

  return (
    <div className="overflow-hidden rounded-lg border border-(--border)">
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
        className="inset-shadow-color-(--surface-elevated) flex w-full cursor-pointer items-center justify-between bg-(--unselected-bg) px-4 py-3 text-left inset-shadow-sm"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-(--foreground)">{title}</h3>
          {headerExtra}
        </div>

        <div className="flex items-center gap-1">
          {actions}
          <ChevronDownIcon
            className={`h-4 w-4 text-(--unselected-text) transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-(--border) bg-slate-50 px-4 py-3 dark:bg-slate-900">
          {children}
        </div>
      )}
    </div>
  );
};

export const CollapsibleSection = memo(CollapsibleSectionComponent);
