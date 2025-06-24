'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { memo, useMemo } from 'react';

import { Asset } from '../components/asset/asset';
import { selectAllImages } from '../store/assets';
import {
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  selectPaginationSize,
  selectShowModified,
} from '../store/filters';
import { useAppSelector } from '../store/hooks';
import { applyFilters } from '../utils/filter-actions';
import { composeDimensions } from '../utils/helpers';

// TODO: Test if this double-memo'ing (see below) is necessary?
// Create a memoized Asset component to prevent unnecessary re-renders
const MemoizedAsset = memo(Asset);

type AssetListProps = {
  currentPage?: number;
};

export const AssetList = ({ currentPage = 1 }: AssetListProps) => {
  // Get pagination size from Redux
  const paginationSize = useAppSelector(selectPaginationSize);

  // Get all data from selectors rather than props
  const assets = useAppSelector(selectAllImages);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filterMode = useAppSelector(selectFilterMode);
  const showModified = useAppSelector(selectShowModified);

  // Create Sets from filters for O(1) lookups instead of O(n)
  const filterSizesSet = useMemo(() => new Set(filterSizes), [filterSizes]);
  const filterExtensionsSet = useMemo(
    () => new Set(filterExtensions),
    [filterExtensions],
  );

  // Memoize filtered assets so they only recalculate when dependencies change
  const filteredAssets = useMemo(
    () =>
      applyFilters({
        assets,
        filterTags,
        filterSizes,
        filterExtensions,
        filterMode,
        showModified,
      }),
    [
      assets,
      filterTags,
      filterSizes,
      filterExtensions,
      filterMode,
      showModified,
    ],
  );

  // Apply pagination to the filtered assets
  const paginatedAssets = useMemo(() => {
    try {
      // If paginationSize is ALL, return all filtered assets
      if (paginationSize === -1) {
        // -1 is PaginationSize.ALL
        return filteredAssets;
      }

      const start = (currentPage - 1) * paginationSize;
      const end = start + paginationSize;
      return filteredAssets.slice(start, end);
    } catch (error) {
      console.error('Error in pagination calculation:', error);
      // Fallback to showing first page of results
      return filteredAssets.slice(0, 100);
    }
  }, [filteredAssets, currentPage, paginationSize]);

  // Pre-calculate dimensions for each asset to avoid recalculating in the render
  const assetDimensions = useMemo(() => {
    const dimensions = new Map();
    paginatedAssets.forEach(({ fileId, dimensions: dims }) => {
      dimensions.set(fileId, composeDimensions(dims));
    });
    return dimensions;
  }, [paginatedAssets]);

  // Memoize rendered assets to prevent unnecessary re-renders
  const renderedAssets = useMemo(
    () =>
      paginatedAssets.map(
        ({ fileId, fileExtension, dimensions, ioState }, index) => {
          // Get the pre-calculated dimension string
          const dimensionString = assetDimensions.get(fileId);
          // Check if dimensions or extension are in our filter sets
          const isDimensionActive = filterSizesSet.has(dimensionString);
          const isExtensionActive = filterExtensionsSet.has(fileExtension);

          // Calculate the global item number based on filtered assets
          const globalItemNumber =
            (currentPage - 1) * paginationSize + index + 1;

          return (
            <MemoizedAsset
              key={fileId}
              assetId={fileId}
              assetNumber={globalItemNumber}
              fileExtension={fileExtension}
              dimensionsActive={isDimensionActive}
              extensionActive={isExtensionActive}
              dimensions={dimensions}
              ioState={ioState}
            />
          );
        },
      ),
    [
      paginatedAssets,
      filterSizesSet,
      filterExtensionsSet,
      assetDimensions,
      currentPage,
      paginationSize,
    ],
  );

  // Render a message when no assets match the filters
  if (filteredAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CubeTransparentIcon className="h-12 w-12 text-slate-400" />
        <h1 className="mt-4 mb-4 w-full text-xl">
          No results match your filters
        </h1>
      </div>
    );
  }

  // If we're on a page that no longer exists after filtering
  if (paginatedAssets.length === 0 && currentPage > 1) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CubeTransparentIcon className="h-12 w-12 text-slate-500" />
        <h1 className="mt-4 mb-4 w-full text-xl">
          This page no longer contains results
        </h1>
        <p className="text-slate-500">
          The applied filters have reduced the number of available pages.
        </p>
      </div>
    );
  }

  return renderedAssets;
};
