import { EyeIcon } from 'lucide-react';
import { memo, useCallback, useId, useRef } from 'react';

import { Popup, usePopup } from '@/app/components/shared/popup';

import { useVisibilityControl } from './use-visibility-control';
import { VisibilityPanel } from './visibility-panel';

const VisibilityControlComponent = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();
  const popupId = useId();
  const isOpen = getPopupState(popupId).isOpen;

  const { activeCount } = useVisibilityControl();

  const handleClick = useCallback(() => {
    if (isOpen) {
      closePopup(popupId);
    } else {
      openPopup(popupId, {
        position: 'bottom-left',
        triggerRef: buttonRef,
      });
    }
  }, [isOpen, closePopup, openPopup, popupId]);

  const isActive = activeCount > 0;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className={`flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 py-1 text-sm whitespace-nowrap inset-shadow-xs transition-colors ${
          isActive
            ? 'border-teal-400 bg-teal-50 text-teal-700 inset-shadow-teal-100 dark:border-teal-600 dark:bg-teal-900/50 dark:text-teal-300 dark:inset-shadow-teal-900/50'
            : 'border-slate-300 bg-slate-100 text-slate-600 shadow-sm inset-shadow-white hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-600 dark:text-slate-300 dark:inset-shadow-white/10 dark:hover:bg-slate-600'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Visibility settings"
      >
        <EyeIcon className="h-3.5 w-3.5" />
        <span>Visibility</span>
        {isActive && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white tabular-nums">
            {activeCount}
          </span>
        )}
      </button>

      <Popup
        id={popupId}
        position="bottom-left"
        triggerRef={buttonRef}
        className="min-w-56 rounded-md border border-slate-200 bg-white whitespace-nowrap shadow-md shadow-slate-600/50 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-950/50"
      >
        <VisibilityPanel />
      </Popup>
    </div>
  );
};

export const VisibilityControl = memo(VisibilityControlComponent);
