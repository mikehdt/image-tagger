import { useCallback, useEffect, useMemo } from 'react';

import { selectAllImages } from '@/app/store/assets';
import { selectFilterBuckets, toggleBucketFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { decomposeDimensions } from '@/app/utils/helpers';

import { useFilterContext } from '../filter-context';

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
    handleItemMouseMove,
    handleItemClick,
    handleListMouseLeave,
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
      if (sortType === 'active') {
        if (a.isActive !== b.isActive) {
          return sortDirection === 'desc'
            ? a.isActive
              ? -1
              : 1
            : a.isActive
              ? 1
              : -1;
        }
        return b.count - a.count;
      }

      let result = 0;

      switch (sortType) {
        case 'dimensions': {
          const { width: aWidth, height: aHeight } = decomposeDimensions(
            a.name.replace('×', 'x'),
          );
          const { width: bWidth, height: bHeight } = decomposeDimensions(
            b.name.replace('×', 'x'),
          );
          result = aWidth !== bWidth ? aWidth - bWidth : aHeight - bHeight;
          break;
        }
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
    handleItemMouseMove,
    handleItemClick,
    handleListMouseLeave,
  };
};
