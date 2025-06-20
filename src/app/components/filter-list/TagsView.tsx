import { Fragment, useCallback, useEffect, useMemo } from 'react';

import { selectAllTags } from '../../store/assets';
import { selectFilterTags, toggleTagFilter } from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { FilterViewProps, SortDirection, SortType } from './types';

/**
 * Highlights all occurrences of a search term within text
 * @param text The text to search within
 * @param searchTerm The term to highlight
 * @returns Array of React elements with highlighted matches
 */
const highlightMatches = (text: string, searchTerm: string) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return text; // Return the original text if no search term
  }

  const termLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();
  const segments = [];
  let lastIndex = 0;
  let index = textLower.indexOf(termLower);

  // Find all occurrences of the search term
  while (index !== -1) {
    // Add the text before the match
    if (index > lastIndex) {
      segments.push(
        <Fragment key={`${lastIndex}-regular`}>
          {text.slice(lastIndex, index)}
        </Fragment>,
      );
    }

    // Add the bold match
    segments.push(
      <strong key={`${index}-highlight`} className="font-bold">
        {text.slice(index, index + termLower.length)}
      </strong>,
    );

    lastIndex = index + termLower.length;
    index = textLower.indexOf(termLower, lastIndex);
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    segments.push(
      <Fragment key={`${lastIndex}-regular`}>{text.slice(lastIndex)}</Fragment>,
    );
  }

  return segments.length > 0 ? segments : text;
};

// Get sort options for the tags view
export const getTagSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  return {
    directionLabel:
      sortType === 'count'
        ? `Sort: ${sortDirection === 'asc' ? '↓ 9-0' : '↑ 0-9'}`
        : `Sort: ${sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A'}`,
    typeLabel:
      sortType === 'count'
        ? 'Count'
        : sortType === 'alphabetical'
          ? 'Name'
          : 'Active',
    nextType:
      sortType === 'count'
        ? ('alphabetical' as SortType)
        : sortType === 'alphabetical'
          ? ('active' as SortType)
          : ('count' as SortType),
  };
};

export const TagsView = ({
  sortType,
  sortDirection,
  searchTerm = '',
  selectedIndex = -1,
  updateListLength,
  onItemSelect,
}: FilterViewProps) => {
  const dispatch = useAppDispatch();
  const allTags = useAppSelector(selectAllTags);
  const filterTags = useAppSelector(selectFilterTags);

  // Handle tag click to toggle filters
  const handleTagClick = useCallback(
    (tag: string, isKeyboardSelection = false) => {
      dispatch(toggleTagFilter(tag));

      // Notify parent of selection when keyboard navigation is used
      // This will focus back on the input without changing the selected index
      if (isKeyboardSelection && onItemSelect) {
        onItemSelect(selectedIndex);
      }
    },
    [dispatch, onItemSelect, selectedIndex],
  ); // Filter and sort tags based on search term and current sort type and direction
  const sortedTags = useMemo(() => {
    // Filter tags based on search term
    const filteredTags = Object.entries(allTags).filter(([tag]) => {
      if (!searchTerm || searchTerm.trim() === '') return true;
      return tag.toLowerCase().includes(searchTerm.toLowerCase().trim());
    });

    // Sort the filtered tags
    return filteredTags.sort(([tagA, countA], [tagB, countB]) => {
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
  }, [allTags, sortType, sortDirection, filterTags, searchTerm]);

  // Handle enter key for keyboard navigation
  useEffect(() => {
    if (
      selectedIndex >= 0 &&
      sortedTags.length > 0 &&
      selectedIndex < sortedTags.length
    ) {
      const [tag] = sortedTags[selectedIndex];
      const handleKeyDownEnter = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleTagClick(tag, true);
        }
      };
      document.addEventListener('keydown', handleKeyDownEnter);
      return () => {
        document.removeEventListener('keydown', handleKeyDownEnter);
      };
    }
  }, [selectedIndex, sortedTags, handleTagClick]);

  // Update list length for keyboard navigation when sorted tags change
  useEffect(() => {
    if (updateListLength) {
      updateListLength(sortedTags.length);
    }
  }, [sortedTags, updateListLength]);

  if (sortedTags.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        {searchTerm ? `No tags matching "${searchTerm}"` : 'No tags found'}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {sortedTags.map(([tag, count], index) => {
        const isSelected = filterTags.includes(tag);
        const isKeyboardSelected = index === selectedIndex;

        return (
          <li
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
              isKeyboardSelected
                ? isSelected
                  ? 'bg-emerald-100'
                  : 'bg-blue-100'
                : isSelected
                  ? 'bg-emerald-50'
                  : 'hover:bg-slate-50'
            }`}
            title={
              isSelected
                ? 'Click to remove from filters'
                : 'Click to add to filters'
            }
          >
            <span
              className={`text-sm ${
                isSelected ? 'font-medium text-emerald-700' : 'text-slate-800'
              }`}
            >
              {/* Always highlight, even for selected tags - the strong tag will override the medium font weight */}
              {highlightMatches(tag, searchTerm)}
            </span>
            <span
              className={`text-xs tabular-nums ${
                isSelected ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
