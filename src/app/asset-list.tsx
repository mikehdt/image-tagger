'use client';

import { SyntheticEvent, useState } from 'react';

import { Asset } from './asset';
import { InitialLoad } from './components/loader';
import { TopShelf } from './components/top-shelf';
import { NoContent } from './no-content';
import { type ImageAsset } from './types/image-asset';
import { LoadState } from './types/load-state';
import { writeTagsToDisk } from './utils/asset-actions';

type AssetListProps = {
  imageAssets: ImageAsset[];
  reloadAssets: () => void;
  patchAssetTags: (imageId: string, newTags: string[]) => void;
  loadState: LoadState;
};

export type TagList = {
  [key: string]: number;
};

export const AssetList = ({
  imageAssets,
  reloadAssets,
  loadState,
  patchAssetTags,
}: AssetListProps) => {
  const [filters, setFilters] = useState<string[]>([]);
  const [includeFilterMode, setFilterMode] = useState<boolean>(false);

  const tagList = imageAssets.reduce((acc: TagList, asset) => {
    const { tags } = asset;

    const newTagCounts: TagList = {};

    tags.map((tag: string) => {
      newTagCounts[tag] = Object.keys(acc).includes(tag) ? acc[tag] + 1 : 1;
    });

    return {
      ...acc,
      ...newTagCounts,
    };
  }, {});

  const toggleFilter = (tag: string) => {
    const newFilters = filters.includes(tag)
      ? filters.filter((i) => i !== tag)
      : [...filters, tag];

    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters([]);
  };

  const toggleFilterMode = (e: SyntheticEvent) => {
    e.preventDefault();

    setFilterMode(!includeFilterMode);
  };

  const doReload = (e: SyntheticEvent) => {
    e.preventDefault();

    reloadAssets();
  };

  const saveTags = async (
    imageId: string,
    addTags: string[],
    deleteTags: string[],
  ): Promise<boolean> => {
    const imageAsset = imageAssets.find((asset) => asset.fileId === imageId);

    if (!imageAsset) {
      console.error("Couldn't find the image asset with ID", imageId);
      return false;
    }

    const consolidatedTags = [...imageAsset.tags, ...addTags].filter(
      (tag) => !deleteTags.includes(tag),
    );

    const consolidatedTagsString = consolidatedTags.join(', ');

    // Optimistically update the assets in the UI ahead of disk I/O
    patchAssetTags(imageId, consolidatedTags);

    const success = await writeTagsToDisk(imageId, consolidatedTagsString);

    if (success) {
      reloadAssets();
      return true;
    } else {
      alert('The tag file was unable to be saved');
      return false;
    }
  };

  return loadState === LoadState.InitialLoad ? (
    <InitialLoad />
  ) : (
    <>
      <TopShelf
        showLoader={imageAssets.length > 0 && loadState === LoadState.Reload}
        filters={filters}
        clearFilters={clearFilters}
        toggleFilterMode={toggleFilterMode}
        includeFilterMode={includeFilterMode}
      />

      {imageAssets.length === 0 && loadState === LoadState.Loaded ? (
        <NoContent doReload={doReload} />
      ) : (
        imageAssets.map((img: ImageAsset) =>
          !includeFilterMode ||
          filters.length === 0 ||
          filters.every((r) => img.tags.includes(r)) ? (
            <Asset
              key={img.fileId}
              img={img}
              filters={filters}
              globalTagList={tagList}
              actions={{ toggleFilter, saveTags }}
            />
          ) : null,
        )
      )}
    </>
  );
};
