'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { memo, useMemo } from 'react';

import { Asset } from '../components/asset';
import { selectAllImages } from '../store/assets';
import {
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
} from '../store/filters';
import { useAppSelector } from '../store/hooks';
import { applyFilters } from '../utils/filter-actions';
import { composeDimensions } from '../utils/helpers';

// Create a memoized Asset component to prevent unnecessary re-renders
const MemoizedAsset = memo(Asset);

export const AssetList = () => {
  // Get all data from selectors rather than props
  const assets = useAppSelector(selectAllImages);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filterMode = useAppSelector(selectFilterMode);

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
      }),
    [assets, filterTags, filterSizes, filterExtensions, filterMode],
  );

  // Pre-calculate dimensions for each asset to avoid recalculating in the render
  const assetDimensions = useMemo(() => {
    const dimensions = new Map();
    filteredAssets.forEach(({ fileId, dimensions: dims }) => {
      dimensions.set(fileId, composeDimensions(dims));
    });
    return dimensions;
  }, [filteredAssets]);

  // Memoize rendered assets to prevent unnecessary re-renders
  const renderedAssets = useMemo(
    () =>
      filteredAssets.map(({ fileId, fileExtension, dimensions, ioState }) => {
        // Get the pre-calculated dimension string
        const dimensionString = assetDimensions.get(fileId);
        // Check if dimensions or extension are in our filter sets
        const isDimensionActive = filterSizesSet.has(dimensionString);
        const isExtensionActive = filterExtensionsSet.has(fileExtension);

        return (
          <MemoizedAsset
            key={fileId}
            assetId={fileId}
            fileExtension={fileExtension}
            dimensionsActive={isDimensionActive}
            extensionActive={isExtensionActive}
            dimensions={dimensions}
            ioState={ioState}
          />
        );
      }),
    [filteredAssets, filterSizesSet, filterExtensionsSet, assetDimensions],
  );

  // Render a message when no assets match the filters
  if (renderedAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CubeTransparentIcon className="h-12 w-12 text-slate-400" />
        <h1 className="mt-4 mb-4 w-full text-xl">
          No results match your filters
        </h1>
      </div>
    );
  }

  return renderedAssets;
};
