import { useMemo } from 'react';

import { selectAllTags } from '@/app/store/assets';
import { useAppSelector } from '@/app/store/hooks';
import {
  selectTagSortDirection,
  selectTagSortType,
  TagSortDirection,
  TagSortType,
} from '@/app/store/project';

/**
 * Hook to sort a list of tags based on the current sort settings
 *
 * @param tagList - The original tag list (in sortable/saved order)
 * @returns Object containing both the sorted list for display and original list for drag/drop
 */
export const useTagSorting = (tagList: string[]) => {
  const tagSortType = useAppSelector(selectTagSortType);
  const tagSortDirection = useAppSelector(selectTagSortDirection);
  const allTags = useAppSelector(selectAllTags); // For frequency data

  // Create the sorted tag list for display
  const sortedTagList = useMemo(() => {
    // If using sortable order, return original list
    if (tagSortType === TagSortType.SORTABLE) {
      return tagList;
    }

    // Create a copy to sort
    const sortedTags = [...tagList];

    if (tagSortType === TagSortType.ALPHABETICAL) {
      sortedTags.sort((a, b) => {
        const comparison = a.localeCompare(b);
        return tagSortDirection === TagSortDirection.ASC
          ? comparison
          : -comparison;
      });
    } else if (tagSortType === TagSortType.FREQUENCY) {
      sortedTags.sort((a, b) => {
        const frequencyA = allTags[a] || 0;
        const frequencyB = allTags[b] || 0;
        const comparison = frequencyA - frequencyB;
        return tagSortDirection === TagSortDirection.ASC
          ? comparison
          : -comparison;
      });
    }

    return sortedTags;
  }, [tagList, tagSortType, tagSortDirection, allTags]);

  // Determine if drag/drop should be disabled
  const isDragDropDisabled = tagSortType !== TagSortType.SORTABLE;

  return {
    sortedTagList,
    originalTagList: tagList, // Keep original for drag/drop operations
    isDragDropDisabled,
  };
};
