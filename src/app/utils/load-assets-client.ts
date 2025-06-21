'use client';

import { AppDispatch } from '../store';
import { ImageAsset, updateLoadProgress } from '../store/assets';
import { getImageAssetDetails, getImageFileList } from './asset-actions';

// Function that loads assets with progress tracking
export const loadAssetsWithProgress = async (
  dispatch: AppDispatch,
): Promise<ImageAsset[]> => {
  try {
    // First, get the list of image files (fast operation)
    const imageFiles = await getImageFileList();

    // Initialize progress tracking when we know the total
    const totalFiles = imageFiles.length;
    if (totalFiles > 0) {
      dispatch(updateLoadProgress({ total: totalFiles, completed: 0 }));
    }

    const imageAssets: ImageAsset[] = [];

    // Process each file and update progress
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];

      try {
        // Get details for this specific image
        const asset = await getImageAssetDetails(file);
        imageAssets.push(asset);
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
        // Continue with other files even if one fails
      }

      // Update progress after each file is processed
      dispatch(
        updateLoadProgress({
          total: totalFiles,
          completed: i + 1,
        }),
      );
    }

    return imageAssets;
  } catch (error) {
    console.error('Error loading assets:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to load assets',
    );
  }
};
