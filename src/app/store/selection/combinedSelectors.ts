import { createSelector } from '@reduxjs/toolkit';

import { selectAllImages } from '../assets';
import { selectFilterTags } from '../filters';
import { selectSelectedAssets } from '../selection';

/**
 * Returns information about duplicates in selected assets
 * @returns An object with information about tag duplication status
 */
export const selectDuplicateTagInfo = (tagName: string) =>
  createSelector(
    [selectSelectedAssets, selectAllImages],
    (selectedAssets, allImages) => {
      if (!tagName || selectedAssets.length === 0) {
        return {
          isDuplicate: false,
          duplicateCount: 0,
          totalSelected: selectedAssets.length,
          isAllDuplicates: false,
        };
      }

      // Find all selected assets in the assets slice
      const selectedImagesData = allImages.filter((img) =>
        selectedAssets.includes(img.fileId),
      );

      // Count how many assets already have this tag
      const duplicateCount = selectedImagesData.filter((img) =>
        img.tagList.includes(tagName),
      ).length;

      return {
        isDuplicate: duplicateCount > 0,
        duplicateCount,
        totalSelected: selectedImagesData.length,
        isAllDuplicates:
          duplicateCount === selectedImagesData.length && duplicateCount > 0,
      };
    },
  );

/**
 * Checks if two tags co-exist in the same assets
 * This is useful to determine if renaming one tag to another would create duplicates
 * @returns Information about tag co-existence
 */
export const selectTagCoExistence = (
  originalTag: string,
  newTagValue: string,
) =>
  createSelector([selectAllImages], (allImages) => {
    if (!originalTag || !newTagValue || originalTag === newTagValue) {
      return {
        wouldCreateDuplicates: false,
        assetsWithOriginalTag: 0,
        assetsWithBothTags: 0,
      };
    }

    // Find all assets that have the original tag
    const assetsWithOriginalTag = allImages.filter((img) =>
      img.tagList.includes(originalTag),
    );

    // Count how many of those assets also have the new tag
    const assetsWithBothTags = assetsWithOriginalTag.filter((img) =>
      img.tagList.includes(newTagValue),
    );

    return {
      wouldCreateDuplicates: assetsWithBothTags.length > 0,
      assetsWithOriginalTag: assetsWithOriginalTag.length,
      assetsWithBothTags: assetsWithBothTags.length,
    };
  });

/**
 * Selector to get assets that have at least one of the selected tags
 * @returns Array of assets that contain at least one selected tag
 */
export const selectAssetsWithSelectedTags = createSelector(
  [selectAllImages, selectFilterTags],
  (allImages, filterTags) => {
    if (filterTags.length === 0) {
      return [];
    }

    return allImages.filter((asset) =>
      asset.tagList.some((tag) => filterTags.includes(tag)),
    );
  },
);

/**
 * Selector to get the count of assets that have at least one selected tag
 * @returns Number of assets that contain at least one selected tag
 */
export const selectAssetsWithSelectedTagsCount = createSelector(
  [selectAssetsWithSelectedTags],
  (assetsWithSelectedTags) => assetsWithSelectedTags.length,
);
