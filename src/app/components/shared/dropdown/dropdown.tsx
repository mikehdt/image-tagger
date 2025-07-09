import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

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
}

/**
 * A reusable dropdown component with keyboard navigation and accessibility features.
 */
export function Dropdown<T>({
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
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });

  // Find the selected item
  const selectedItem = items.find((item) => item.value === selectedValue);

  // Handle closing dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Update dropdown position when it opens
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      // Calculate position to ensure dropdown stays within viewport
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // If dropdownRef is too close to the right edge, adjust position
      if (rect.right > viewportWidth - 10) {
        const adjustment = rect.right - (viewportWidth - 10);
        setDropdownPosition({ left: -adjustment });
      } else {
        setDropdownPosition({ left: 0 });
      }
    }
  }, [isOpen]);

  // Handle keyboard navigation in the dropdown button
  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      setIsOpen(true);
      e.preventDefault();
    } else if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
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
      setIsOpen(false);
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
      setIsOpen(false);
    }
  };

  // Handle blur event on the button
  const handleButtonBlur = (e: React.FocusEvent) => {
    // Check if the next focus is outside our component
    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
      // Give a small delay to allow new focus to be established before closing
      setTimeout(() => setIsOpen(false), 100);
    }
  };

  const handleClick = useCallback(() => setIsOpen(!isOpen), [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleButtonKeyDown}
        onBlur={handleButtonBlur}
        className={`flex cursor-pointer items-center justify-between rounded-sm border border-slate-300 bg-white/50 px-2 py-1 text-sm inset-shadow-xs inset-shadow-white transition-colors ${
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

      <div
        style={{
          left: alignRight ? 'auto' : `${dropdownPosition.left}px`,
          right: alignRight ? 0 : 'auto',
        }}
        className={`absolute z-10 mt-1 origin-top-left transform rounded-md border border-slate-200 bg-white whitespace-nowrap shadow-lg transition-all focus:outline-none ${
          isOpen
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        } ${menuClassName}`}
        role="menu"
      >
        <div className="divide-y divide-slate-100">
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
      </div>
    </div>
  );
}
