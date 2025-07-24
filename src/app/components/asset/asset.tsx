import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import {
  memo,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ImageDimensions, IoState, KohyaBucket } from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectShowCropVisualization } from '@/app/store/project';
import {
  selectAssetIsSelected,
  toggleAssetSelection,
} from '@/app/store/selection';
import { composeDimensions } from '@/app/utils/helpers';
import { getCurrentProjectPath, getImageUrl } from '@/app/utils/image-utils';

import { Button } from '../shared/button';
import { Checkbox } from '../shared/checkbox';
import { TaggingManager } from '../tagging/tagging-manager';
import { AssetMetadata, CropVisualization } from './components';

type AssetProps = {
  assetId: string;
  fileExtension: string;
  assetNumber: number;
  filteredIndex: number;
  dimensions: ImageDimensions;
  bucket: KohyaBucket;
  ioState: IoState;
  lastModified: number;
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
}: AssetProps) => {
  const [imageZoom, setImageZoom] = useState<boolean>(false);
  // Track if any tag is currently being edited or added
  const [isTagInteracting, setIsTagInteracting] = useState<boolean>(false);
  // Local override for crop visualization - resets when global state changes
  const [localCropOverride, setLocalCropOverride] = useState<boolean | null>(
    null,
  );

  const dispatch = useAppDispatch();
  const isSelected = useAppSelector(selectAssetIsSelected(assetId));
  const globalShowCropVisualization = useAppSelector(
    selectShowCropVisualization,
  );

  // Reset local override when global state changes
  useEffect(() => {
    setLocalCropOverride(null);
  }, [globalShowCropVisualization]);

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
    const projectPath = getCurrentProjectPath();
    const fileName = `${assetId}.${fileExtension}`;
    const baseUrl = getImageUrl(fileName, projectPath || undefined);

    // Properly append cache-busting parameter
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${lastModified}`;
  }, [assetId, fileExtension, lastModified]);

  const toggleImageZoom = useCallback(() => {
    setImageZoom((prev) => !prev);
  }, []);

  const onToggleAssetSelection = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      dispatch(toggleAssetSelection(assetId));
    },
    [assetId, dispatch],
  );

  const onToggleLocalCropVisualization = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      setLocalCropOverride((prev) =>
        prev === null ? !globalShowCropVisualization : !prev,
      );
    },
    [globalShowCropVisualization],
  );

  return (
    <div
      className={`mb-4 flex w-full overflow-hidden rounded-lg border transition-shadow max-md:flex-col ${isSelected ? 'border-purple-300 shadow-sm shadow-purple-200' : 'border-slate-300'}`}
    >
      <div
        className={`flex cursor-pointer flex-col justify-between px-1 pt-1 pb-2 inset-shadow-sm inset-shadow-white transition-colors max-md:flex-row max-md:px-2 max-md:pb-1 md:border-r md:border-r-slate-300 ${isSelected ? 'bg-purple-100 text-purple-400' : 'bg-slate-100 text-slate-400'}`}
        onClick={onToggleAssetSelection}
      >
        <Checkbox
          isSelected={isSelected}
          onChange={onToggleAssetSelection}
          ariaLabel={`Select asset ${assetId}`}
        />

        {wouldCrop && (
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
        )}

        <span className="text-sm font-medium tabular-nums select-none text-shadow-white text-shadow-xs md:[writing-mode:sideways-lr]">
          {assetNumber}

          {assetNumber !== filteredIndex ? (
            <span className="mb-4 text-slate-300">{filteredIndex}</span>
          ) : null}
        </span>
      </div>

      <div className="flex w-full flex-wrap">
        <div
          className={`relative flex min-h-40 w-full cursor-pointer items-center justify-center self-stretch bg-slate-300 transition-all ${!imageZoom ? 'md:w-1/4' : 'md:w-3/4'}`}
          onClick={toggleImageZoom}
        >
          <span className="relative object-contain">
            <Image
              className={`h-auto w-auto ${!imageZoom && 'max-h-64'}`}
              src={imageUrl}
              width={dimensions.width}
              height={dimensions.height}
              alt=""
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

export const Asset = memo(AssetComponent);
