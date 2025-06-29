import {
  ChevronDownIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

import { FilterMode } from '../../../store/filters';

interface FilterModeControlsProps {
  filterTagsMode: FilterMode;
  filterModifiedActive: boolean;
  hasModifiedAssets: boolean;
  filterTags: string[];
  filterSizes: string[];
  filterExtensions: string[];
  setTagFilterMode: (mode: FilterMode) => void;
  toggleModifiedFilter: () => void;
}

export const FilterModeControls = ({
  filterTagsMode,
  filterModifiedActive,
  hasModifiedAssets,
  filterTags,
  filterSizes,
  filterExtensions,
  setTagFilterMode,
  toggleModifiedFilter,
}: FilterModeControlsProps) => {
  // Derive filterSelectionActive within the component
  const filterSelectionActive = !!(
    filterTags.length ||
    filterSizes.length ||
    filterExtensions.length
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });

  // Handle closing dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDropdownOpen]);

  // Update dropdown position when it opens
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
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
  }, [isDropdownOpen]);

  // Get the display text for the current filter mode
  const getFilterModeText = () => {
    switch (filterTagsMode) {
      case FilterMode.SHOW_ALL:
        return 'Show All';
      case FilterMode.MATCH_ANY:
        return 'Match Any';
      case FilterMode.MATCH_ALL:
        return 'Match All';
      case FilterMode.MATCH_NONE:
        return 'Match None';
      default:
        return 'Show All';
    }
  };

  return (
    <div className="mr-4 inline-flex items-center rounded-md bg-slate-100 p-1">
      <span className="mr-1 py-1">
        {filterTagsMode === FilterMode.SHOW_ALL ? (
          <DocumentCheckIcon className="w-4" />
        ) : (
          <DocumentMagnifyingGlassIcon className="w-4" />
        )}
      </span>

      <div
        ref={dropdownRef}
        className={`relative mr-2 rounded-sm ${filterSelectionActive ? 'shadow-md inset-shadow-sm shadow-white inset-shadow-slate-300' : ''}`}
      >
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
              setIsDropdownOpen(true);
              e.preventDefault();
            } else if (e.key === 'Escape' && isDropdownOpen) {
              setIsDropdownOpen(false);
              e.preventDefault();
            }
          }}
          onBlur={(e) => {
            // Check if the next focus is outside our component
            if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
              // Give a small delay to allow new focus to be established before closing
              setTimeout(() => setIsDropdownOpen(false), 100);
            }
          }}
          className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 transition-colors ${
            filterTagsMode !== FilterMode.SHOW_ALL && !filterSelectionActive
              ? 'text-slate-300'
              : ''
          } ${isDropdownOpen ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
        >
          <span>{getFilterModeText()}</span>
          <ChevronDownIcon
            className={`ml-1 h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <div
          style={{ left: `${dropdownPosition.left}px`, minWidth: '110px' }}
          className={`ring-opacity-5 absolute z-10 mt-1 origin-top-left transform rounded-md bg-white shadow-lg ring-1 ring-black transition-all focus:outline-none ${
            isDropdownOpen
              ? 'scale-100 opacity-100'
              : 'pointer-events-none scale-95 opacity-0'
          } whitespace-nowrap`}
          role="menu"
        >
          <div className="py-0">
            <button
              type="button"
              onClick={() => {
                setTagFilterMode(FilterMode.SHOW_ALL);
                setIsDropdownOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                  e.preventDefault();
                } else if (e.key === 'ArrowDown') {
                  (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
                  e.preventDefault();
                }
              }}
              className={`block w-full px-2 py-1 text-left text-sm ${
                filterTagsMode === FilterMode.SHOW_ALL
                  ? 'bg-slate-100 font-medium'
                  : 'hover:bg-slate-50'
              }`}
              role="menuitem"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={() => {
                if (filterSelectionActive) {
                  setTagFilterMode(FilterMode.MATCH_ANY);
                  setIsDropdownOpen(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                  e.preventDefault();
                } else if (e.key === 'ArrowDown') {
                  (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
                  e.preventDefault();
                } else if (e.key === 'ArrowUp') {
                  (
                    e.currentTarget.previousElementSibling as HTMLElement
                  )?.focus();
                  e.preventDefault();
                }
              }}
              className={`block w-full px-2 py-1 text-left text-sm ${
                filterTagsMode === FilterMode.MATCH_ANY
                  ? 'bg-slate-100 font-medium'
                  : 'hover:bg-slate-50'
              } ${!filterSelectionActive ? 'cursor-not-allowed text-slate-300' : ''}`}
              disabled={!filterSelectionActive}
              role="menuitem"
            >
              Match Any
            </button>
            <button
              type="button"
              onClick={() => {
                if (filterSelectionActive) {
                  setTagFilterMode(FilterMode.MATCH_ALL);
                  setIsDropdownOpen(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                  e.preventDefault();
                } else if (e.key === 'ArrowDown') {
                  (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
                  e.preventDefault();
                } else if (e.key === 'ArrowUp') {
                  (
                    e.currentTarget.previousElementSibling as HTMLElement
                  )?.focus();
                  e.preventDefault();
                }
              }}
              className={`block w-full px-2 py-1 text-left text-sm ${
                filterTagsMode === FilterMode.MATCH_ALL
                  ? 'bg-slate-100 font-medium'
                  : 'hover:bg-slate-50'
              } ${!filterSelectionActive ? 'cursor-not-allowed text-slate-300' : ''}`}
              disabled={!filterSelectionActive}
              role="menuitem"
            >
              Match All
            </button>
            <button
              type="button"
              onClick={() => {
                if (filterSelectionActive) {
                  setTagFilterMode(FilterMode.MATCH_NONE);
                  setIsDropdownOpen(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                  e.preventDefault();
                } else if (e.key === 'ArrowUp') {
                  (
                    e.currentTarget.previousElementSibling as HTMLElement
                  )?.focus();
                  e.preventDefault();
                }
              }}
              className={`block w-full px-2 py-1 text-left text-sm ${
                filterTagsMode === FilterMode.MATCH_NONE
                  ? 'bg-slate-100 font-medium'
                  : 'hover:bg-slate-50'
              } ${!filterSelectionActive ? 'cursor-not-allowed text-slate-300' : ''}`}
              disabled={!filterSelectionActive}
              role="menuitem"
            >
              Match None
            </button>
          </div>
        </div>
      </div>

      <div
        className={`rounded-sm ${!filterModifiedActive && hasModifiedAssets ? 'shadow-md inset-shadow-sm shadow-white inset-shadow-slate-300' : ''}`}
      >
        <button
          type="button"
          onClick={toggleModifiedFilter}
          className={`rounded-sm p-1 px-2 transition-colors ${
            filterModifiedActive ? 'bg-white shadow-sm' : ''
          } ${hasModifiedAssets ? 'cursor-pointer text-slate-700' : 'text-slate-300'} ${!filterModifiedActive && hasModifiedAssets ? 'hover:bg-slate-300' : ''}`}
          disabled={!hasModifiedAssets}
        >
          Modified
        </button>
      </div>
    </div>
  );
};
