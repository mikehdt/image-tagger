import { BookmarkCheckIcon, BookmarkMinusIcon } from 'lucide-react';

import {
  resetAllModifiedTags,
  saveAllAssets,
  selectHasModifiedAssets,
} from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectProjectFolderName } from '@/app/store/project';

import { Button } from '@/app/components/shared/button';

export const IoActions = ({ ioInProgress }: { ioInProgress: boolean }) => {
  const dispatch = useAppDispatch();

  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);
  const projectFolderName = useAppSelector(selectProjectFolderName);

  const saveAllChanges = () => {
    dispatch(saveAllAssets({ projectPath: projectFolderName || undefined }));
  };
  const cancelAllChanges = () => dispatch(resetAllModifiedTags());

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
