import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { selectAllTags } from '../store/assets';
import { selectFilterTags, toggleTagFilter } from '../store/filters';
import { useAppDispatch, useAppSelector } from '../store/hooks';

interface AllTagsProps {
  isOpen: boolean;
  onClose: () => void;
  containerRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
}

// Define sort types and directions as constants
type SortType = 'count' | 'alphabetical' | 'active';
type SortDirection = 'asc' | 'desc';

export const AllTags = ({ isOpen, onClose, containerRef }: AllTagsProps) => {
  const dispatch = useAppDispatch();
  const allTags = useAppSelector(selectAllTags);
  const filterTags = useAppSelector(selectFilterTags);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Add state for sort direction and type
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortType, setSortType] = useState<SortType>('count');

  // Handle tag click to toggle filters
  const handleTagClick = (tag: string) => {
    dispatch(toggleTagFilter(tag));
    // Optionally close the panel after selecting a tag
    // onClose();
  };

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

  // Sort tags based on current sort type and direction
  const sortedTags = useMemo(() => {
    return Object.entries(allTags).sort(([tagA, countA], [tagB, countB]) => {
      if (sortType === 'active') {
        // Sort by selected/active status first
        const isSelectedA = filterTags.includes(tagA);
        const isSelectedB = filterTags.includes(tagB);

        if (isSelectedA !== isSelectedB) {
          // If one is selected and the other isn't, the selected one goes first
          return isSelectedA ? -1 : 1;
        }

        // If both have the same selection status, sort alphabetically
        const comparison = tagA.localeCompare(tagB);
        return sortDirection === 'desc' ? -comparison : comparison;
      } else if (sortType === 'count') {
        // Sort by count - for count, "asc" means highest first (reversed)
        const comparison =
          sortDirection === 'asc' ? countB - countA : countA - countB;
        // If counts are equal, sort alphabetically as a secondary sort
        return comparison !== 0 ? comparison : tagA.localeCompare(tagB);
      } else {
        // Sort alphabetically - normal sort order
        const comparison = tagA.localeCompare(tagB);
        return sortDirection === 'desc' ? -comparison : comparison;
      }
    });
  }, [allTags, sortType, sortDirection, filterTags]);

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
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-medium text-slate-700">Tags</h3>
        <div className="flex space-x-2">
          <button
            onClick={() =>
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            className="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-100"
            title="Toggle sort direction"
          >
            {sortType === 'count'
              ? `Sort: ${sortDirection === 'asc' ? '↑ 9-0' : '↓ 0-9'}`
              : `Sort: ${sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A'}`}
          </button>

          <button
            onClick={() =>
              setSortType((prev) => {
                if (prev === 'count') return 'alphabetical';
                if (prev === 'alphabetical') return 'active';
                return 'count';
              })
            }
            className="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-100"
            title="Toggle sort type"
          >
            By:{' '}
            {sortType === 'count'
              ? 'Count'
              : sortType === 'alphabetical'
                ? 'Name'
                : 'Active'}
          </button>

          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1 hover:bg-slate-200"
            title="Close tag list"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[calc(80vh-51px)] overflow-y-auto">
        {sortedTags.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {sortedTags.map(([tag, count]) => {
              const isSelected = filterTags.includes(tag);
              return (
                <li
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`flex cursor-pointer justify-between px-3 py-2 hover:bg-slate-50 ${
                    isSelected ? 'bg-emerald-50' : ''
                  }`}
                  title={
                    isSelected
                      ? 'Click to remove from filters'
                      : 'Click to add to filters'
                  }
                >
                  <span
                    className={`text-sm ${isSelected ? 'font-medium text-emerald-700' : 'text-slate-800'}`}
                  >
                    {tag}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    } rounded-full`}
                  >
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4 text-center text-sm text-slate-500">
            No tags found
          </div>
        )}
      </div>
    </div>
  );
};
