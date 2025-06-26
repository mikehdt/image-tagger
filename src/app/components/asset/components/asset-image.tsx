import Image from 'next/image';

import { ImageDimensions } from '../../../store/assets';

type AssetImageProps = {
  assetId: string;
  fileExtension: string;
  assetNumber: number;
  dimensions: ImageDimensions;
  imageZoom: boolean;
};

export const AssetImage = ({
  assetId,
  fileExtension,
  assetNumber,
  dimensions,
  imageZoom,
}: AssetImageProps) => {
  return (
    <div className="relative flex border-r border-r-slate-300 bg-slate-300">
      <span className="pointer-events-none absolute top-0 left-0 mt-1 ml-1 rounded-full bg-white/80 px-2 text-sm font-medium text-slate-500 tabular-nums opacity-60 shadow-xs text-shadow-sm text-shadow-white">
        {assetNumber}
      </span>
      <Image
        className={`${!imageZoom && 'max-h-64'} h-auto w-auto object-contain`}
        src={`/assets/${assetId}.${fileExtension}`}
        width={dimensions.width}
        height={dimensions.height}
        alt=""
      />
    </div>
  );
};
