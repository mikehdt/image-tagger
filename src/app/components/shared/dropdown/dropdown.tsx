import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { ReactNode, useCallback, useRef } from 'react';

import { Popup, PopupProvider, usePopup } from '../popup';

/**
 * Dropdown Item interface - defines the structure of each dropdown option
 */
export interface DropdownItem<T> {
  /** Unique value for the item */
  value: T;
  /** Display text/element for the item */
  label: ReactNode;
  /** Whether this item is disabled */
  disabled?: boolean;
}

/**
 * Size options for the dropdown
 */
type DropdownSize = 'small' | 'medium' | 'large';

/**
 * Props for the Dropdown component
 */
interface DropdownProps<T> {
  items: DropdownItem<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  selectedValueRenderer?: (item: DropdownItem<T>) => ReactNode;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  itemClassName?: string;
  selectedItemClassName?: string;
  disabledItemClassName?: string;
  alignRight?: boolean;
  openUpward?: boolean;
  size?: DropdownSize;
  fullWidth?: boolean;
}

/**
 * Size styles for dropdown buttons
 */
const sizeStyles: Record<DropdownSize, string> = {
  small: 'px-2 py-1',
  medium: 'px-2 py-1',
  large: 'px-3 py-2',
};

/**
 * Internal dropdown component that uses the popup context
 */
function DropdownInternal<T>({
  items,
  selectedValue,
  onChange,
  selectedValueRenderer,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  itemClassName = '',
  selectedItemClassName = '',
  disabledItemClassName = '',
  alignRight = false,
  openUpward = false,
  size = 'medium',
  fullWidth = false,
}: DropdownProps<T>) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();

  const popupId = 'dropdown-menu';
  const isOpen = getPopupState(popupId).isOpen;

  // Find the selected item
  const selectedItem = items.find((item) => item.value === selectedValue);

  // Determine popup position based on alignment and direction
  const position = openUpward
    ? alignRight
      ? 'top-right'
      : 'top-left'
    : alignRight
      ? 'bottom-right'
      : 'bottom-left';

  // Handle keyboard navigation in the dropdown button
  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      openPopup(popupId, {
        position,
        triggerRef: buttonRef,
      });
      e.preventDefault();
    } else if (e.key === 'Escape' && isOpen) {
      closePopup(popupId);
      e.preventDefault();
    }
  };

  // Handle keyboard navigation in dropdown items
  const handleItemKeyDown = (
    e: React.KeyboardEvent,
    _item: DropdownItem<T>,
    index: number,
  ) => {
    if (e.key === 'Escape') {
      closePopup(popupId);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      // Find the next non-disabled item
      let nextIndex = index + 1;
      while (nextIndex < items.length && items[nextIndex].disabled) {
        nextIndex++;
      }

      if (nextIndex < items.length) {
        (
          e.currentTarget.parentElement?.children[nextIndex] as HTMLElement
        )?.focus();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      // Find the previous non-disabled item
      let prevIndex = index - 1;
      while (prevIndex >= 0 && items[prevIndex].disabled) {
        prevIndex--;
      }

      if (prevIndex >= 0) {
        (
          e.currentTarget.parentElement?.children[prevIndex] as HTMLElement
        )?.focus();
      }
      e.preventDefault();
    }
  };

  // Handle item selection
  const handleItemClick = (item: DropdownItem<T>) => {
    if (!item.disabled) {
      onChange(item.value);
      closePopup(popupId);
    }
  };

  // Handle blur event on the button
  const handleButtonBlur = (e: React.FocusEvent) => {
    // Check if the next focus is not within a popup
    const popupElement = document.querySelector(`[data-popup-id="${popupId}"]`);
    if (!popupElement?.contains(e.relatedTarget as Node)) {
      // Give a small delay to allow new focus to be established before closing
      setTimeout(() => closePopup(popupId), 100);
    }
  };

  const handleClick = useCallback(() => {
    if (isOpen) {
      closePopup(popupId);
    } else {
      openPopup(popupId, {
        position,
        triggerRef: buttonRef,
      });
    }
  }, [isOpen, closePopup, openPopup, position]);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onKeyDown={handleButtonKeyDown}
        onBlur={handleButtonBlur}
        className={`flex cursor-pointer items-center justify-between rounded-sm border border-slate-300 bg-white/50 text-sm whitespace-nowrap inset-shadow-xs inset-shadow-white transition-colors ${
          fullWidth ? 'w-full' : ''
        } ${sizeStyles[size]} ${
          isOpen
            ? 'bg-white shadow-sm'
            : 'bg-white shadow-sm hover:bg-slate-200'
        } ${buttonClassName}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>
          {selectedItem && selectedValueRenderer
            ? selectedValueRenderer(selectedItem)
            : selectedItem?.label}
        </span>
        <ChevronDownIcon
          className={`ml-2 h-3 w-3 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <Popup
        id={popupId}
        position={position}
        triggerRef={buttonRef}
        className={`${
          fullWidth ? 'min-w-full' : 'min-w-20'
        } rounded-md border border-slate-200 bg-white whitespace-nowrap shadow-lg focus:outline-none ${menuClassName}`}
      >
        <div className="divide-y divide-slate-100" role="menu">
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => handleItemKeyDown(e, item, index)}
              className={`block w-full px-3 py-2 text-left text-sm ${
                item.value === selectedValue
                  ? `bg-slate-100 font-medium ${selectedItemClassName}`
                  : `hover:bg-blue-50 ${itemClassName}`
              } ${
                item.disabled
                  ? `cursor-not-allowed text-slate-300 ${disabledItemClassName}`
                  : ''
              }`}
              disabled={item.disabled}
              role="menuitem"
            >
              {item.label}
            </button>
          ))}
        </div>
      </Popup>
    </div>
  );
}

/**
 * A reusable dropdown component with keyboard navigation and accessibility features.
 * This version uses the popup system for consistent behavior across the application.
 */
export function Dropdown<T>(props: DropdownProps<T>) {
  return (
    <PopupProvider>
      <DropdownInternal {...props} />
    </PopupProvider>
  );
}
