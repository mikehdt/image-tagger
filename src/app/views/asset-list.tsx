'use client';

import { Asset } from '../components/asset';
import { TopShelf } from '../components/top-shelf';
import { useAppSelector } from '../store/hooks';
import { type ImageAsset, selectImages } from '../store/slice-assets';
import { selectFilterTags, selectFilterTagsMode } from '../store/slice-filters';

export const AssetList = () => {
  const imageAssets = useAppSelector(selectImages);
  const filterTags = useAppSelector(selectFilterTags);
  const includeFilterMode = useAppSelector(selectFilterTagsMode);

  const filteredImageAssets = imageAssets.filter((img: ImageAsset) => {
    const tagNames = img.tags.map((tag) => tag.name);

    return (
      filterTags.length === 0 ||
      includeFilterMode === 'ShowAll' ||
      (includeFilterMode === 'FilterAll' &&
        filterTags.every((r) => tagNames.includes(r))) ||
      (includeFilterMode === 'FilterAny' &&
        filterTags.some((r) => tagNames.includes(r)))
    );
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
