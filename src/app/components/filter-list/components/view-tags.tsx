import { useCallback, useEffect, useMemo } from 'react';

import { selectAllTags } from '@/app/store/assets';
import { selectFilterTags, toggleTagFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { highlightText } from '@/app/utils/text-highlight';

import { useOptimizedFilterContext } from '../optimized-filter-context';
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
      directionLabel = sortDirection === 'asc' ? '↑ Active' : '↓ Active';
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
    updateListLength,
    selectedIndex,
    inputRef,
  } = useOptimizedFilterContext();

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
          return sortDirection === 'asc'
            ? a.isActive
              ? -1
              : 1 // active items first when ascending
            : a.isActive
              ? 1
              : -1; // active items last when descending
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

  return filteredTags.length === 0 ? (
    <div className="truncate p-4 text-center text-sm text-slate-500">
      {searchTerm ? `No tags match "${searchTerm}"` : 'No tags found'}
    </div>
  ) : (
    <ul className="divide-y divide-slate-100">
      {filteredTags.map((item, index) => (
        <li
          id={`tag-${item.tag}`}
          key={item.tag}
          onClick={() => handleToggle(item.tag)}
          className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
            index === selectedIndex
              ? item.isActive
                ? 'bg-emerald-200'
                : 'bg-blue-100'
              : item.isActive
                ? 'bg-emerald-100'
                : 'hover:bg-blue-50'
          }`}
          title={
            item.isActive
              ? 'Click to remove from filters'
              : 'Click to add to filters'
          }
        >
          <span
            className={`text-sm ${
              item.isActive ? 'font-medium text-emerald-700' : 'text-slate-800'
            }`}
          >
            {searchTerm ? highlightText(item.tag, searchTerm) : item.tag}
          </span>
          <span
            className={`text-xs tabular-nums ${
              item.isActive ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  );
};
