import { useCallback, useMemo, useState } from 'react';

import { ImageDimensions, IoState } from '../../store/assets';
import { composeDimensions } from '../../utils/helpers';
import { AssetImage } from './components/asset-image';
import { AssetMetadata } from './components/asset-metadata';
import { AssetTags } from './components/asset-tags';

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

  // Memoize the composed dimensions so it's not recreated on every render
  const dimensionsComposed = useMemo(
    () => composeDimensions(dimensions),
    [dimensions],
  );

  const toggleImageZoom = useCallback(() => {
    setImageZoom((prev) => !prev);
  }, []);

  return (
    <div className="mb-4 flex w-full flex-wrap overflow-hidden rounded-b-lg border border-slate-300">
      <div
        className={`flex w-full items-center justify-center ${!imageZoom ? 'md:w-1/4' : 'md:w-3/4'} cursor-pointer self-stretch bg-slate-300 transition-all`}
        onClick={toggleImageZoom}
      >
        <AssetImage
          assetId={assetId}
          fileExtension={fileExtension}
          assetNumber={assetNumber}
          dimensions={dimensions}
          imageZoom={imageZoom}
        />
      </div>

      <div className={`${imageZoom ? 'md:w-1/4' : 'md:w-3/4'} p-4`}>
        <AssetTags assetId={assetId} />
      </div>

      <AssetMetadata
        assetId={assetId}
        fileExtension={fileExtension}
        dimensions={dimensions}
        dimensionsActive={dimensionsActive}
        extensionActive={extensionActive}
        ioState={ioState}
        dimensionsComposed={dimensionsComposed}
      />
    </div>
  );
};
