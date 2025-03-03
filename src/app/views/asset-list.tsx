'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';

import { Asset } from '../components/asset';
import { useAppSelector } from '../store/hooks';
import { type ImageAsset, selectImages } from '../store/slice-assets';
import {
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
} from '../store/slice-filters';
import { TopShelf } from '../views/top-shelf';

export const AssetList = () => {
  const imageAssets = useAppSelector(selectImages);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const includeFilterMode = useAppSelector(selectFilterMode);

  // I think this may be an _expensive_ operation
  const filteredImageAssets =
    (filterTags.length === 0 && filterSizes.length === 0) ||
    includeFilterMode === 'ShowAll'
      ? imageAssets
      : imageAssets.filter((img: ImageAsset) => {
          const tagNames = img.tags.map((tag) => tag.name);

          const filteredSizes = filterSizes.includes(img.dimensions.composed);

          switch (includeFilterMode) {
            case 'FilterAll':
              const filteredTags = filterTags.every((r) =>
                tagNames.includes(r),
              );

              if (filterTags.length && filterSizes.length) {
                return filteredTags && filteredSizes;
              } else if (filterTags.length) {
                return filteredTags;
              } else if (filterSizes.length) {
                return filteredSizes;
              }

              return true;

            case 'FilterAny':
              return (
                filterTags.some((r) => tagNames.includes(r)) || filteredSizes
              );

            default:
              console.error('Unknown filter mode');
          }
        });

  return (
    <>
      <TopShelf />

      {filteredImageAssets.length ? (
        filteredImageAssets.map((asset: ImageAsset, idx) => (
          <Asset key={`${idx}-${asset.fileId}`} asset={asset} index={idx} />
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
