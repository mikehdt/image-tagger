import { FunnelXIcon } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/app/components/shared/button';
import {
  clearFilters,
  selectHasActiveFilters,
  selectHasActiveVisibility,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

export const ClearFiltersButton = () => {
  const dispatch = useAppDispatch();

  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const hasActiveVisibility = useAppSelector(selectHasActiveVisibility);
  const canClear = hasActiveFilters || hasActiveVisibility;

  const handleClearFilters = useCallback(
    () => dispatch(clearFilters()),
    [dispatch],
  );

  return (
    <Button
      variant="ghost"
      type="button"
      onClick={handleClearFilters}
      disabled={!canClear}
      ghostDisabled={!canClear}
      size="md"
      title="Clear all filters"
    >
      <FunnelXIcon className="h-4 w-4" />
    </Button>
  );
};
