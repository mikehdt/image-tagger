import {
  BookmarkCheckIcon,
  BookmarkMinusIcon,
} from 'lucide-react';

import {
  resetAllTags,
  saveAllAssets,
  selectHasModifiedAssets,
} from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

import { Button } from '../../shared/button';

export const IoActions = ({ ioInProgress }: { ioInProgress: boolean }) => {
  const dispatch = useAppDispatch();

  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);

  const saveAllChanges = () => {
    const selectedProject = sessionStorage.getItem('selectedProject');
    dispatch(saveAllAssets({ projectPath: selectedProject || undefined }));
  };
  const cancelAllChanges = () => dispatch(resetAllTags());

  return (
    <>
      <Button
        type="button"
        size="medium"
        ghostDisabled
        onClick={cancelAllChanges}
        disabled={!hasModifiedAssets || ioInProgress}
        title={
          hasModifiedAssets ? 'Cancel all tag changes' : 'No changes to cancel'
        }
      >
        <BookmarkMinusIcon className="h-4 w-4" />
        <span className="ml-1 max-lg:hidden">Cancel All</span>
      </Button>

      <Button
        type="button"
        size="medium"
        color="teal"
        ghostDisabled
        neutralDisabled
        onClick={saveAllChanges}
        disabled={!hasModifiedAssets || ioInProgress}
        title={
          hasModifiedAssets ? 'Save all tag changes' : 'No changes to save'
        }
      >
        <BookmarkCheckIcon className="h-4 w-4" />
        <span className="ml-1 max-lg:hidden">Save All</span>
      </Button>
    </>
  );
};
