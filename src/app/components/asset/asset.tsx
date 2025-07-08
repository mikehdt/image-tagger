import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

import { ImageDimensions, IoState } from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectAssetIsSelected,
  toggleAssetSelection,
} from '@/app/store/selection';
import { composeDimensions } from '@/app/utils/helpers';

import { Checkbox } from '../shared/checkbox';
import { TaggingManager } from '../tagging/tagging-manager';
import { AssetMetadata } from './components';

type AssetProps = {
  assetId: string;
  fileExtension: string;
  assetNumber: number;
  dimensions: ImageDimensions;
  dimensionsActive: boolean;
  extensionActive: boolean;
  ioState: IoState;
};

export const Asset = ({
  assetId,
  fileExtension,
  assetNumber,
  dimensions,
  dimensionsActive,
  extensionActive,
  ioState,
}: AssetProps) => {
  const [imageZoom, setImageZoom] = useState<boolean>(false);
  // Track if any tag is currently being edited or added
  const [isTagInteracting, setIsTagInteracting] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const isSelected = useAppSelector(selectAssetIsSelected(assetId));

  // Memoize the composed dimensions so it's not recreated on every render
  const dimensionsComposed = useMemo(
    () => composeDimensions(dimensions),
    [dimensions],
  );

  const toggleImageZoom = useCallback(() => {
    setImageZoom((prev) => !prev);
  }, []);

  return (
    <div className="mb-4 flex w-full overflow-hidden rounded-lg border border-slate-300 max-md:flex-col">
      <div
        className={`flex cursor-pointer flex-col justify-between px-1 pt-1 pb-2 inset-shadow-sm inset-shadow-white transition-colors max-md:flex-row max-md:px-2 md:border-r md:border-r-slate-300 ${isSelected ? 'bg-purple-100 text-purple-400' : 'bg-slate-100 text-slate-400'}`}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(toggleAssetSelection(assetId));
        }}
      >
        <Checkbox
          isSelected={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            dispatch(toggleAssetSelection(assetId));
          }}
          ariaLabel={`Select asset ${assetId}`}
        />

        <span className="rounded-full text-sm font-medium tabular-nums select-none text-shadow-white text-shadow-xs md:[writing-mode:sideways-lr]">
          {assetNumber}
        </span>
      </div>

      <div className="flex w-full flex-wrap">
        <div
          className={`relative flex min-h-40 w-full cursor-pointer items-center justify-center self-stretch bg-slate-300 transition-all ${!imageZoom ? 'md:w-1/4' : 'md:w-3/4'}`}
          onClick={toggleImageZoom}
        >
          <Image
            className={`h-auto w-auto object-contain ${!imageZoom && 'max-h-64'}`}
            src={`/assets/${assetId}.${fileExtension}`}
            width={dimensions.width}
            height={dimensions.height}
            alt=""
          />
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
          dimensionsActive={dimensionsActive}
          extensionActive={extensionActive}
          ioState={ioState}
          dimensionsComposed={dimensionsComposed}
          isTagEditing={isTagInteracting}
        />
      </div>
    </div>
  );
};
