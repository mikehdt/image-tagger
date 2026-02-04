import React, { ReactNode, useCallback, useId, useRef } from 'react';

import { Button } from '../button';
import { Popup, usePopup } from '../popup';

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
};

type MenuButtonProps = {
  icon: ReactNode;
  items: MenuItem[];
  title?: string;
  disabled?: boolean;
  position?: 'bottom-left' | 'bottom-right';
};

/**
 * A button that opens a popup menu with action items.
 * Simpler than Dropdown - no "selected value" concept, just a list of actions.
 */
export const MenuButton = ({
  icon,
  items,
  title,
  disabled = false,
  position = 'bottom-left',
}: MenuButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();

  const popupId = useId();
  const isOpen = getPopupState(popupId).isOpen;

  const handleClick = useCallback(() => {
    if (disabled) return;

    if (isOpen) {
      closePopup(popupId);
    } else {
      openPopup(popupId, {
        position,
        triggerRef: buttonRef,
      });
    }
  }, [disabled, isOpen, closePopup, openPopup, position, popupId]);

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      openPopup(popupId, {
        position,
        triggerRef: buttonRef,
      });
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closePopup(popupId);
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePopup(popupId);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Find next non-disabled item
      let nextIndex = index + 1;
      while (nextIndex < items.length && items[nextIndex].disabled) {
        nextIndex++;
      }
      if (nextIndex < items.length) {
        (
          e.currentTarget.parentElement?.children[nextIndex] as HTMLElement
        )?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Find previous non-disabled item
      let prevIndex = index - 1;
      while (prevIndex >= 0 && items[prevIndex].disabled) {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        (
          e.currentTarget.parentElement?.children[prevIndex] as HTMLElement
        )?.focus();
      }
    }
  };

  const handleItemClick = useCallback(
    (item: MenuItem) => {
      if (!item.disabled) {
        closePopup(popupId);
        item.onClick();
      }
    },
    [closePopup, popupId],
  );

  const handleButtonBlur = (e: React.FocusEvent) => {
    const popupElement = document.querySelector(`[data-popup-id="${popupId}"]`);
    if (!popupElement?.contains(e.relatedTarget as Node)) {
      setTimeout(() => closePopup(popupId), 100);
    }
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        onClick={handleClick}
        onKeyDown={handleButtonKeyDown}
        onBlur={handleButtonBlur}
        disabled={disabled}
        isPressed={isOpen}
        title={title}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {icon}
      </Button>

      <Popup
        id={popupId}
        position={position}
        triggerRef={buttonRef}
        className="min-w-44 rounded-md border border-slate-200 bg-white py-1 shadow-md shadow-slate-600/50 dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-950/50"
      >
        <div role="menu">
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => handleItemKeyDown(e, index)}
              disabled={item.disabled}
              role="menuitem"
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                item.disabled
                  ? 'cursor-not-allowed text-slate-300 dark:text-slate-500'
                  : 'text-slate-700 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {item.icon && <span className="w-4 shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </Popup>
    </div>
  );
};
