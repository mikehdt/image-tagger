import { DiffIcon } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/app/components/shared/button';
import { selectHasModifiedAssets } from '@/app/store/assets';
import { selectShowModified, toggleModifiedFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

export const ModifiedFilterToggle = () => {
  const dispatch = useAppDispatch();

  const filterModifiedActive = useAppSelector(selectShowModified);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);

  const handleToggleModifiedFilter = useCallback(
    () => dispatch(toggleModifiedFilter()),
    [dispatch],
  );

  return (
    <Button
      type="button"
      onClick={handleToggleModifiedFilter}
      variant="deep-toggle"
      isPressed={filterModifiedActive}
      disabled={!hasModifiedAssets}
      ghostDisabled={!hasModifiedAssets}
      size="medium"
    >
      <DiffIcon className="h-4 w-4" />
      <span className="ml-2 max-xl:hidden">Modified</span>
    </Button>
  );
};
