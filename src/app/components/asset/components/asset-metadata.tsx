import { useMemo } from 'react';

import { IoState, selectSaveProgress } from '../../../store/assets';
import { useAppSelector } from '../../../store/hooks';
import { useAssetTags } from '../hooks';

type AssetMetadataProps = {
  assetId: string;
  fileExtension: string;
  dimensions: { width: number; height: number };
  dimensionsActive: boolean;
  extensionActive: boolean;
  ioState: IoState;
  dimensionsComposed: string;
};

export const AssetMetadata = ({
  assetId,
  fileExtension,
  dimensions,
  dimensionsActive,
  extensionActive,
  ioState,
  dimensionsComposed,
}: AssetMetadataProps) => {
  const {
    tagList,
    tagsByStatus,
    toggleSize,
    toggleExtension,
    saveAction,
    cancelAction,
  } = useAssetTags(assetId);

  const saveProgress = useAppSelector(selectSaveProgress);

  // Disable buttons when either individual asset is saving or a batch save is in progress
  const isBatchSaveInProgress =
    saveProgress &&
    saveProgress.total > 0 &&
    saveProgress.completed < saveProgress.total;

  const isSaving = ioState === IoState.SAVING || isBatchSaveInProgress;

  // Memoize this calculation to prevent unnecessary re-renders
  const showActions = useMemo(
    () =>
      tagList.length &&
      tagList.some((tagName: string) => tagsByStatus[tagName] !== 0) && // TagState.SAVED is 0
      ioState !== IoState.SAVING,
    [tagList, tagsByStatus, ioState],
  );

  return (
    <div className="flex w-full items-center border-t border-t-slate-300 bg-slate-100 px-2 py-1 text-sm">
      <span className="inline-flex min-w-0 flex-wrap items-center py-0.5 tabular-nums">
        <button
          type="button"
          className={`mr-2 cursor-pointer rounded-sm border border-sky-300 max-sm:order-2 ${dimensionsActive ? 'bg-sky-300 hover:bg-sky-400' : 'bg-sky-100 hover:bg-sky-200'} px-2 py-0.5`}
          onClick={() => toggleSize(dimensionsComposed)}
        >
          {dimensions.width}&times;{dimensions.height}
        </button>

        <button
          type="button"
          className={`mr-2 cursor-pointer rounded-sm border border-stone-300 max-sm:order-2 ${extensionActive ? 'bg-stone-300 hover:bg-stone-400' : 'bg-stone-100 hover:bg-stone-200'} px-2 py-0.5`}
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

      {showActions ? (
        <span className="ml-auto flex pl-2">
          <button
            className={`${isSaving ? 'cursor-not-allowed' : 'cursor-pointer'} rounded-sm bg-slate-200 px-4 py-1 ${isSaving ? 'opacity-50' : 'hover:bg-slate-400'}`}
            onClick={isSaving ? undefined : cancelAction}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className={`ml-2 ${isSaving ? 'cursor-not-allowed' : 'cursor-pointer'} rounded-sm bg-emerald-200 px-4 py-1 ${isSaving ? 'opacity-50' : 'hover:bg-emerald-400'}`}
            onClick={isSaving ? undefined : saveAction}
            disabled={isSaving}
          >
            Save
          </button>
        </span>
      ) : null}
    </div>
  );
};
