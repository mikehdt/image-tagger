import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { memo, MouseEvent, useCallback, useMemo, useState } from 'react';

import { ImageDimensions, IoState, KohyaBucket } from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectShowCropVisualization } from '@/app/store/project';
import { handleAssetClick, selectAssetIsSelected } from '@/app/store/selection';
import { composeDimensions, getAspectRatio } from '@/app/utils/helpers';
import { getCurrentProjectName, getImageUrl } from '@/app/utils/image-utils';

import { Button } from '../shared/button';
import { Checkbox } from '../shared/checkbox';
import { TaggingManager } from '../tagging-v2';
import { AssetMetadata, CropVisualization } from './components';

type PreviewState = 'select' | 'deselect' | null;

type AssetProps = {
  assetId: string;
  fileExtension: string;
  assetNumber: number;
  filteredIndex: number;
  dimensions: ImageDimensions;
  bucket: KohyaBucket;
  ioState: IoState;
  lastModified: number;
  currentPage: number;
  // Shift-hover preview state
  previewState?: PreviewState;
  onHover?: (assetId: string | null) => void;
};

const AssetComponent = ({
  assetId,
  fileExtension,
  assetNumber,
  filteredIndex,
  dimensions,
  bucket,
  ioState,
  lastModified,
  currentPage,
  previewState,
  onHover,
}: AssetProps) => {
  const [imageZoom, setImageZoom] = useState<boolean>(false);
  // Track if any tag is currently being edited or added
  const [isTagInteracting, setIsTagInteracting] = useState<boolean>(false);
  // Local override for crop visualization - resets when global state changes
  const [localCropOverride, setLocalCropOverride] = useState<boolean | null>(
    null,
  );
  // Track the last global value to detect changes
  const [lastGlobalValue, setLastGlobalValue] = useState<boolean | null>(null);

  const dispatch = useAppDispatch();
  const isSelected = useAppSelector((state) =>
    selectAssetIsSelected(state, assetId),
  );
  const globalShowCropVisualization = useAppSelector(
    selectShowCropVisualization,
  );

  // Reset local override when global state changes (derived state pattern)
  if (globalShowCropVisualization !== lastGlobalValue) {
    setLastGlobalValue(globalShowCropVisualization);
    if (localCropOverride !== null) {
      setLocalCropOverride(null);
    }
  }

  // Determine effective crop visualization state (local override takes precedence)
  const showCropVisualization =
    localCropOverride ?? globalShowCropVisualization;

  // Determine if cropping would occur (when aspect ratios don't match)
  const imageAspectRatio = dimensions.width / dimensions.height;
  const bucketAspectRatio = bucket.width / bucket.height;
  const wouldCrop = Math.abs(imageAspectRatio - bucketAspectRatio) > 0;

  // Memoize the composed dimensions so it's not recreated on every render
  const dimensionsComposed = useMemo(
    () => composeDimensions(dimensions),
    [dimensions],
  );

  // Get the image URL for the current project with cache busting
  const imageUrl = useMemo(() => {
    const projectName = getCurrentProjectName();
    const fileName = `${assetId}.${fileExtension}`;
    const baseUrl = getImageUrl(fileName, projectName || undefined);

    // Properly append cache-busting parameter
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${lastModified}`;
  }, [assetId, fileExtension, lastModified]);

  const toggleImageZoom = useCallback(() => {
    setImageZoom((prev) => !prev);
  }, []);

  const onToggleAssetSelection = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      // Prevent text selection when shift+clicking
      if (e.shiftKey) {
        e.preventDefault();
      }
      dispatch(
        handleAssetClick({
          assetId,
          isShiftHeld: e.shiftKey,
          currentPage,
        }),
      );
    },
    [assetId, currentPage, dispatch],
  );

  const onToggleLocalCropVisualization = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      setLocalCropOverride((prev) =>
        prev === null ? !globalShowCropVisualization : !prev,
      );
    },
    [globalShowCropVisualization],
  );

  // Hover handlers for shift-hover preview
  const handleMouseEnter = useCallback(() => {
    onHover?.(assetId);
  }, [onHover, assetId]);

  const handleMouseLeave = useCallback(() => {
    onHover?.(null);
  }, [onHover]);

  // Determine visual state: preview overrides actual selection for display
  // previewState 'select' means "would become selected" (show as selected)
  // previewState 'deselect' means "would become deselected" (show as deselected)
  const showAsSelected =
    previewState === 'select' ? true : previewState === 'deselect' ? false : isSelected;
  const isPreview = previewState !== null && previewState !== undefined;

  // Build class names for the selection panel
  const selectionPanelClasses = `flex cursor-pointer select-none flex-col justify-between px-1 pt-1 pb-2 inset-shadow-sm inset-shadow-white transition-colors max-md:flex-row max-md:px-2 max-md:pb-1 md:border-r md:border-r-slate-300 ${
    showAsSelected
      ? isPreview
        ? 'bg-purple-50 text-purple-300' // Lighter purple for preview-select
        : 'bg-purple-100 text-purple-400' // Normal selected
      : isPreview
        ? 'bg-slate-50 text-slate-300' // Lighter grey for preview-deselect
        : 'bg-slate-100 text-slate-400' // Normal unselected
  }`;

  return (
    <div
      className={`my-2 flex w-full overflow-hidden rounded-lg border transition-shadow max-md:flex-col ${isSelected ? 'border-purple-300 shadow-sm shadow-purple-200' : 'border-slate-300'}`}
    >
      <div
        className={selectionPanelClasses}
        onClick={onToggleAssetSelection}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Checkbox
          isSelected={isSelected}
          onChange={onToggleAssetSelection}
          ariaLabel={`Select asset ${assetId}`}
          previewState={previewState}
        />

        {wouldCrop ? (
          <Button
            size="minimum"
            variant="ghost"
            color={isSelected ? 'indigo' : 'slate'}
            isPressed={showCropVisualization}
            onClick={onToggleLocalCropVisualization}
            title={`${showCropVisualization ? 'Hide' : 'Show'} crop visualization for this asset`}
          >
            {showCropVisualization ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <EyeIcon
            className="h-4 w-4 self-center opacity-50"
            title="Image shape and crop shape are identical"
          />
        )}

        <span className="text-sm font-medium tabular-nums select-none text-shadow-white text-shadow-xs md:[writing-mode:sideways-lr]">
          {filteredIndex}

          {assetNumber !== filteredIndex ? (
            <span className="mb-4 text-slate-300">{assetNumber}</span>
          ) : null}
        </span>
      </div>

      <div className="flex w-full flex-wrap">
        <div
          className={`relative flex min-h-40 w-full cursor-pointer items-center justify-center self-stretch bg-slate-300 transition-all ${!imageZoom ? 'md:w-1/4' : 'md:w-3/4'}`}
          onClick={toggleImageZoom}
        >
          <span className="relative">
            <Image
              className={`w-auto object-contain ${!imageZoom && 'max-h-64'}`}
              src={imageUrl}
              width={dimensions.width}
              height={dimensions.height}
              style={{
                aspectRatio: getAspectRatio(
                  dimensions.width,
                  dimensions.height,
                ).join('/'),
              }}
              alt=""
              priority={filteredIndex <= 4}
            />
            <CropVisualization
              dimensions={dimensions}
              bucket={bucket}
              isVisible={showCropVisualization}
            />
          </span>
        </div>

        <div
          className={`min-h-40 p-4 max-md:p-2 ${imageZoom ? 'md:w-1/4' : 'md:w-3/4'}`}
        >
          <TaggingManager
            assetId={assetId}
            onTagEditingChange={setIsTagInteracting}
          />
        </div>

        <AssetMetadata
          assetId={assetId}
          fileExtension={fileExtension}
          dimensions={dimensions}
          bucket={bucket}
          ioState={ioState}
          dimensionsComposed={dimensionsComposed}
          isTagEditing={isTagInteracting}
        />
      </div>
    </div>
  );
};

// Custom comparison function for memo to avoid re-renders when object props have same values
const assetPropsAreEqual = (
  prevProps: AssetProps,
  nextProps: AssetProps,
): boolean => {
  // Check primitive props
  if (
    prevProps.assetId !== nextProps.assetId ||
    prevProps.fileExtension !== nextProps.fileExtension ||
    prevProps.assetNumber !== nextProps.assetNumber ||
    prevProps.filteredIndex !== nextProps.filteredIndex ||
    prevProps.ioState !== nextProps.ioState ||
    prevProps.lastModified !== nextProps.lastModified ||
    prevProps.currentPage !== nextProps.currentPage ||
    prevProps.previewState !== nextProps.previewState ||
    prevProps.onHover !== nextProps.onHover
  ) {
    return false;
  }

  // Check dimensions object
  if (
    prevProps.dimensions.width !== nextProps.dimensions.width ||
    prevProps.dimensions.height !== nextProps.dimensions.height
  ) {
    return false;
  }

  // Check bucket object
  if (
    prevProps.bucket.width !== nextProps.bucket.width ||
    prevProps.bucket.height !== nextProps.bucket.height ||
    prevProps.bucket.aspectRatio !== nextProps.bucket.aspectRatio
  ) {
    return false;
  }

  return true;
};

export const Asset = memo(AssetComponent, assetPropsAreEqual);
