'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

import { Asset } from '../components/asset/asset';
import { selectFilteredAssets } from '../store/assets';
import { selectPaginationSize } from '../store/filters';
import { useAppSelector } from '../store/hooks';

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

  // Memoize rendered assets to prevent unnecessary re-renders
  const renderedAssets = useMemo(
    () =>
      paginatedAssets.map(
        (
          { fileId, fileExtension, dimensions, ioState, originalIndex },
          index,
        ) => {
          // Calculate the filtered index based on current page and position in filtered results
          const start =
            (currentPage - 1) * (paginationSize === -1 ? 0 : paginationSize);
          const filteredIndex = start + index + 1; // 1-based index for display

          return (
            <Asset
              key={fileId}
              assetId={fileId}
              assetNumber={originalIndex}
              filteredIndex={filteredIndex}
              fileExtension={fileExtension}
              dimensions={dimensions}
              ioState={ioState}
            />
          );
        },
      ),
    [paginatedAssets, currentPage, paginationSize],
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
