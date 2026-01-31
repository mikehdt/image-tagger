import { SquaresPlusIcon } from '@heroicons/react/24/outline';
import { useCallback, useMemo } from 'react';

import { Button } from '@/app/components/shared/button';
import { selectFilteredAssets, selectImageCount } from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectMultipleAssets,
  selectSelectedAssets,
} from '@/app/store/selection';

export const SelectAllButton = () => {
  const dispatch = useAppDispatch();

  const selectedAssets = useAppSelector(selectSelectedAssets);
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const allAssetsCount = useAppSelector(selectImageCount);

  // Check if all currently filtered assets are selected
  const allFilteredAssetsSelected = useMemo(() => {
    if (filteredAssets.length === 0) return true;
    return filteredAssets.every((asset) =>
      selectedAssets.includes(asset.fileId),
    );
  }, [filteredAssets, selectedAssets]);

  const handleAddAllToSelection = useCallback(() => {
    const assetIds = filteredAssets.map((asset) => asset.fileId);
    dispatch(selectMultipleAssets(assetIds));
  }, [dispatch, filteredAssets]);

  const isShowingAllAssets = filteredAssets.length === allAssetsCount;

  return (
    <Button
      type="button"
      onClick={handleAddAllToSelection}
      disabled={allFilteredAssetsSelected || filteredAssets.length === 0}
      variant="ghost"
      color="slate"
      size="medium"
      title={
        allFilteredAssetsSelected
          ? 'All filtered assets already selected'
          : isShowingAllAssets
            ? 'Add all assets to selection'
            : 'Add all filtered assets to selection'
      }
    >
      <SquaresPlusIcon className="w-4" />
      <span className="ml-2 max-xl:hidden">
        {isShowingAllAssets ? 'Select All' : 'Filtered'}
      </span>
    </Button>
  );
};
