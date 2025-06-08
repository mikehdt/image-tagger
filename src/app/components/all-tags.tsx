import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectAllTags } from '../store/slice-assets';
import { selectFilterTags, toggleTagFilter } from '../store/slice-filters';

interface AllTagsProps {
  isOpen: boolean;
  onClose: () => void;
  containerRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
}

export const AllTags = ({ isOpen, onClose, containerRef }: AllTagsProps) => {
  const dispatch = useAppDispatch();
  const allTags = useAppSelector(selectAllTags);
  const filterTags = useAppSelector(selectFilterTags);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle tag click to toggle filters
  const handleTagClick = (tag: string) => {
    dispatch(toggleTagFilter(tag));
    // Optionally close the panel after selecting a tag
    // onClose();
  };

  // Calculate and update panel position
  const updatePosition = () => {
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
        left: leftPos
      });
    }
  };

  // Update position when the panel opens or container reference changes
  useEffect(() => {
    updatePosition();
  }, [isOpen, containerRef]);

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
  }, [isOpen]);

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

  // Sort tags by count (descending) and then alphabetically
  const sortedTags = useMemo(() => {
    return Object.entries(allTags)
      .sort(([tagA, countA], [tagB, countB]) => {
        // First sort by count (descending)
        if (countA !== countB) {
          return countB - countA;
        }
        // Then sort alphabetically
        return tagA.localeCompare(tagB);
      });
  }, [allTags]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-20 w-64 max-h-[80vh] bg-white shadow-lg rounded-md border border-slate-200 overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transformOrigin: 'top left'
      }}
    >
      <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-700">Tag Summary</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded-full"
          title="Close tag list"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(80vh-40px)]">
        {sortedTags.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {sortedTags.map(([tag, count]) => {
              const isSelected = filterTags.includes(tag);
              return (
                <li
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`flex justify-between py-2 px-3 hover:bg-slate-50 cursor-pointer ${
                    isSelected ? 'bg-emerald-50' : ''
                  }`}
                  title={isSelected ? "Click to remove from filters" : "Click to add to filters"}
                >
                  <span className={`text-sm ${isSelected ? 'text-emerald-700 font-medium' : 'text-slate-800'}`}>
                    {tag}
                  </span>
                  <span className={`text-xs px-2 py-0.5 ${
                    isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  } rounded-full`}>
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4 text-sm text-slate-500 text-center">
            No tags found
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="p-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200 text-center">
        Click on a tag to toggle it in filters
      </div>
    </div>
  );
};
