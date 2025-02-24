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

  // const saveTags = async (
  //   imageId: string,
  //   addTags: string[],
  //   deleteTags: string[],
  // ): Promise<boolean> => {
  //   const imageAsset = imageAssets.find((asset) => asset.fileId === imageId);

  //   if (!imageAsset) {
  //     console.error("Couldn't find the image asset with ID", imageId);
  //     return false;
  //   }

  //   const consolidatedTags = [...imageAsset.tags, ...addTags].filter(
  //     (tag) => !deleteTags.includes(tag),
  //   );

  //   const consolidatedTagsString = consolidatedTags.join(', ');

  //   // Optimistically update the assets in the UI ahead of disk I/O
  //   patchAssetTags(imageId, consolidatedTags);

  //   const success = await writeTagsToDisk(imageId, consolidatedTagsString);

  //   if (success) {
  //     reloadAssets();
  //     return true;
  //   } else {
  //     alert('The tag file was unable to be saved');
  //     return false;
  //   }
  // };

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
