import { XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';

import { selectAllTags } from '@/app/store/assets';
import { selectFilterTags, toggleTagFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { highlightText } from '@/app/utils/text-highlight';

import { useFilterContext } from '../filter-context';
import { SortDirection, SortType } from '../types';

// Get sort options for the tags view
export const getTagSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  let typeLabel: string, directionLabel: string;

  switch (sortType) {
    case 'count':
      typeLabel = 'Count';
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
      break;
    case 'active':
      typeLabel = 'Active';
      directionLabel = sortDirection === 'desc' ? '↑ Active' : '↓ Active';
      break;
    case 'alphabetical':
    default:
      typeLabel = 'Name';
      directionLabel = sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A';
  }

  // Calculate next sort type based on current sort type
  let nextType: SortType = 'count';
  if (sortType === 'count') {
    nextType = 'active';
  } else if (sortType === 'active') {
    nextType = 'alphabetical';
  } else if (sortType === 'alphabetical') {
    nextType = 'count';
  }

  return {
    typeLabel,
    directionLabel,
    nextType,
  };
};

export const TagsView = () => {
  const dispatch = useAppDispatch();
  const allTags = useAppSelector(selectAllTags);
  const activeTags = useAppSelector(selectFilterTags);

  const {
    sortType,
    sortDirection,
    searchTerm,
    setSearchTerm,
    updateListLength,
    selectedIndex,
    inputRef,
    handleKeyDown,
  } = useFilterContext();

  // Filter and sort tags based on search term and sort settings
  const filteredTags = useMemo(() => {
    // Convert map to array and filter by search term (if present)
    const filter = searchTerm.toLowerCase();
    const list = Object.entries(allTags)
      .filter(([tag]) => {
        if (!filter) return true;
        return tag.toLowerCase().includes(filter);
      })
      .map(([tag, count]) => ({
        tag,
        count,
        isActive: activeTags.includes(tag),
      }));

    // Sort the tags
    return list.sort((a, b) => {
      // If sort type is active, compare by active state first
      if (sortType === 'active') {
        // First compare by active state
        if (a.isActive !== b.isActive) {
          // Default (desc) puts active items first, asc puts them last
          return sortDirection === 'desc'
            ? a.isActive
              ? -1
              : 1 // active items first when descending (default)
            : a.isActive
              ? 1
              : -1; // active items last when ascending
        }
        // If both have same active state, sort by count descending (9-0) as secondary criteria
        return b.count - a.count; // always descending count (9-0) as tie-breaker
      }
      // If sort type is count, compare by count
      else if (sortType === 'count') {
        return sortDirection === 'asc'
          ? a.count - b.count // ascending
          : b.count - a.count; // descending
      }
      // Otherwise sort by tag name (alphabetical)
      else {
        return sortDirection === 'asc'
          ? a.tag.localeCompare(b.tag) // A-Z
          : b.tag.localeCompare(a.tag); // Z-A
      }
    });
  }, [allTags, activeTags, searchTerm, sortType, sortDirection]);

  // Update list length for keyboard navigation
  useEffect(() => {
    updateListLength(filteredTags.length);
  }, [filteredTags.length, updateListLength]);

  // Handle tag toggle
  const handleToggle = useCallback(
    (tag: string) => {
      dispatch(toggleTagFilter(tag));

      // Focus back on input after selection
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [dispatch, inputRef],
  );

  // Handle tag selection via keyboard
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredTags.length) {
      const selectedTag = filteredTags[selectedIndex].tag;
      // Update UI to show focus on the selected tag
      const tagEl = document.getElementById(`tag-${selectedTag}`);
      if (tagEl) {
        // Ensure the element is in view
        tagEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredTags]);

  // Listen for keyboard selection events
  useEffect(() => {
    const handleKeyboardSelect = (e: CustomEvent) => {
      // Check if the event is for our component by comparing selectedIndex
      if (
        e.detail?.index === selectedIndex &&
        selectedIndex >= 0 &&
        selectedIndex < filteredTags.length
      ) {
        // Get the selected tag and toggle it
        const selectedTag = filteredTags[selectedIndex].tag;
        handleToggle(selectedTag);
      }
    };

    // Add event listener for custom keyboard selection event
    document.addEventListener(
      'filterlist:keyboardselect',
      handleKeyboardSelect as EventListener,
    );

    return () => {
      document.removeEventListener(
        'filterlist:keyboardselect',
        handleKeyboardSelect as EventListener,
      );
    };
  }, [selectedIndex, filteredTags, handleToggle]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Search input section */}
      <div className="relative shrink-0 border-b border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Search tags..."
          className="w-full rounded-full border border-slate-300 bg-white py-1 ps-4 pe-8 inset-shadow-sm inset-shadow-slate-200 transition-all dark:border-slate-600 dark:bg-slate-700 dark:inset-shadow-slate-800"
        />
        <button
          className={`absolute top-3 right-4 h-5 w-5 rounded-full p-0.5 transition-colors ${
            searchTerm.trim() !== ''
              ? 'cursor-pointer text-slate-600 hover:bg-slate-500 hover:text-white dark:text-slate-400 dark:hover:bg-slate-600'
              : 'pointer-events-none text-white dark:text-slate-700'
          }`}
          onClick={
            searchTerm.trim() !== '' ? () => setSearchTerm('') : undefined
          }
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Tags list */}
      {filteredTags.length === 0 ? (
        <div className="truncate p-4 text-center text-sm text-slate-500">
          {searchTerm ? `No tags match "${searchTerm}"` : 'No tags found'}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredTags.map((item, index) => (
              <li
                id={`tag-${item.tag}`}
                key={item.tag}
                onClick={() => handleToggle(item.tag)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
                  index === selectedIndex
                    ? item.isActive
                      ? 'bg-teal-200 dark:bg-teal-800'
                      : 'bg-blue-100 dark:bg-blue-900'
                    : item.isActive
                      ? 'bg-teal-100 dark:bg-teal-900/50'
                      : 'hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
                title={
                  item.isActive
                    ? 'Click to remove from filters'
                    : 'Click to add to filters'
                }
              >
                <span
                  className={`text-sm ${
                    item.isActive
                      ? 'font-medium text-teal-700 dark:text-teal-300'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {searchTerm ? highlightText(item.tag, searchTerm) : item.tag}
                </span>
                <span
                  className={`text-xs tabular-nums ${
                    item.isActive
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
