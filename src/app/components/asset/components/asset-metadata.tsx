import { BookmarkIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

import { Checkbox } from '../../../components/shared/checkbox';
import { IoState, selectSaveProgress } from '../../../store/assets';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectAssetIsSelected,
  toggleAssetSelection,
} from '../../../store/selection';
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

      <span className="inline-flex min-w-0 flex-wrap items-center space-x-2 py-0.5 tabular-nums">
        <button
          type="button"
          className={`cursor-pointer rounded-sm border border-sky-300 px-2 py-0.5 inset-shadow-xs inset-shadow-white transition-colors max-sm:order-2 ${dimensionsActive ? 'bg-sky-300 hover:bg-sky-400' : 'bg-sky-100 hover:bg-sky-200'}`}
          onClick={() => toggleSize(dimensionsComposed)}
        >
          {dimensions.width}&times;{dimensions.height}
        </button>

        <button
          type="button"
          className={`cursor-pointer rounded-sm border border-stone-300 px-2 py-0.5 inset-shadow-xs inset-shadow-white transition-colors max-sm:order-2 ${extensionActive ? 'bg-stone-300 hover:bg-stone-400' : 'bg-stone-100 hover:bg-stone-200'}`}
          onClick={() => toggleExtension(fileExtension)}
        >
          {fileExtension}
        </button>

        <span
          className="cursor-default overflow-hidden overflow-ellipsis text-slate-500 max-sm:order-1 max-sm:w-full max-sm:pb-2"
          style={{ textShadow: 'white 0 1px 0' }}
        >
          {assetId}
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
