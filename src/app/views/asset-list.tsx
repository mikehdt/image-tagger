'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';

import { Asset } from '../components/asset';
import { useAppSelector } from '../store/hooks';
import { selectAllImages } from '../store/slice-assets';
import {
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
} from '../store/slice-filters';
import { applyFilters } from '../utils/filter-actions';
import { composeDimensions } from '../utils/helpers';
import { TopShelf } from '../views/top-shelf';

export const AssetList = () => {
  const assets = useAppSelector(selectAllImages);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterMode = useAppSelector(selectFilterMode);

  const filteredAssets = applyFilters({
    assets,
    filterTags,
    filterSizes,
    filterMode,
  });

  // const cachedAssets = useMemo(
  //   () =>
  //     filteredAssets.map(({ fileId }: { fileId: string }, idx) => (
  //       <Asset key={`${idx}-${fileId}`} assetId={fileId} index={idx} />
  //     )),
  //   [filteredAssets],
  // );

  return (
    <>
      <TopShelf />

      {filteredAssets.length ? (
        filteredAssets.map(({ fileId, fileExtension, dimensions }) => (
          <Asset
            key={fileId}
            assetId={fileId}
            fileExtension={fileExtension}
            dimensionsActive={filterSizes.includes(
              composeDimensions(dimensions),
            )}
            dimensions={dimensions}
          />
        ))
      ) : (
        <div>
          <p>
            <CubeTransparentIcon />
          </p>
          <h1 className="mt-4 mb-4 w-full text-xl">No results</h1>
        </div>
      )}
    </>
  );
};
