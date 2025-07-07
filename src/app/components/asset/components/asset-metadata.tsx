import { BookmarkIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

import { Checkbox } from '../../../components/shared/checkbox';
import { IoState, selectSaveProgress } from '../../../store/assets';
import { selectSearchQuery } from '../../../store/filters';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectAssetIsSelected,
  toggleAssetSelection,
} from '../../../store/selection';
import { highlightText } from '../../../utils/text-highlight';
import { Button } from '../../shared/button';
import { useAssetTags } from '../hooks';

type AssetMetadataProps = {
  assetId: string;
  fileExtension: string;
  dimensions: { width: number; height: number };
  dimensionsActive: boolean;
  extensionActive: boolean;
  ioState: IoState;
  dimensionsComposed: string;
  isTagEditing?: boolean; // True when either editing or adding a tag
};

export const AssetMetadata = ({
  assetId,
  fileExtension,
  dimensions,
  dimensionsActive,
  extensionActive,
  ioState,
  dimensionsComposed,
  isTagEditing = false,
}: AssetMetadataProps) => {
  const dispatch = useAppDispatch();
  const isSelected = useAppSelector(selectAssetIsSelected(assetId));
  const searchQuery = useAppSelector(selectSearchQuery);
  const {
    tagList,
    tagsByStatus,
    toggleSize,
    toggleExtension,
    saveAction,
    cancelAction,
  } = useAssetTags(assetId);

  const saveProgress = useAppSelector(selectSaveProgress);

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

  return (
    <div
      className={`flex w-full items-center space-x-2 border-t px-2 py-1 text-sm inset-shadow-xs inset-shadow-white transition-colors ${
        isSelected
          ? 'border-t-purple-600 bg-purple-100'
          : hasModifiedTags
            ? 'border-t-amber-300 bg-amber-100'
            : 'border-t-slate-300 bg-slate-100'
      }`}
    >
      <Checkbox
        isSelected={isSelected}
        onChange={() => dispatch(toggleAssetSelection(assetId))}
        ariaLabel={`Select asset ${assetId}`}
      />

      <span className="ml-2 inline-flex min-w-0 flex-wrap items-center space-x-2 py-0.5 tabular-nums">
        <Button
          type="button"
          color="sky"
          size="smallWide"
          isPressed={dimensionsActive}
          onClick={() => toggleSize(dimensionsComposed)}
        >
          {dimensions.width}&times;{dimensions.height}
        </Button>

        <Button
          type="button"
          color="stone"
          size="smallWide"
          isPressed={extensionActive}
          onClick={() => toggleExtension(fileExtension)}
        >
          {fileExtension}
        </Button>

        <span
          className="cursor-default overflow-hidden overflow-ellipsis text-slate-500 max-sm:order-1 max-sm:w-full max-sm:pb-2"
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
            onClick={() => {
              // Extra guard to prevent clicking during tag editing
              if (isTagEditing || isSaving) {
                return;
              }
              cancelAction();
            }}
            disabled={isTagEditing || isSaving}
            title={isTagEditing ? 'Finish tag operation first' : ''}
          >
            Cancel
          </Button>

          <Button
            color="emerald"
            size="medium"
            onClick={() => {
              // Extra guard to prevent clicking during tag editing
              if (isTagEditing || isSaving) {
                return;
              }

              saveAction();
            }}
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
