'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { useCallback, useMemo } from 'react';

import { Asset } from '../components/asset/asset';
import {
  type ImageAsset,
  selectFilteredAssets,
  selectSortDirection,
  selectSortType,
  SortDirection,
  SortType,
} from '../store/assets';
import { selectPaginationSize } from '../store/filters';
import { useAppSelector } from '../store/hooks';
import { selectSelectedAssets } from '../store/selection';

// Constants for sort category names
const SCALED_CATEGORIES = {
  EQUAL_SIZE: 'Equal Size',
  SAME_ASPECT: 'Scaled (Same Aspect)',
  DIFFERENT: 'Scaled',
} as const;

const SELECTED_CATEGORIES = {
  SELECTED: 'Selected',
  NOT_SELECTED: 'Not Selected',
} as const;

// Create arrays of the category values for sorting
const SCALED_ORDER = Object.values(SCALED_CATEGORIES);
const SELECTED_ORDER = Object.values(SELECTED_CATEGORIES);

// Helper functions for type-safe category ordering
const getScaledCategoryIndex = (category: string): number => {
  return SCALED_ORDER.findIndex((cat) => cat === category);
};

const getSelectedCategoryIndex = (category: string): number => {
  return SELECTED_ORDER.findIndex((cat) => cat === category);
};

// Define interface for asset with pagination index
interface AssetWithPaginationIndex extends ImageAsset {
  originalIndex: number;
  paginatedIndex: number;
}

type AssetListProps = {
  currentPage?: number;
};

export const AssetList = ({ currentPage = 1 }: AssetListProps) => {
  // Get pagination size from Redux
  const paginationSize = useAppSelector(selectPaginationSize);
  const sortType = useAppSelector(selectSortType);
  const sortDirection = useAppSelector(selectSortDirection);
  const selectedAssets = useAppSelector(selectSelectedAssets);

  // Get filtered assets from the selector (this handles all filtering logic)
  const filteredAssets = useAppSelector(selectFilteredAssets);

  // Helper function to get sort category for an asset
  const getSortCategory = useCallback(
    (asset: AssetWithPaginationIndex): string => {
      switch (sortType) {
        case SortType.NAME:
          const firstChar = asset.fileId.charAt(0).toLowerCase();
          if (firstChar >= '0' && firstChar <= '9') {
            return '0-9';
          } else if (firstChar >= 'a' && firstChar <= 'z') {
            return firstChar.toUpperCase();
          } else {
            return 'Other';
          }

        case SortType.IMAGE_SIZE:
          return `${asset.dimensions.width} × ${asset.dimensions.height}`;

        case SortType.BUCKET_SIZE:
          return `${asset.bucket.width} × ${asset.bucket.height}`;

        case SortType.SCALED:
          // Check if dimensions are identical
          if (
            asset.dimensions.width === asset.bucket.width &&
            asset.dimensions.height === asset.bucket.height
          ) {
            return SCALED_CATEGORIES.EQUAL_SIZE;
          }

          // Check if aspect ratios are identical (within tolerance)
          const imageAspectRatio =
            asset.dimensions.width / asset.dimensions.height;
          const bucketAspectRatio = asset.bucket.width / asset.bucket.height;
          const aspectRatioTolerance = 0.001;

          if (
            Math.abs(imageAspectRatio - bucketAspectRatio) <
            aspectRatioTolerance
          ) {
            return SCALED_CATEGORIES.SAME_ASPECT;
          }

          return SCALED_CATEGORIES.DIFFERENT;

        case SortType.SELECTED:
          return selectedAssets.includes(asset.fileId)
            ? SELECTED_CATEGORIES.SELECTED
            : SELECTED_CATEGORIES.NOT_SELECTED;

        default:
          return 'All Assets';
      }
    },
    [sortType, selectedAssets],
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

  // Group assets by sort category
  const groupedAssets = useMemo(() => {
    const groups: { [key: string]: AssetWithPaginationIndex[] } = {};

    paginatedAssets.forEach((asset, index) => {
      const assetWithIndex: AssetWithPaginationIndex = {
        ...asset,
        paginatedIndex: index,
      };
      const category = getSortCategory(assetWithIndex);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(assetWithIndex);
    });

    // Convert to array and sort categories if needed
    const groupArray = Object.entries(groups).map(([category, assets]) => ({
      category,
      assets,
    }));

    // Sort categories based on sort type and direction
    groupArray.sort((a, b) => {
      let comparison = 0;

      switch (sortType) {
        case SortType.NAME:
          // Numbers first, then letters, then other
          const getOrder = (cat: string) => {
            if (cat === '0-9') return 0;
            if (cat.length === 1 && cat >= 'A' && cat <= 'Z') return 1;
            return 2;
          };

          const orderA = getOrder(a.category);
          const orderB = getOrder(b.category);

          if (orderA !== orderB) {
            comparison = orderA - orderB;
          } else {
            // Within same type, sort alphabetically
            comparison = a.category.localeCompare(b.category);
          }
          break;

        case SortType.SCALED:
          // Define order for scaled categories using constants
          const aIndex = getScaledCategoryIndex(a.category);
          const bIndex = getScaledCategoryIndex(b.category);
          comparison = aIndex - bIndex;
          break;

        case SortType.SELECTED:
          // Selected first, then not selected using constants
          const aSelectedIndex = getSelectedCategoryIndex(a.category);
          const bSelectedIndex = getSelectedCategoryIndex(b.category);
          comparison = aSelectedIndex - bSelectedIndex;
          break;

        case SortType.IMAGE_SIZE:
        case SortType.BUCKET_SIZE:
          // For size categories, parse dimensions and sort numerically
          const parseDimensions = (cat: string) => {
            const [width, height] = cat.split(' × ').map(Number);
            return { width: width || 0, height: height || 0 };
          };

          const aDims = parseDimensions(a.category);
          const bDims = parseDimensions(b.category);

          // Sort by width first, then height
          if (aDims.width !== bDims.width) {
            comparison = aDims.width - bDims.width;
          } else {
            comparison = aDims.height - bDims.height;
          }
          break;

        default:
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortDirection === SortDirection.ASC ? comparison : -comparison;
    });

    return groupArray;
  }, [paginatedAssets, sortType, sortDirection, getSortCategory]);

  // Memoize rendered assets to prevent unnecessary re-renders
  const renderedAssets = useMemo(
    () =>
      groupedAssets.map(({ category, assets }) => (
        <div key={category} className="asset-group">
          <div className="sticky top-24 z-10 mb-2 border-b border-b-slate-300 bg-slate-500/60 px-2 py-1 text-sm text-white backdrop-blur-md">
            {category}
          </div>
          {assets.map((asset) => {
            // Calculate the filtered index based on current page and position in filtered results
            const start =
              (currentPage - 1) * (paginationSize === -1 ? 0 : paginationSize);
            const filteredIndex = start + asset.paginatedIndex + 1; // 1-based index for display

            return (
              <Asset
                key={asset.fileId}
                assetId={asset.fileId}
                assetNumber={asset.originalIndex}
                filteredIndex={filteredIndex}
                fileExtension={asset.fileExtension}
                dimensions={asset.dimensions}
                bucket={asset.bucket}
                ioState={asset.ioState}
                lastModified={asset.lastModified}
              />
            );
          })}
        </div>
      )),
    [groupedAssets, currentPage, paginationSize],
  );

  return filteredAssets.length ? (
    renderedAssets
  ) : (
    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
      <CubeTransparentIcon className="h-24 w-24" />
      <h1 className="mt-4 mb-4 w-full text-xl">
        No results match your filters
      </h1>
    </div>
  );
};
