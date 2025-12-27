import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { memo, useCallback, useEffect, useId, useRef } from 'react';

import { Popup, usePopup } from '@/app/components/shared/popup-v2';
import { selectSearchQuery, setSearchQuery } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

import { Button } from '../../shared/button';

const SearchDropdownComponent = () => {
  const dispatch = useAppDispatch();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();
  const popupId = useId();

  const searchQuery = useAppSelector(selectSearchQuery);
  const isOpen = getPopupState(popupId).isOpen;
  const hasActiveSearch = searchQuery.length > 0;

  const handleToggle = useCallback(() => {
    if (isOpen) {
      closePopup(popupId);
    } else {
      openPopup(popupId, {
        position: 'bottom-left',
        triggerRef: buttonRef,
      });
    }
  }, [isOpen, closePopup, openPopup, popupId]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setSearchQuery(e.target.value));
    },
    [dispatch],
  );

  const handleClear = useCallback(() => {
    dispatch(setSearchQuery(''));
    // Keep focus on input after clearing
    inputRef.current?.focus();
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        closePopup(popupId);
        buttonRef.current?.focus();
      }
    },
    [closePopup, popupId],
  );

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure popup is rendered
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="medium"
        onClick={handleToggle}
        isPressed={isOpen || hasActiveSearch}
        title={hasActiveSearch ? `Searching: "${searchQuery}"` : 'Search assets by name'}
      >
        <MagnifyingGlassIcon className="w-4" />
        {hasActiveSearch && !isOpen && (
          <span className="ml-1 max-w-20 truncate text-xs">{searchQuery}</span>
        )}
      </Button>

      <Popup
        id={popupId}
        position="bottom-left"
        triggerRef={buttonRef}
        className="rounded-md border border-slate-200 bg-white p-2 shadow-lg"
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            className="w-56 rounded-sm border border-slate-300 bg-white py-1.5 pr-8 pl-3 text-sm inset-shadow-sm inset-shadow-slate-200 focus:border-slate-400 focus:outline-none"
            placeholder="Find by asset name..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
          {hasActiveSearch && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              title="Clear search"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </Popup>
    </div>
  );
};

export const SearchDropdown = memo(SearchDropdownComponent);
