import { BookmarkIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

import { Checkbox } from '../../../components/shared/checkbox';
import { IoState, selectSaveProgress } from '../../../store/assets';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectAssetIsSelected,
  toggleAssetSelection,
} from '../../../store/selection';
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
      className={`flex w-full items-center border-t px-2 py-1 text-sm inset-shadow-xs inset-shadow-white transition-colors ${
        isSelected
          ? 'border-t-purple-600 bg-purple-100'
          : hasModifiedTags
            ? 'border-t-amber-300 bg-amber-100'
            : 'border-t-slate-300 bg-slate-100'
      }`}
    >
      <span className="mr-2">
        <Checkbox
          isSelected={isSelected}
          onChange={() => dispatch(toggleAssetSelection(assetId))}
          ariaLabel={`Select asset ${assetId}`}
        />
      </span>

      <span className="inline-flex min-w-0 flex-wrap items-center py-0.5 tabular-nums">
        <button
          type="button"
          className={`mr-2 cursor-pointer rounded-sm border border-sky-300 px-2 py-0.5 inset-shadow-xs inset-shadow-white transition-colors max-sm:order-2 ${dimensionsActive ? 'bg-sky-300 hover:bg-sky-400' : 'bg-sky-100 hover:bg-sky-200'}`}
          onClick={() => toggleSize(dimensionsComposed)}
        >
          {dimensions.width}&times;{dimensions.height}
        </button>

        <button
          type="button"
          className={`mr-2 cursor-pointer rounded-sm border border-stone-300 px-2 py-0.5 inset-shadow-xs inset-shadow-white transition-colors max-sm:order-2 ${extensionActive ? 'bg-stone-300 hover:bg-stone-400' : 'bg-stone-100 hover:bg-stone-200'}`}
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
        <span className="ml-auto flex pl-2">
          <button
            className={`flex rounded-sm bg-stone-200 px-4 py-1 text-stone-800 shadow-xs inset-shadow-xs shadow-stone-400 inset-shadow-white transition-colors ${
              isTagEditing
                ? 'cursor-not-allowed opacity-40' // More faded when editing or adding tags
                : isSaving
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:bg-stone-300'
            }`}
            onClick={(e) => {
              // Extra guard to prevent clicking during tag editing
              if (isTagEditing || isSaving) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              cancelAction();
            }}
            disabled={isTagEditing || isSaving}
            aria-disabled={isTagEditing || isSaving}
            tabIndex={isTagEditing || isSaving ? -1 : undefined}
            title={isTagEditing ? 'Finish tag operation first' : ''}
          >
            Cancel
          </button>

          <button
            className={`ml-2 flex rounded-sm bg-emerald-200 px-4 py-1 text-emerald-800 shadow-xs inset-shadow-xs shadow-emerald-400 inset-shadow-white transition-colors ${
              isTagEditing
                ? 'cursor-not-allowed opacity-40' // More faded when editing or adding tags
                : isSaving
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:bg-emerald-300'
            }`}
            onClick={(e) => {
              // Extra guard to prevent clicking during tag editing
              if (isTagEditing || isSaving) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              saveAction();
            }}
            disabled={isTagEditing || isSaving}
            aria-disabled={isTagEditing || isSaving}
            tabIndex={isTagEditing || isSaving ? -1 : undefined}
            title={isTagEditing ? 'Finish tag operation first' : ''}
          >
            <BookmarkIcon className="mr-1 w-4" />
            Save
          </button>
        </span>
      ) : null}
    </div>
  );
};
