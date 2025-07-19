import { useCallback, useEffect, useMemo } from 'react';

import { selectAllImages } from '@/app/store/assets';
import { selectFilterBuckets, toggleBucketFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { highlightText } from '@/app/utils/text-highlight';

import { useFilterContext } from '../filter-context';

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
      buckets = buckets.filter((bucket) =>
        bucket.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply sorting
    buckets.sort((a, b) => {
      let result = 0;

      switch (sortType) {
        case 'count':
          result = a.count - b.count;
          break;
        case 'alphabetical':
          result = a.name.localeCompare(b.name);
          break;
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

  return (
    <div className="py-1">
      {bucketList.map((bucket, index) => (
        <BucketItem
          key={bucket.name}
          bucket={bucket}
          index={index}
          selectedIndex={selectedIndex}
          searchTerm={searchTerm}
          onToggle={handleToggle}
        />
      ))}
      {bucketList.length === 0 && (
        <div className="px-3 py-2 text-sm text-slate-500">
          {searchTerm ? 'No matching buckets' : 'No buckets found'}
        </div>
      )}
    </div>
  );
};

const BucketItem = ({
  bucket,
  index,
  selectedIndex,
  searchTerm,
  onToggle,
}: {
  bucket: { name: string; count: number; isActive: boolean };
  index: number;
  selectedIndex: number;
  searchTerm: string;
  onToggle: (bucketName: string) => void;
}) => {
  const isSelected = index === selectedIndex;

  return (
    <div
      id={`bucket-${bucket.name}`}
      className={`cursor-pointer border-l-2 px-3 py-2 transition-colors hover:bg-slate-100 ${
        bucket.isActive
          ? 'border-l-sky-500 bg-sky-50'
          : isSelected
            ? 'border-l-slate-400 bg-slate-100'
            : 'border-l-transparent'
      }`}
      onClick={() => onToggle(bucket.name)}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-800">
          {searchTerm ? highlightText(bucket.name, searchTerm) : bucket.name}
        </span>
        <span className="ml-auto text-xs text-slate-500">{bucket.count}</span>
      </div>
    </div>
  );
};
