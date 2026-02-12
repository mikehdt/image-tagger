import { ChevronDownIcon } from 'lucide-react';
import { memo, useCallback, useId, useRef } from 'react';

import { Button } from '@/app/components/shared/button';
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
      <Button
        ref={buttonRef}
        isPressed={isOpen}
        onClick={handleClick}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Visibility settings"
        color={isActive ? 'sky' : 'slate'}
        className="flex gap-1"
      >
        <span className="text-nowrap">Filter Assets</span>

        {isActive && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-xs font-bold text-white tabular-nums">
            {activeCount}
          </span>
        )}

        <ChevronDownIcon
          className={`ml-2 h-3 w-3 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </Button>

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
