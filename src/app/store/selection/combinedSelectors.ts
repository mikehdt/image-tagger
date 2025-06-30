import { createSelector } from '@reduxjs/toolkit';

import { selectAllImages } from '../assets';
import { selectSelectedAssets } from '../selection';

/**
 * Returns information about duplicates in selected assets
 * @returns An object with information about tag duplication status
 */
export const selectDuplicateTagInfo = (tagName: string) =>
  createSelector(
    [selectSelectedAssets, selectAllImages],
    (selectedAssets, allImages) => {
      if (!tagName.trim() || selectedAssets.length === 0) {
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
        img.tagList.includes(tagName.trim()),
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
