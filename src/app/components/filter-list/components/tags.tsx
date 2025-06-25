import { Fragment, useCallback, useEffect, useMemo } from 'react';

import { selectAllTags } from '../../../store/assets';
import { selectFilterTags, toggleTagFilter } from '../../../store/filters';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useFilterList } from '../filter-list-context';
import { SortDirection, SortType } from '../types';

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

  // If no matches, return original text
  if (!textLower.includes(termLower)) {
    return text;
  }

  const result = [];
  let lastIndex = 0;

  // Find all occurrences of the search term
  let index = textLower.indexOf(termLower);

  while (index !== -1) {
    // Add the text before the match
    if (index > lastIndex) {
      result.push(
        <Fragment key={`text-${lastIndex}`}>
          {text.substring(lastIndex, index)}
        </Fragment>,
      );
    }

    // Add the highlighted match
    result.push(
      <span key={`match-${index}`} className="bg-yellow-200 text-black">
        {text.substring(index, index + searchTerm.length)}
      </span>,
    );

    lastIndex = index + searchTerm.length;
    index = textLower.indexOf(termLower, lastIndex);
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    result.push(
      <Fragment key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </Fragment>,
    );
  }

  return result;
};

// Get sort options for the tags view
export const getTagSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  return {
    directionLabel:
      sortType === 'count'
        ? `${sortDirection === 'asc' ? '↓ 9-0' : '↑ 0-9'}`
        : `${sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A'}`,
    typeLabel: sortType === 'count' ? 'Count' : 'Name',
    nextType:
      sortType === 'count'
        ? ('alphabetical' as SortType)
        : ('count' as SortType),
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
  } = useFilterList();

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
      // If sort type is count, compare by count
      if (sortType === 'count') {
        return sortDirection === 'asc'
          ? a.count - b.count // ascending
          : b.count - a.count; // descending
      } else {
        // Otherwise sort by tag name
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

  return (
    <div>
      {filteredTags.length === 0 ? (
        <div className="p-4 text-center text-sm text-slate-500">
          {searchTerm ? `No tags matching "${searchTerm}"` : 'No tags found'}
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
                    ? 'bg-emerald-100'
                    : 'bg-blue-100'
                  : item.isActive
                    ? 'bg-emerald-50'
                    : 'hover:bg-slate-50'
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
                    ? 'font-medium text-emerald-700'
                    : 'text-slate-800'
                }`}
              >
                {searchTerm ? highlightMatches(item.tag, searchTerm) : item.tag}
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
      )}
    </div>
  );
};
