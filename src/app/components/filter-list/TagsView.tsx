import { useMemo } from 'react';

import { selectAllTags } from '../../store/assets';
import { selectFilterTags, toggleTagFilter } from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { FilterViewProps, SortDirection, SortType } from './types';

// Get sort options for the tags view
export const getTagSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  return {
    directionLabel:
      sortType === 'count'
        ? `Sort: ${sortDirection === 'asc' ? '↑ 9-0' : '↓ 0-9'}`
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

export const TagsView = ({ sortType, sortDirection }: FilterViewProps) => {
  const dispatch = useAppDispatch();
  const allTags = useAppSelector(selectAllTags);
  const filterTags = useAppSelector(selectFilterTags);

  // Handle tag click to toggle filters
  const handleTagClick = (tag: string) => {
    dispatch(toggleTagFilter(tag));
  };

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

  if (sortedTags.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        No tags found
      </div>
    );
  }

  return (
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
              className={`text-sm ${
                isSelected ? 'font-medium text-emerald-700' : 'text-slate-800'
              }`}
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
  );
};
