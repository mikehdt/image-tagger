import { BookmarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useMemo } from 'react';

import { IoState, KohyaBucket, selectSaveProgress } from '@/app/store/assets';
import {
  selectFilterExtensions,
  selectFilterSizes,
  selectSearchQuery,
} from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';
import { highlightText } from '@/app/utils/text-highlight';

import { Button } from '../../shared/button';
import { useAssetTags } from '../hooks';

type AssetMetadataProps = {
  assetId: string;
  fileExtension: string;
  dimensions: { width: number; height: number };
  bucket: KohyaBucket;
  ioState: IoState;
  dimensionsComposed: string;
  isTagEditing?: boolean; // True when either editing or adding a tag
};

export const AssetMetadata = ({
  assetId,
  fileExtension,
  dimensions,
  bucket,
  ioState,
  dimensionsComposed,
  isTagEditing = false,
}: AssetMetadataProps) => {
  const searchQuery = useAppSelector(selectSearchQuery);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const {
    tagList,
    tagsByStatus,
    toggleSize,
    toggleExtension,
    saveAction,
    cancelAction,
  } = useAssetTags(assetId);

  const saveProgress = useAppSelector(selectSaveProgress);

  // Calculate pressed states based on filter arrays
  const dimensionsActive = filterSizes.includes(dimensionsComposed);
  const extensionActive = filterExtensions.includes(fileExtension);

  // Disable buttons when either individual asset is saving, a batch save is in progress, or a tag operation is in progress
  const isBatchSaveInProgress =
    saveProgress &&
    saveProgress.total > 0 &&
    saveProgress.completed < saveProgress.total;

  const isSaving =
    ioState === IoState.SAVING || isBatchSaveInProgress || isTagEditing;

  // Memoize this calculation to prevent unnecessary re-renders
  // We want to show the buttons whenever there are modified tags, even during tag editing
  const hasModifiedTags = useMemo(
    () =>
      tagList.length &&
      tagList.some((tagName: string) => tagsByStatus[tagName] !== 0) && // TagState.SAVED is 0
      ioState !== IoState.SAVING,
    [tagList, tagsByStatus, ioState],
  );

  const handleToggleSize = useCallback(
    () => toggleSize(dimensionsComposed),
    [dimensionsComposed, toggleSize],
  );

  const handleToggleExtension = useCallback(
    () => toggleExtension(fileExtension),
    [fileExtension, toggleExtension],
  );

  const handleCancelAction = useCallback(() => {
    // Extra guard to prevent clicking during tag editing
    if (isTagEditing || isSaving) {
      return;
    }
    cancelAction();
  }, [cancelAction, isSaving, isTagEditing]);

  const handleSaveAction = useCallback(() => {
    // Extra guard to prevent clicking during tag editing
    if (isTagEditing || isSaving) {
      return;
    }

    saveAction();
  }, [isSaving, isTagEditing, saveAction]);

  return (
    <div
      className={`flex w-full items-end space-x-2 border-t px-2 py-1 text-sm inset-shadow-xs inset-shadow-white transition-colors ${
        hasModifiedTags
          ? 'border-t-amber-300 bg-amber-100'
          : 'border-t-slate-300 bg-slate-100'
      }`}
    >
      <span className="inline-flex min-w-0 flex-wrap items-center space-x-2 py-0.5 tabular-nums">
        <Button
          type="button"
          color="sky"
          size="smallWide"
          isPressed={dimensionsActive}
          onClick={handleToggleSize}
        >
          {dimensions.width}&times;{dimensions.height}
        </Button>

        <Button
          type="button"
          color="stone"
          size="smallWide"
          isPressed={extensionActive}
          onClick={handleToggleExtension}
        >
          {fileExtension}
        </Button>

        <span>
          Bucket: {bucket.width}×{bucket.height}
        </span>

        <span
          className="cursor-default self-center overflow-hidden overflow-ellipsis text-slate-500 max-sm:order-1 max-sm:w-full max-sm:pt-2"
          style={{ textShadow: 'white 0 1px 0' }}
        >
          {highlightText(assetId, searchQuery)}
        </span>
      </span>

      {hasModifiedTags ? (
        <span className="ml-auto flex space-x-2 pl-2">
          <Button
            color="stone"
            size="medium"
            onClick={handleCancelAction}
            disabled={isTagEditing || isSaving}
            title={isTagEditing ? 'Finish tag operation first' : ''}
          >
            Cancel
          </Button>

          <Button
            color="emerald"
            size="medium"
            onClick={handleSaveAction}
            disabled={isTagEditing || isSaving}
            title={isTagEditing ? 'Finish tag operation first' : ''}
          >
            <BookmarkIcon className="mr-1 w-4" />
            Save
          </Button>
        </span>
      ) : null}
    </div>
  );
};
