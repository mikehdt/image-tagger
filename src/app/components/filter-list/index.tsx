import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';

import { FiletypesView, getFiletypeSortOptions } from './FiletypesView';
import { getSizeSortOptions, SizesView } from './SizesView';
import { getTagSortOptions, TagsView } from './TagsView';
import { FilterListProps, FilterView, SortDirection, SortType } from './types';

export const FilterList = ({
  isOpen,
  onClose,
  containerRef,
}: FilterListProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Add state for active view
  const [activeView, setActiveView] = useState<FilterView>('tag');

  // Add state for sort direction and type
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortType, setSortType] = useState<SortType>('count');

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
    }
  }, [isOpen, containerRef]);

  // Update position when the panel opens or container reference changes
  useEffect(() => {
    updatePosition();
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

  // Reset sorting when switching views
  useEffect(() => {
    // Default to count sorting when switching views
    setSortType('count');
  }, [activeView]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-20 max-h-[80vh] w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transformOrigin: 'top left',
      }}
    >
      <div className="inline-flex w-full items-center bg-slate-100 p-2">
        <button
          type="button"
          onClick={() => setActiveView('tag')}
          className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 ${
            activeView === 'tag' ? 'bg-white shadow-sm' : 'hover:bg-slate-300'
          }`}
        >
          Tag
        </button>
        <button
          type="button"
          onClick={() => setActiveView('size')}
          className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 ${
            activeView === 'size' ? 'bg-white shadow-sm' : 'hover:bg-slate-300'
          }`}
        >
          Size
        </button>
        <button
          type="button"
          onClick={() => setActiveView('filetype')}
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
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-3">
        <button
          onClick={() =>
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
          }
          className="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-100"
          title="Toggle sort direction"
        >
          {getSortOptions().directionLabel}
        </button>

        <button
          onClick={() => setSortType(getSortOptions().nextType)}
          className="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-100"
          title="Toggle sort type"
        >
          By: {getSortOptions().typeLabel}
        </button>
      </div>
      <div className="max-h-[calc(80vh-51px)] overflow-y-auto">
        {activeView === 'tag' ? (
          <TagsView sortType={sortType} sortDirection={sortDirection} />
        ) : activeView === 'size' ? (
          <SizesView sortType={sortType} sortDirection={sortDirection} />
        ) : (
          <FiletypesView />
        )}
      </div>
    </div>
  );
};
