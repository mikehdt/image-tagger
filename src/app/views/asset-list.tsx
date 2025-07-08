'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { memo, useMemo } from 'react';

import { Asset } from '../components/asset/asset';
import { selectFilteredAssets } from '../store/assets';
import { selectPaginationSize } from '../store/filters';
import { useAppSelector } from '../store/hooks';
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

  // Get filtered assets from the selector (this handles all filtering logic)
  const filteredAssets = useAppSelector(selectFilteredAssets);

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

  // Create empty Sets for styling purposes (we're not using this filtering logic anymore)
  const filterSizesSet = useMemo(() => new Set(), []);
  const filterExtensionsSet = useMemo(() => new Set(), []);

  // Memoize rendered assets to prevent unnecessary re-renders
  const renderedAssets = useMemo(
    () =>
      paginatedAssets.map(
        ({ fileId, fileExtension, dimensions, ioState, originalIndex }) => {
          // Get the pre-calculated dimension string
          const dimensionString = assetDimensions.get(fileId);
          // Check if dimensions or extension are in our filter sets
          const isDimensionActive = filterSizesSet.has(dimensionString);
          const isExtensionActive = filterExtensionsSet.has(fileExtension);

          // Use the originalIndex which represents the asset's position in the global store
          // This is already 1-based for display purposes
          const globalItemNumber = originalIndex;

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
    [paginatedAssets, filterSizesSet, filterExtensionsSet, assetDimensions],
  );

  return filteredAssets.length ? (
    renderedAssets
  ) : (
    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
      <CubeTransparentIcon className="h-12 w-12" />
      <h1 className="mt-4 mb-4 w-full text-xl">
        No results match your filters
      </h1>
    </div>
  );
};
