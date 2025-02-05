'use client';

import { SyntheticEvent, useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

import { Asset } from './asset';
import { writeTagsToDisk, type ImageAsset } from './asset-actions';
import { LoadState } from './page';

const Loader = () => (
  <svg
    className="aspect-square h-full w-full animate-spin text-green-600"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

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

  return (
    <div className="min-h-screen items-center justify-items-center px-8 py-20 font-[family-name:var(--font-geist-sans)]">
      {loadState === LoadState.InitialLoad ? (
        <div
          className="relative mx-auto w-64"
          style={{ top: 'calc(50vh - 16rem)' }}
        >
          <Loader />
          <h2 className="m-4 text-center">Loading&hellip;</h2>
        </div>
      ) : (
        <>
          <div className="fixed left-0 top-0 z-10 flex h-12 w-full items-center bg-white/80 shadow-md backdrop-blur-md">
            {imageAssets.length > 0 && loadState === LoadState.Reload ? (
              <div className="py-2 pl-8 pr-2">
                <div className="w-8">
                  <Loader />
                </div>
              </div>
            ) : null}
            <div className="ml-auto flex content-center py-2 pl-2 pr-8">
              {filters.length ? (
                <a href="#" onClick={clearFilters}>
                  [tags: {filters.join(', ')}]
                </a>
              ) : null}{' '}
              [image sizes] [show only pending] [
              <a href="#" onClick={toggleFilterMode} className="inline-flex">
                <span className="mr-1 w-6">
                  {includeFilterMode ? <CheckCircleIcon /> : <XCircleIcon />}
                </span>
                Show only filtered
              </a>
              ]
            </div>
          </div>

          {imageAssets.length === 0 && loadState === LoadState.Loaded ? (
            <h1>No assets were found</h1>
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
      )}
    </div>
  );
};
