import {
  ArchiveBoxIcon,
  BookmarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback } from 'react';

import type { RootState } from '@/app/store';
import {
  IoState,
  KohyaBucket,
  resetTags,
  saveAsset,
  selectAssetHasModifiedTags,
  selectSaveProgress,
} from '@/app/store/assets';
import {
  toggleBucketFilter,
  toggleExtensionFilter,
  toggleSizeFilter,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { highlightPatterns } from '@/app/utils/text-highlight';

import { Button } from '../../shared/button';
import { useToast } from '../../shared/toast';

// Individual selectors for metadata - avoids creating new object references
const selectFilenamePatterns = (state: RootState) =>
  state.filters.filenamePatterns;
const selectProjectPath = (state: RootState) => state.project.info.projectPath;
const selectFilterSizes = (state: RootState) => state.filters.filterSizes;
const selectFilterBuckets = (state: RootState) => state.filters.filterBuckets;
const selectFilterExtensions = (state: RootState) =>
  state.filters.filterExtensions;

type AssetMetadataProps = {
  assetId: string;
  fileExtension: string;
  dimensions: { width: number; height: number };
  bucket: KohyaBucket;
  ioState: IoState;
  dimensionsComposed: string;
  isTagEditing?: boolean; // True when either editing or adding a tag
};

const AssetMetadataComponent = ({
  assetId,
  fileExtension,
  dimensions,
  bucket,
  ioState,
  dimensionsComposed,
  isTagEditing = false,
}: AssetMetadataProps) => {
  const dispatch = useAppDispatch();

  // Individual selector calls - each only triggers re-render when its specific value changes
  const filenamePatterns = useAppSelector(selectFilenamePatterns);
  const projectPath = useAppSelector(selectProjectPath);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterBuckets = useAppSelector(selectFilterBuckets);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const saveProgress = useAppSelector(selectSaveProgress);

  // Use optimised selector - only re-renders when THIS asset's modified state changes
  const hasModifiedTags =
    useAppSelector((state) => selectAssetHasModifiedTags(state, assetId)) &&
    ioState !== IoState.SAVING;

  const { showToast } = useToast();

  // Calculate pressed states based on filter arrays
  const dimensionsActive = filterSizes.includes(dimensionsComposed);
  const bucketComposed = `${bucket.width}×${bucket.height}`;
  const bucketActive = filterBuckets.includes(bucketComposed);
  const extensionActive = filterExtensions.includes(fileExtension);

  // Disable buttons when either individual asset is saving, a batch save is in progress, or a tag operation is in progress
  const isBatchSaveInProgress =
    saveProgress &&
    saveProgress.total > 0 &&
    saveProgress.completed < saveProgress.total;

  const isSaving =
    ioState === IoState.SAVING || isBatchSaveInProgress || isTagEditing;

  const handleToggleSize = useCallback(
    () => dispatch(toggleSizeFilter(dimensionsComposed)),
    [dispatch, dimensionsComposed],
  );

  const handleToggleBucket = useCallback(
    () => dispatch(toggleBucketFilter(bucketComposed)),
    [dispatch, bucketComposed],
  );

  const handleToggleExtension = useCallback(
    () => dispatch(toggleExtensionFilter(fileExtension)),
    [dispatch, fileExtension],
  );

  const handleCopyAssetPath = useCallback(async () => {
    if (!projectPath) return;

    // Determine the correct path separator based on the project path
    const separator = projectPath.includes('\\') ? '\\' : '/';
    const fullPath = `${projectPath}${separator}${assetId}.${fileExtension}`;

    try {
      await navigator.clipboard.writeText(fullPath);
      showToast('File path copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      showToast('Failed to copy file path');
    }
  }, [projectPath, assetId, fileExtension, showToast]);

  const handleCancelAction = useCallback(() => {
    // Extra guard to prevent clicking during tag editing
    if (isTagEditing || isSaving) {
      return;
    }
    dispatch(resetTags(assetId));
  }, [dispatch, assetId, isSaving, isTagEditing]);

  const handleSaveAction = useCallback(() => {
    // Extra guard to prevent clicking during tag editing
    if (isTagEditing || isSaving) {
      return;
    }
    const selectedProject = sessionStorage.getItem('selectedProject');
    dispatch(
      saveAsset({
        fileId: assetId,
        projectPath: selectedProject || undefined,
      }),
    );
  }, [dispatch, assetId, isSaving, isTagEditing]);

  return (
    <div
      className={`flex w-full items-end gap-2 border-t px-2 py-1 text-sm inset-shadow-(--surface-elevated) transition-colors ${
        hasModifiedTags
          ? 'border-t-amber-300 bg-amber-100 dark:border-t-amber-600 dark:bg-amber-900'
          : 'border-t-(--border) bg-(--surface)'
      }`}
    >
      <span className="inline-flex min-w-0 flex-wrap items-center gap-2 py-0.5 tabular-nums">
        <Button
          type="button"
          color="sky"
          size="smallWide"
          isPressed={dimensionsActive}
          onClick={handleToggleSize}
          title="Image dimensions"
        >
          <PhotoIcon className="mr-1 w-4" />
          {dimensions.width}&times;{dimensions.height}
        </Button>

        <Button
          type="button"
          color="slate"
          size="smallWide"
          isPressed={bucketActive}
          onClick={handleToggleBucket}
          title="Bucket dimensions"
        >
          <ArchiveBoxIcon className="mr-1 w-4" />
          {bucket.width}&times;{bucket.height}
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

        <span
          className="ml-2 cursor-pointer self-center overflow-hidden overflow-ellipsis text-(--unselected-text) transition-colors hover:text-(--foreground) max-sm:order-1 max-sm:w-full max-sm:pt-2"
          style={{ textShadow: 'var(--surface-elevated) 0 1px 0' }}
          onClick={handleCopyAssetPath}
          title="Click to copy full file path"
        >
          {highlightPatterns(assetId, filenamePatterns)}
        </span>
      </span>

      {hasModifiedTags ? (
        <span className="ml-auto flex gap-2 pl-2">
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
            color="teal"
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

export const AssetMetadata = memo(AssetMetadataComponent);
