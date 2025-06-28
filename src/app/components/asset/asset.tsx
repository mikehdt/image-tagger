import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

import { ImageDimensions, IoState } from '../../store/assets';
import { composeDimensions } from '../../utils/helpers';
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

  // Memoize the composed dimensions so it's not recreated on every render
  const dimensionsComposed = useMemo(
    () => composeDimensions(dimensions),
    [dimensions],
  );

  const toggleImageZoom = useCallback(() => {
    setImageZoom((prev) => !prev);
  }, []);

  return (
    <div className="mb-4 flex w-full flex-wrap overflow-hidden rounded-lg rounded-tl-none border border-slate-300">
      <div
        className={`relative flex min-h-40 w-full cursor-pointer items-center justify-center self-stretch bg-slate-300 transition-all ${!imageZoom ? 'md:w-1/4' : 'md:w-3/4'}`}
        onClick={toggleImageZoom}
      >
        <span className="pointer-events-none absolute top-0 left-0 mt-1 ml-1 rounded-full bg-white/80 px-2 text-sm font-medium text-slate-500 tabular-nums opacity-60 shadow-xs text-shadow-sm text-shadow-white">
          {assetNumber}
        </span>

        <Image
          className={`h-auto w-auto object-contain ${!imageZoom && 'max-h-64'}`}
          src={`/assets/${assetId}.${fileExtension}`}
          width={dimensions.width}
          height={dimensions.height}
          alt=""
        />
      </div>

      <div className={`min-h-40 p-4 ${imageZoom ? 'md:w-1/4' : 'md:w-3/4'}`}>
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
  );
};
