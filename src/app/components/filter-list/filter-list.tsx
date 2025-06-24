import { XMarkIcon } from '@heroicons/react/24/outline';
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';

import {
  clearExtensionFilters,
  clearSizeFilters,
  clearTagFilters,
  selectFilterCount,
} from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { FiletypesView, getFiletypeSortOptions } from './file-types';
import { getSizeSortOptions, SizesView } from './sizes';
import { getTagSortOptions, TagsView } from './tags';
import { FilterListProps, FilterView, SortDirection, SortType } from './types';

export const FilterList = ({
  isOpen,
  onClose,
  containerRef,
}: FilterListProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const filterCount = useAppSelector(selectFilterCount);

  // Add state for active view
  const [activeView, setActiveView] = useState<FilterView>('tag');

  // Add state for sort direction and type
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortType, setSortType] = useState<SortType>('count');

  // Add state for search term - used for filtering tags, sizes, or filetypes
  const [searchTerm, setSearchTerm] = useState('');

  // Add state for keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [listLength, setListLength] = useState(0);

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  // Update list length for proper keyboard navigation bounds
  const updateListLength = useCallback((length: number) => {
    setListLength(length);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent cursor movement in input
        setSelectedIndex((prev) => (prev < listLength - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent cursor movement in input
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        // The actual tag selection will be handled in the TagsView component
        e.preventDefault();
        // We'll maintain the selected index and just focus back on the input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else if (e.key === 'Escape') {
        // Clear selection first, if another Escape is pressed, close the panel
        if (selectedIndex >= 0) {
          e.preventDefault();
          setSelectedIndex(-1);
        } else {
          onClose();
        }
      }
    },
    [listLength, selectedIndex, onClose],
  );

  // Calculate and update panel position
  const updatePosition = useCallback(() => {
    if (isOpen && containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const panelWidth = 256; // w-64 = 16rem = 256px

      // Calculate the right edge position of the panel if aligned to the left of the button
      const rightEdge = rect.left + panelWidth;

      // Check if panel would overflow the window when placed at button's left
      const windowWidth = window.innerWidth;
      const wouldOverflow = rightEdge > windowWidth;

      // Adjust left position to keep panel fully visible
      let leftPos = rect.left;
      if (wouldOverflow) {
        // Align to the right edge of the window with some padding
        leftPos = Math.max(0, windowWidth - panelWidth - 16); // 16px padding from right edge
      }

      setPosition({
        top: rect.bottom,
        left: leftPos,
      });
      setIsPositioned(true);
    }
  }, [isOpen, containerRef]);

  // Update position when the panel opens or container reference changes
  useEffect(() => {
    if (isOpen) {
      updatePosition();
    } else {
      // Reset positioning state when panel closes
      setIsPositioned(false);
    }
  }, [isOpen, containerRef, updatePosition]);

  // Handle window resize to keep panel in view
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => {
        updatePosition();
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updatePosition]);

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        containerRef?.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, containerRef]);

  // Get sort options based on the active view
  const getSortOptions = () => {
    if (activeView === 'tag') {
      return getTagSortOptions(sortType, sortDirection);
    } else if (activeView === 'size') {
      return getSizeSortOptions(sortType, sortDirection);
    } else {
      // Filetype or default
      return getFiletypeSortOptions(sortType, sortDirection);
    }
  };

  // Reset sorting and keyboard navigation when switching views
  useEffect(() => {
    // Default to count sorting when switching views
    setSortType('count');
    // Reset list length to ensure proper keyboard navigation
    setListLength(0);
    // Reset selected index (redundant with button click handlers, but adds safety)
    setSelectedIndex(-1);

    // Focus the input field when switching views (if it exists)
    // Use a small timeout to ensure the DOM is ready
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [activeView]);

  if (!isOpen || !isPositioned) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-20 flex max-h-[80vh] w-64 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transformOrigin: 'top left',
      }}
    >
      <div className="inline-flex w-full items-center bg-slate-100 p-2">
        <button
          type="button"
          onClick={() => {
            setActiveView('tag');
            setSearchTerm('');
            setSelectedIndex(-1);
          }}
          className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 ${
            activeView === 'tag' ? 'bg-white shadow-sm' : 'hover:bg-slate-300'
          }`}
        >
          Tag
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveView('size');
            setSearchTerm('');
            setSelectedIndex(-1);
          }}
          className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 ${
            activeView === 'size' ? 'bg-white shadow-sm' : 'hover:bg-slate-300'
          }`}
        >
          Size
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveView('filetype');
            setSearchTerm('');
            setSelectedIndex(-1);
          }}
          className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 ${
            activeView === 'filetype'
              ? 'bg-white shadow-sm'
              : 'hover:bg-slate-300'
          }`}
        >
          Filetype
        </button>
        <button
          onClick={onClose}
          className="ml-2 cursor-pointer rounded-full p-1 hover:bg-slate-200"
          title="Close filter list"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-2">
        <button
          onClick={() => setSortType(getSortOptions().nextType)}
          className="cursor-pointer rounded rounded-tr-none rounded-br-none border border-r-0 border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-100"
          title="Toggle sort type"
        >
          By {getSortOptions().typeLabel}
        </button>

        <button
          onClick={() =>
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
          }
          className="cursor-pointer rounded rounded-tl-none rounded-bl-none border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-100"
          title="Toggle sort direction"
        >
          Sort {getSortOptions().directionLabel}
        </button>

        <button
          onClick={() => {
            // Dispatch clear filters action based on active view
            if (activeView === 'tag') {
              dispatch(clearTagFilters());
            } else if (activeView === 'size') {
              dispatch(clearSizeFilters());
            } else {
              dispatch(clearExtensionFilters());
            }
            // Clear search term and reset selected index
            setSearchTerm('');
            setSelectedIndex(-1);
          }}
          className={`ml-auto rounded border border-slate-200 px-2 py-1 text-xs ${
            (activeView === 'tag' && filterCount.tags > 0) ||
            (activeView === 'size' && filterCount.sizes > 0) ||
            (activeView === 'filetype' && filterCount.extensions > 0)
              ? 'cursor-pointer bg-white hover:bg-slate-100'
              : 'cursor-not-allowed bg-slate-50 text-slate-400'
          }`}
          disabled={
            (activeView === 'tag' && filterCount.tags === 0) ||
            (activeView === 'size' && filterCount.sizes === 0) ||
            (activeView === 'filetype' && filterCount.extensions === 0)
          }
          title={`Clear ${activeView} filters`}
        >
          Clear
        </button>
      </div>

      {/* Only show search box for tag and size views, not for filetype view */}
      {activeView !== 'filetype' && (
        <div className="relative inline-flex bg-slate-50 px-2 pb-2">
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded-full border border-slate-300 bg-white py-1 ps-4 pe-8 transition-all"
            autoFocus
            placeholder={`Search for ${activeView === 'tag' ? 'tag' : 'size'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span
            className={`absolute top-1.5 right-4 h-5 w-5 cursor-pointer rounded-full p-0.5 ${
              searchTerm.trim() !== ''
                ? 'text-slate-600 hover:bg-slate-500 hover:text-white'
                : 'cursor-not-allowed text-gray-300'
            }`}
            onClick={
              searchTerm.trim() !== '' ? () => setSearchTerm('') : undefined
            }
          >
            <XMarkIcon />
          </span>
        </div>
      )}

      <div className="overflow-y-auto border-t border-slate-200">
        {activeView === 'tag' ? (
          <TagsView
            sortType={sortType}
            sortDirection={sortDirection}
            searchTerm={searchTerm}
            updateListLength={updateListLength}
            selectedIndex={selectedIndex}
            onItemSelect={() => {
              // Keep the selection index after item is selected
              // Just focus back on the input
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          />
        ) : activeView === 'size' ? (
          <SizesView
            sortType={sortType}
            sortDirection={sortDirection}
            searchTerm={searchTerm}
            updateListLength={updateListLength}
            selectedIndex={selectedIndex}
            onItemSelect={() => {
              // Keep the selection index after item is selected
              // Just focus back on the input
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          />
        ) : (
          <FiletypesView
            sortType={sortType}
            sortDirection={sortDirection}
            updateListLength={updateListLength}
            selectedIndex={selectedIndex}
          />
        )}
      </div>
    </div>
  );
};
