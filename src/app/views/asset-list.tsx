'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Asset } from '../components/asset/asset';
import { ButtonPlayground } from '../components/shared/button/button-playground';
import {
  type ImageAsset,
  selectFilteredAssets,
  selectSortDirection,
  selectSortType,
  SortType,
} from '../store/assets';
import { selectPaginationSize } from '../store/filters';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearClickTracking,
  selectSelectedAssets,
  selectShiftHoverPreview,
  setShiftHoverAssetId,
} from '../store/selection';
import {
  getCategoryAnchorId,
  getSortCategory,
  sortCategories,
} from '../utils/category-utils';
import { scrollToAnchor } from '../utils/scroll-to-anchor';
import { useAnchorScrolling } from '../utils/use-anchor-scrolling';

// Define interface for asset with pagination index
interface AssetWithPaginationIndex extends ImageAsset {
  originalIndex: number;
  paginatedIndex: number;
  filteredIndex: number; // Pre-calculated filtered index for display
}

type AssetListProps = {
  currentPage?: number;
};

export const AssetList = ({ currentPage = 1 }: AssetListProps) => {
  // Handle anchor scrolling for cross-page navigation
  useAnchorScrolling();

  const dispatch = useAppDispatch();

  // Track whether shift key is currently held
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  // Track currently hovered asset (using ref to avoid re-renders on hover)
  const hoveredAssetRef = useRef<string | null>(null);

  // Clear shift-click tracking when page changes
  useEffect(() => {
    dispatch(clearClickTracking());
  }, [currentPage, dispatch]);

  // Track shift key state globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !isShiftHeld) {
        setIsShiftHeld(true);
        // If already hovering an asset when shift is pressed, update Redux
        if (hoveredAssetRef.current) {
          dispatch(setShiftHoverAssetId(hoveredAssetRef.current));
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(false);
        dispatch(setShiftHoverAssetId(null));
      }
    };
    // Also clear on blur (window loses focus)
    const handleBlur = () => {
      setIsShiftHeld(false);
      dispatch(setShiftHoverAssetId(null));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [dispatch, isShiftHeld]);

  // Get pagination size from Redux
  const paginationSize = useAppSelector(selectPaginationSize);
  const sortType = useAppSelector(selectSortType);
  const sortDirection = useAppSelector(selectSortDirection);
  const selectedAssets = useAppSelector(selectSelectedAssets);

  // Only use selectedAssets for grouping when sorting by selection
  // This prevents unnecessary re-renders when selection changes but sort type doesn't need it
  const selectedAssetsForGrouping = useMemo(
    () => (sortType === SortType.SELECTED ? selectedAssets : []),
    [sortType, selectedAssets],
  );

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

  // Get paginated asset IDs for shift-hover preview calculation
  const paginatedAssetIds = useMemo(
    () => paginatedAssets.map((a) => a.fileId),
    [paginatedAssets],
  );

  // Get shift-hover preview state
  const shiftHoverPreview = useAppSelector((state) =>
    selectShiftHoverPreview(state, paginatedAssetIds),
  );

  // Handler for asset hover - always track in ref, dispatch to Redux only if shift is held
  const handleAssetHover = useCallback(
    (assetId: string | null) => {
      hoveredAssetRef.current = assetId;
      if (isShiftHeld) {
        dispatch(setShiftHoverAssetId(assetId));
      }
    },
    [dispatch, isShiftHeld],
  );

  // Group assets by sort category
  const groupedAssets = useMemo(() => {
    const groups: { [key: string]: AssetWithPaginationIndex[] } = {};

    // Pre-calculate the start index for filtered index calculation
    const startIndex =
      (currentPage - 1) * (paginationSize === -1 ? 0 : paginationSize);

    paginatedAssets.forEach((asset, index) => {
      const assetWithIndex: AssetWithPaginationIndex = {
        ...asset,
        paginatedIndex: index,
        // Pre-calculate filtered index to avoid doing it in render
        originalIndex: asset.originalIndex,
        filteredIndex: startIndex + index + 1, // 1-based index for display
      };
      const category = getSortCategory(
        assetWithIndex,
        sortType,
        selectedAssetsForGrouping,
      );
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(assetWithIndex);
    });

    // Sort categories using shared utility
    const sortedCategories = sortCategories(
      Object.keys(groups),
      sortType,
      sortDirection,
    );

    // Return groups in sorted order
    return sortedCategories.map((category) => ({
      category,
      assets: groups[category],
    }));
  }, [
    paginatedAssets,
    sortType,
    sortDirection,
    selectedAssetsForGrouping,
    currentPage,
    paginationSize,
  ]);

  // Check if there's only one category to hide headers
  const showCategoryHeaders = groupedAssets.length > 1;

  // Memoize rendered assets to prevent unnecessary re-renders
  const renderedAssets = useMemo(
    () =>
      groupedAssets.map(({ category, assets }) => {
        const anchorId = getCategoryAnchorId(category);

        return (
          <div key={category} className="asset-group">
            {showCategoryHeaders ? (
              <div
                id={anchorId}
                className="sticky top-24 z-10 -mx-2 cursor-pointer scroll-mt-24 rounded-sm border-b border-b-slate-700/80 bg-slate-500/60 px-4 py-1 text-sm font-medium text-white backdrop-blur-md transition-colors text-shadow-slate-700 text-shadow-xs hover:bg-slate-600/70"
                onClick={() => scrollToAnchor(anchorId)}
                title="Click to scroll to top of this section"
              >
                {category}
              </div>
            ) : (
              // Still provide anchor ID for single category case, but invisible
              <div id={anchorId} className="scroll-mt-24" />
            )}

            {assets.map((asset) => {
              // Determine preview state for this asset
              const previewState = shiftHoverPreview?.previewAssetIds.has(
                asset.fileId,
              )
                ? shiftHoverPreview.previewAction
                : null;

              return (
                <Asset
                  key={asset.fileId}
                  assetId={asset.fileId}
                  assetNumber={asset.originalIndex}
                  filteredIndex={asset.filteredIndex}
                  fileExtension={asset.fileExtension}
                  dimensions={asset.dimensions}
                  bucket={asset.bucket}
                  ioState={asset.ioState}
                  lastModified={asset.lastModified}
                  currentPage={currentPage}
                  previewState={previewState}
                  onHover={handleAssetHover}
                />
              );
            })}
          </div>
        );
      }),
    [
      groupedAssets,
      showCategoryHeaders,
      currentPage,
      shiftHoverPreview,
      handleAssetHover,
    ],
  );

  return filteredAssets.length ? (
    <>
      <ButtonPlayground />
      {renderedAssets}
    </>
  ) : (
    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
      <CubeTransparentIcon className="h-24 w-24" />
      <h1 className="mt-4 mb-4 w-full text-xl">
        No results match your filters
      </h1>
    </div>
  );
};
