// Selectors for assets slice
import { createSelector } from '@reduxjs/toolkit';

import { composeDimensions } from '../../utils/helpers';
import { ImageAsset, ImageAssets, KeyedCountList, TagState } from './types';

// Basic selectors
export const selectIoState = (state: { assets: ImageAssets }) => {
  return state.assets.ioState;
};

export const selectAllImages = (state: { assets: ImageAssets }) => {
  return state.assets.images;
};

export const selectImageCount = (state: { assets: ImageAssets }) => {
  return state.assets.images.length;
};

export const selectTagsByStatus = (
  state: { assets: ImageAssets },
  fileId: string,
) => {
  const selectedImage = state.assets.images.find(
    (item) => item.fileId === fileId,
  );
  return selectedImage?.tagStatus || {};
};

// Derived selectors
export const selectOrderedTagsWithStatus = createSelector(
  // Input selectors
  [
    (state: { assets: ImageAssets }) => state.assets.images,
    (_, fileId: string) => fileId,
  ],
  // Result function
  (images, fileId) => {
    const selectedImage = images.find(
      (item: { fileId: string }) => item.fileId === fileId,
    );

    if (!selectedImage) return [];

    // Create an array of objects with tag name and status
    // This preserves the order from tagList
    return selectedImage.tagList.map((tagName: string) => ({
      name: tagName,
      status: selectedImage.tagStatus[tagName] || TagState.SAVED,
    }));
  },
);

export const selectImageSizes = createSelector(
  [(state: { assets: ImageAssets }) => state.assets.images],
  (images) => {
    if (!images.length) return {};

    // Group by dimension
    const dimensionGroups: Record<string, ImageAsset[]> = {};
    for (const item of images) {
      const dimension = composeDimensions(item.dimensions);
      dimensionGroups[dimension] = dimensionGroups[dimension] || [];
      dimensionGroups[dimension].push(item);
    }

    // Create count map
    return Object.fromEntries(
      Object.entries(dimensionGroups).map(([dim, assets]) => [
        dim,
        assets.length,
      ]),
    );
  },
);

export const selectTagsForAsset = (
  state: { assets: ImageAssets },
  fileId: string,
) => {
  const selectedImage = state.assets.images.find(
    (item) => item.fileId === fileId,
  );
  return {
    tagStatus: selectedImage?.tagStatus || {},
    tagList: selectedImage?.tagList || [],
  };
};

export const selectAllTags = createSelector(
  [(state: { assets: ImageAssets }) => state.assets.images],
  (imageAssets) => {
    if (!imageAssets?.length) return {};

    const tagCounts: KeyedCountList = {};

    // Process all images and count tags
    for (const asset of imageAssets) {
      for (const tag of asset.tagList) {
        // Only count tags that aren't marked for deletion
        if (asset.tagStatus[tag] !== TagState.TO_DELETE) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }

    return tagCounts;
  },
);

// Custom selector to check if any assets have modified tags
export const selectHasModifiedAssets = (state: { assets: ImageAssets }) => {
  // Check if any asset has tags that aren't in the SAVED state
  return state.assets.images.some((asset) =>
    asset.tagList.some((tag) => asset.tagStatus[tag] !== TagState.SAVED),
  );
};
