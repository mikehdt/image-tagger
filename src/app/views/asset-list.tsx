'use client';

import { Asset } from '../components/asset';
import { TopShelf } from '../components/top-shelf';
import { useAppSelector } from '../store/hooks';
import { type ImageAsset, selectImages } from '../store/slice-assets';
import {
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
} from '../store/slice-filters';

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
        filteredImageAssets.map((asset: ImageAsset) => (
          <Asset key={asset.fileId} asset={asset} />
        ))
      ) : (
        <div>No results</div>
      )}
    </>
  );
};
