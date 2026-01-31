import { NoSymbolIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';

import { Button } from '@/app/components/shared/button';
import {
  selectSortType,
  setSortDirection,
  setSortType,
  SortDirection,
  SortType,
} from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  clearSelection,
  selectSelectedAssetsCount,
} from '@/app/store/selection';

export const ClearSelectionButton = () => {
  const dispatch = useAppDispatch();

  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const sortType = useAppSelector(selectSortType);

  const handleClearSelection = useCallback(() => {
    dispatch(clearSelection());
    // If currently sorted by "Selected", switch back to "Name" when clearing selection
    if (sortType === SortType.SELECTED) {
      dispatch(setSortType(SortType.NAME));
      dispatch(setSortDirection(SortDirection.ASC));
    }
  }, [dispatch, sortType]);

  return (
    <Button
      type="button"
      onClick={handleClearSelection}
      disabled={selectedAssetsCount === 0}
      variant="ghost"
      color="slate"
      size="medium"
      title="Clear selection"
    >
      <NoSymbolIcon className="w-4" />
    </Button>
  );
};
