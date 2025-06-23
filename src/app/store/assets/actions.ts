// Async thunk actions
import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { DEFAULT_BATCH_SIZE } from '../../constants';
import {
  AssetTagOperation,
  getImageAssetDetails,
  getImageFileList,
  getMultipleImageAssetDetails,
  saveAssetTags,
  saveMultipleAssetTags,
} from '../../utils/asset-actions';
import {
  ImageAsset,
  ImageAssets,
  LoadProgress,
  SaveAssetResult,
  SaveProgress,
  TagState,
} from './types';
import { hasState } from './utils';

export const updateSaveProgress = createAction<SaveProgress>(
  'assets/updateSaveProgress',
);

export const updateLoadProgress = createAction<LoadProgress>(
  'assets/updateLoadProgress',
);

export const loadAllAssets = createAsyncThunk(
  'assets/loadAllAssets',
  async (_, { dispatch }) => {
    try {
      // First, get the list of image files (fast operation)
      const imageFiles = await getImageFileList();

      // Initialize progress tracking when we know the total
      const totalFiles = imageFiles.length;
      if (totalFiles === 0) return [];

      dispatch(updateLoadProgress({ total: totalFiles, completed: 0 }));

      const imageAssets: ImageAsset[] = [];
      let completedCount = 0;

      // Use the common batch size constant
      const batchSize = DEFAULT_BATCH_SIZE;

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
          console.error(
            `Error processing batch starting at index ${i}:`,
            error,
          );
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
      // Provide better error messages to the user
      console.error('Error loading assets:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load assets',
      );
    }
  },
);

export const saveAsset = createAsyncThunk<
  SaveAssetResult,
  string,
  { state: { assets: ImageAssets } }
>('assets/saveAsset', async (fileId: string, { getState }) => {
  const {
    assets: { images },
  } = getState();

  const asset = images.find((element) => element.fileId === fileId);

  if (!asset) {
    throw new Error(`Asset with ID ${fileId} not found`);
  }

  // Filter out tags that are marked for deletion, but keep SAVED, TO_ADD and DIRTY tags
  const updateTags = asset.tagList.filter(
    (tag) => !hasState(asset.tagStatus[tag], TagState.TO_DELETE),
  );

  const flattenedTags = updateTags.join(', ');

  const success = await saveAssetTags(fileId, flattenedTags);

  if (success) {
    // Create a new clean tagStatus object with only saved tags
    const newTagStatus = updateTags.reduce(
      (acc, tag) => {
        acc[tag] = TagState.SAVED;
        return acc;
      },
      {} as { [key: string]: number },
    );

    return {
      assetIndex: images.findIndex((element) => element.fileId === fileId),
      fileId,
      tagList: updateTags,
      tagStatus: newTagStatus,
      savedTagList: [...updateTags], // Store the current order as the saved order
    };
  }

  throw new Error(`Unable to save the asset ${fileId}`);
});

// Save all assets with modified tags
export const saveAllAssets = createAsyncThunk<
  { savedCount: number; errorCount?: number; results?: Array<SaveAssetResult> },
  void,
  { state: { assets: ImageAssets } }
