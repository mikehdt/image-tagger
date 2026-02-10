import { useCallback, useEffect, useMemo } from 'react';

import { selectAllImages } from '@/app/store/assets';
import { selectFilterBuckets, toggleBucketFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { decomposeDimensions } from '@/app/utils/helpers';

import { useFilterContext } from '../../filter-context';
import { SortDirection, SortType } from '../../types';

// Get sort options for the buckets view (simplified compared to image sizes)
export const getBucketSortOptions = (
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
    case 'dimensions':
      typeLabel = 'Size';
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
      break;
    default:
      // Fallback to count for any unsupported sort types (like megapixels, aspectRatio)
      typeLabel = 'Count';
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
  }

  // Simple cycle: count → active → dimensions → count
  let nextType: SortType = 'count';
  if (sortType === 'count') {
    nextType = 'active';
  } else if (sortType === 'active') {
    nextType = 'dimensions';
  } else {
    nextType = 'count';
  }

  const nextDirection: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

  return {
    typeLabel,
    directionLabel,
    nextType,
    nextDirection,
  };
};

export const useBucketsView = () => {
  const dispatch = useAppDispatch();
  const images = useAppSelector(selectAllImages);
  const activeBuckets = useAppSelector(selectFilterBuckets);

  const {
    searchTerm,
    setSearchTerm,
    sortType,
    sortDirection,
    updateListLength,
    selectedIndex,
    inputRef,
    handleKeyDown,
  } = useFilterContext();

  // Calculate bucket counts from images
  const bucketCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};

    images.forEach((image) => {
      const bucketKey = `${image.bucket.width}×${image.bucket.height}`;
      counts[bucketKey] = (counts[bucketKey] || 0) + 1;
    });

    return counts;
  }, [images]);

  // Convert to array and apply filtering/sorting
  const bucketList = useMemo(() => {
    let buckets = Object.entries(bucketCounts).map(([bucket, count]) => ({
      name: bucket,
      count,
      isActive: activeBuckets.includes(bucket),
    }));

    // Apply search filter
    if (searchTerm) {
      const filter = searchTerm.toLowerCase().replace('×', 'x');
      buckets = buckets.filter((bucket) => {
        // Normalize the bucket dimensions format for searching (× to x)
        const normalizedBucket = bucket.name.toLowerCase().replace('×', 'x');
        return normalizedBucket.includes(filter);
      });
    }

    // Apply sorting
    buckets.sort((a, b) => {
      let result = 0;

      switch (sortType) {
        case 'count':
          result = a.count - b.count;
          break;
        case 'dimensions': {
          // Parse dimensions and sort by size (borrowed from view-sizes logic)
          const { width: aWidth, height: aHeight } = decomposeDimensions(
            a.name.replace('×', 'x'),
          );
          const { width: bWidth, height: bHeight } = decomposeDimensions(
            b.name.replace('×', 'x'),
          );

          // Sort by width first, then by height
          if (aWidth !== bWidth) {
            result = aWidth - bWidth;
          } else {
            result = aHeight - bHeight;
          }
          break;
        }
        case 'active':
          result = Number(a.isActive) - Number(b.isActive);
          break;
        default:
          result = a.count - b.count;
      }

      return sortDirection === 'desc' ? -result : result;
    });

    return buckets;
  }, [bucketCounts, activeBuckets, searchTerm, sortType, sortDirection]);

  // Update list length for keyboard navigation
  useEffect(() => {
    updateListLength(bucketList.length);
  }, [bucketList.length, updateListLength]);

  // Create a memoized toggle handler
  const handleToggle = useCallback(
    (bucket: string) => {
      dispatch(toggleBucketFilter(bucket));

      // Focus back on input after selection
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [dispatch, inputRef],
  );

  // Handle bucket selection via keyboard
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < bucketList.length) {
      const selectedBucket = bucketList[selectedIndex].name;
      // Update UI to show focus on the selected bucket
      const bucketEl = document.getElementById(`bucket-${selectedBucket}`);
      if (bucketEl) {
        // Ensure the element is in view
        bucketEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, bucketList]);

  // Listen for keyboard selection events
  useEffect(() => {
    const handleKeyboardSelect = (e: CustomEvent) => {
      // Check if the event is for our component by comparing selectedIndex
      if (
        e.detail?.index === selectedIndex &&
        selectedIndex >= 0 &&
        selectedIndex < bucketList.length
      ) {
        // Get the selected bucket and toggle it
        const selectedBucket = bucketList[selectedIndex].name;
        handleToggle(selectedBucket);
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
  }, [selectedIndex, bucketList, handleToggle]);

  return {
    searchTerm,
    setSearchTerm,
    handleKeyDown,
    inputRef,
    bucketList,
    selectedIndex,
    handleToggle,
  };
};
