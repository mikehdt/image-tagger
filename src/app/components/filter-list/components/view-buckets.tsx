import { ReactNode, useCallback, useEffect, useMemo } from 'react';

import { selectAllImages } from '@/app/store/assets';
import { selectFilterBuckets, toggleBucketFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { decomposeDimensions } from '@/app/utils/helpers';
import { highlightText } from '@/app/utils/text-highlight';

import { useFilterContext } from '../filter-context';
import { SortDirection, SortType } from '../types';

/**
 * Normalization function for buckets - replaces × with x for matching
 * @param text The text to normalize
 * @returns Normalized text
 */
const normalizeBucketText = (text: string): string => {
  return text.replace('×', 'x');
};

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
      directionLabel = sortDirection === 'asc' ? '↑ Active' : '↓ Active';
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

// Get a visual representation of bucket size
const BucketVisualizer = ({
  bucket,
  isActive,
}: {
  bucket: string;
  isActive: boolean;
}): ReactNode => {
  const { width, height } = decomposeDimensions(bucket);
  const maxSize = 36; // Maximum box size for visualization
  let boxWidth, boxHeight;

  if (width >= height) {
    boxWidth = maxSize;
    boxHeight = Math.round((height / width) * maxSize);
  } else {
    boxHeight = maxSize;
    boxWidth = Math.round((width / height) * maxSize);
  }

  // Minimum size to keep box visible
  boxWidth = Math.max(boxWidth, 8);
  boxHeight = Math.max(boxHeight, 8);

  return (
    <div
      className={`border transition-colors ${
        isActive
          ? 'border-purple-500 bg-purple-200'
          : 'border-slate-300 bg-slate-50'
      }`}
      style={{ width: boxWidth, height: boxHeight }}
    />
  );
};

export const BucketsView = () => {
  const dispatch = useAppDispatch();
  const images = useAppSelector(selectAllImages);
  const activeBuckets = useAppSelector(selectFilterBuckets);

  const {
    searchTerm,
    sortType,
    sortDirection,
    updateListLength,
    selectedIndex,
    inputRef,
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

  return bucketList.length === 0 ? (
    <div className="truncate p-4 text-center text-sm text-slate-500">
      {searchTerm ? `No buckets match "${searchTerm}"` : 'No buckets available'}
    </div>
  ) : (
    <ul className="divide-y divide-slate-100">
      {bucketList.map((item, index) => (
        <li
          id={`bucket-${item.name}`}
          key={item.name}
          onClick={() => handleToggle(item.name)}
          className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
            index === selectedIndex
              ? item.isActive
                ? 'bg-purple-200'
                : 'bg-purple-100'
              : item.isActive
                ? 'bg-purple-100'
                : 'hover:bg-purple-50'
          }`}
        >
          <div className="mr-2 flex w-10 justify-center">
            <BucketVisualizer
              bucket={item.name.replace('×', 'x')}
              isActive={item.isActive}
            />
          </div>

          <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-between tabular-nums">
              <span className="text-slate-800">
                {searchTerm
                  ? highlightText(item.name, searchTerm, normalizeBucketText)
                  : item.name}
              </span>
              <span className="ml-auto text-xs text-slate-500">
                {item.count}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