>('assets/saveAllAssets', async (_, { getState, dispatch }) => {
  const {
    assets: { images },
  } = getState();

  // Find all images with tag status that's not SAVED (0)
  const modifiedAssets = images.filter((asset) =>
    asset.tagList.some(
      (tag) => !hasState(asset.tagStatus[tag], TagState.SAVED),
    ),
  );

  if (modifiedAssets.length === 0) {
    return { savedCount: 0 };
  }

  // Initialize progress tracking
  const totalAssets = modifiedAssets.length;
  dispatch(updateSaveProgress({ total: totalAssets, completed: 0, failed: 0 }));

  const results: Array<SaveAssetResult> = [];
  let successCount = 0;
  let errorCount = 0;

  // Prepare batch operations for disk writes
  const writeOperations: AssetTagOperation[] = modifiedAssets.map((asset) => {
    const updateTags = asset.tagList.filter(
      (tag) => !hasState(asset.tagStatus[tag], TagState.TO_DELETE),
    );

    const flattenedTags = updateTags.join(', ');

    return {
      fileId: asset.fileId,
      composedTags: flattenedTags,
    };
  });

  // Batch write all tag files in controlled batches
  try {
    const { results: writeResults } = await saveMultipleAssetTags(
      writeOperations,
      DEFAULT_BATCH_SIZE,
    );

    // Process the results
    for (let i = 0; i < modifiedAssets.length; i++) {
      const asset = modifiedAssets[i];
      const writeResult = writeResults.find((r) => r.fileId === asset.fileId);

      if (writeResult && writeResult.success) {
        // Extract the successfully saved tags
        const updateTags = asset.tagList.filter(
          (tag) => !hasState(asset.tagStatus[tag], TagState.TO_DELETE),
        );

        // Create new tag status object with only saved tags
        const newTagStatus = updateTags.reduce(
          (acc, tag) => {
            acc[tag] = TagState.SAVED;
            return acc;
          },
          {} as { [key: string]: number },
        );

        // Prepare result object for batch update
        results.push({
          assetIndex: images.findIndex(
            (element) => element.fileId === asset.fileId,
          ),
          fileId: asset.fileId,
          tagList: updateTags,
          tagStatus: newTagStatus,
          savedTagList: [...updateTags],
        });

        successCount++;
      } else {
        errorCount++;
        console.error(`Failed to save asset ${asset.fileId} to disk`);
      }

      // Update progress incrementally as we process each result
      dispatch(
        updateSaveProgress({
          total: totalAssets,
          completed: successCount,
          failed: errorCount,
        }),
      );
    }
  } catch (error) {
    // If the batch operation completely fails, fall back to individual saves
    console.error(
      'Batch save operation failed, falling back to individual saves:',
      error,
    );

    // Fall back to individual saves
    for (const asset of modifiedAssets) {
      try {
        // Extract the tags that need to be saved
        const updateTags = asset.tagList.filter(
          (tag) => !hasState(asset.tagStatus[tag], TagState.TO_DELETE),
        );

        const flattenedTags = updateTags.join(', ');

        // Write to disk individually
        const success = await saveAssetTags(asset.fileId, flattenedTags);

        if (success) {
          // Create new tag status object with only saved tags
          const newTagStatus = updateTags.reduce(
            (acc, tag) => {
              acc[tag] = TagState.SAVED;
              return acc;
            },
            {} as { [key: string]: number },
          );

          // Prepare result object for batch update
          results.push({
            assetIndex: images.findIndex(
              (element) => element.fileId === asset.fileId,
            ),
            fileId: asset.fileId,
            tagList: updateTags,
            tagStatus: newTagStatus,
            savedTagList: [...updateTags],
          });

          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to save asset ${asset.fileId} to disk`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Failed to save asset ${asset.fileId}:`, error);
      }

      // Update progress incrementally for each individual fallback save
      dispatch(
        updateSaveProgress({
          total: totalAssets,
          completed: successCount,
          failed: errorCount,
        }),
      );
    }
  }

  // No need for a final progress update since we're updating incrementally

  return {
    savedCount: successCount,
    errorCount: errorCount,
    results,
  };
});

// Cancel all tag changes
export const resetAllTags = createAsyncThunk(
  'assets/resetAllTags',
  async (_, { getState, dispatch }) => {
    const {
      assets: { images },
    } = getState() as { assets: ImageAssets };

    // Find all images with tag status that's not SAVED (0)
    const modifiedAssets = images.filter((asset) =>
      asset.tagList.some(
        (tag) => !hasState(asset.tagStatus[tag], TagState.SAVED),
      ),
    );

    if (modifiedAssets.length === 0) {
      return { resetCount: 0 };
    }

    // Reset tags for each modified asset
    for (const asset of modifiedAssets) {
      dispatch({ type: 'assets/resetTags', payload: asset.fileId });
    }

    return { resetCount: modifiedAssets.length };
  },
);
