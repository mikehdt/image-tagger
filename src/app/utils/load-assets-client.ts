'use client';

import { AppDispatch } from '../store';
import { ImageAsset, updateLoadProgress } from '../store/assets';
import {
  getImageAssetDetails,
  getImageFileList,
  getMultipleImageAssetDetails,
} from './asset-actions';

// Function that loads assets with progress tracking using the batch API
export const loadAssetsWithProgress = async (
  dispatch: AppDispatch,
): Promise<ImageAsset[]> => {
  try {
    // First, get the list of image files (fast operation)
    const imageFiles = await getImageFileList();

    // Initialize progress tracking when we know the total
    const totalFiles = imageFiles.length;
    if (totalFiles === 0) return [];

    dispatch(updateLoadProgress({ total: totalFiles, completed: 0 }));

    const imageAssets: ImageAsset[] = [];
    let completedCount = 0;

    // Configure batch size - balance between network efficiency and progress granularity
    const batchSize = 24;

    // Process files in batches to reduce client-server round trips
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);

      try {
        // Process an entire batch on the server with a single request
        const batchResults = await getMultipleImageAssetDetails(batch);

        // Add all results to our asset collection
        imageAssets.push(...batchResults);

        // Update progress for the entire batch at once
        completedCount += batchResults.length;
        dispatch(
          updateLoadProgress({
            total: totalFiles,
            completed: completedCount,
          }),
        );
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error);
        // If batch processing fails, fall back to processing individual files
        for (const file of batch) {
          try {
            const asset = await getImageAssetDetails(file);
            if (asset) imageAssets.push(asset);
          } catch (fileError) {
            console.error(`Error processing file ${file}:`, fileError);
          } finally {
            completedCount++;
            dispatch(
              updateLoadProgress({
                total: totalFiles,
                completed: completedCount,
              }),
            );
          }
        }
      }
    }

    return imageAssets;
  } catch (error) {
    console.error('Error loading assets:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to load assets',
    );
  }
};
