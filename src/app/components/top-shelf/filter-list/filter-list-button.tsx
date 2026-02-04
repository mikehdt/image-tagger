import { ListTodoIcon } from 'lucide-react';
import { memo, useCallback, useId, useRef } from 'react';

import { Popup, usePopup } from '@/app/components/shared/popup';

import { Button } from '../../shared/button';
import { FilterProvider } from './filter-context';
import { FilterPanel } from './filter-panel';

const FilterListButtonComponent = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();

  const popupId = useId();
  const isOpen = getPopupState(popupId).isOpen;

  const handleToggle = useCallback(() => {
    if (isOpen) {
      closePopup(popupId);
    } else {
      openPopup(popupId, {
        position: 'bottom-right',
        triggerRef: buttonRef,
      });
    }
  }, [isOpen, closePopup, openPopup, popupId]);

  const handleClose = useCallback(() => {
    closePopup(popupId);
  }, [closePopup, popupId]);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="toggle"
        size="large"
        isPressed={isOpen}
        onClick={handleToggle}
        title="Show filters"
      >
        <ListTodoIcon className="h-4 w-4" />
      </Button>

      <Popup
        id={popupId}
        position="bottom-right"
        triggerRef={buttonRef}
        className="flex w-64 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800"
      >
        <FilterProvider onClose={handleClose}>
          <FilterPanel />
        </FilterProvider>
      </Popup>
    </div>
  );
};

export const FilterListButton = memo(FilterListButtonComponent);
