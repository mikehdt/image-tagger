import { NoSymbolIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';

import { Button } from '@/app/components/shared/button';
import { clearFilters, selectHasActiveFilters } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

export const ClearFiltersButton = () => {
  const dispatch = useAppDispatch();

  const hasActiveFilters = useAppSelector(selectHasActiveFilters);

  const handleClearFilters = useCallback(
    () => dispatch(clearFilters()),
    [dispatch],
  );

  return (
    <Button
      variant="ghost"
      type="button"
      onClick={handleClearFilters}
      disabled={!hasActiveFilters}
      ghostDisabled={!hasActiveFilters}
      size="medium"
      title="Clear all filters"
    >
      <NoSymbolIcon className="w-4" />
    </Button>
  );
};
