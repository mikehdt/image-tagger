import { createSelector } from '@reduxjs/toolkit';

import { selectAllImages } from '../assets';
import { RootState } from '../index';
import { selectSelectedAssets } from '../selection';

/**
 * Checks if any of the selected assets already have the specified tag
 */
export const selectTagExistsInSelectedAssets = (tagName: string) =>
  createSelector(
    [selectSelectedAssets, selectAllImages],
    (selectedAssets, allImages) => {
      if (!tagName.trim() || selectedAssets.length === 0) {
        return false;
      }

      // Find all selected assets in the assets slice
      const selectedImagesData = allImages.filter((img) =>
        selectedAssets.includes(img.fileId),
      );

      // Check if any of these assets already have the tag
      return selectedImagesData.some((img) =>
        img.tagList.includes(tagName.trim()),
      );
    },
  );
