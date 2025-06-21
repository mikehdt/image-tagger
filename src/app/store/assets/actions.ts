// Async thunk actions
import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import {
  writeMultipleTagsToDisk,
  writeTagsToDisk,
} from '../../utils/asset-actions';

// Define our own interface and constants since we can't import them from server components
interface TagWriteOperation {
  fileId: string;
  composedTags: string;
}

// Default batch size for tag writing operations
const DEFAULT_TAG_BATCH_SIZE = 20;
import { AppDispatch } from '..';
import {
  ImageAssets,
  LoadProgress,
  SaveAssetResult,
  SaveProgress,
  TagState,
} from './types';
import { hasState } from './utils';

// Action to update save progress
export const updateSaveProgress = createAction<SaveProgress>(
  'assets/updateSaveProgress',
);

export const updateLoadProgress = createAction<LoadProgress>(
  'assets/updateLoadProgress',
);

export const loadAssets = createAsyncThunk(
  'assets/loadAssets',
  async (_, { dispatch }) => {
    try {
      // Import dynamically to avoid server/client issues
      const { loadAssetsWithProgress } = await import(
        '../../utils/load-assets-client'
      );

      // This will handle progress tracking internally
      const assets = await loadAssetsWithProgress(dispatch as AppDispatch);
      return assets;
    } catch (error) {
      // Provide better error messages to the user
      console.error('Error loading assets:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load assets',
      );
    }
  },
);

export const saveAssets = createAsyncThunk<
  SaveAssetResult,
  string,
  { state: { assets: ImageAssets } }
>('assets/saveImages', async (fileId: string, { getState }) => {
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

  const success = await writeTagsToDisk(fileId, flattenedTags);

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
  const writeOperations: TagWriteOperation[] = modifiedAssets.map((asset) => {
    const updateTags = asset.tagList.filter(
      (tag) => !hasState(asset.tagStatus[tag], TagState.TO_DELETE),
    );

    const flattenedTags = updateTags.join(', ');

    return {
      fileId: asset.fileId,
      composedTags: flattenedTags,
    };
  });

  // Configure batch size for tag saving
  const tagBatchSize = DEFAULT_TAG_BATCH_SIZE;

  // Batch write all tag files in controlled batches
  try {
    const { results: writeResults } = await writeMultipleTagsToDisk(
      writeOperations,
      tagBatchSize,
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
        const success = await writeTagsToDisk(asset.fileId, flattenedTags);

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

// Interface for saveAllAssets with batch size configuration
export interface SaveAllAssetsOptions {
  batchSize?: number; // Optional batch size for tag saving
}

// Save all assets with modified tags and configurable batch size
export const saveAllAssetsWithOptions = createAsyncThunk<
  { savedCount: number; errorCount?: number; results?: Array<SaveAssetResult> },
  SaveAllAssetsOptions,
  { state: { assets: ImageAssets } }
>(
  'assets/saveAllAssetsWithOptions',
  async (options, { getState, dispatch }) => {
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
    dispatch(
      updateSaveProgress({ total: totalAssets, completed: 0, failed: 0 }),
    );

    const results: Array<SaveAssetResult> = [];
    let successCount = 0;
    let errorCount = 0;

    // Prepare batch operations for disk writes
    const writeOperations: TagWriteOperation[] = modifiedAssets.map((asset) => {
      const updateTags = asset.tagList.filter(
        (tag) => !hasState(asset.tagStatus[tag], TagState.TO_DELETE),
      );

      const flattenedTags = updateTags.join(', ');

      return {
        fileId: asset.fileId,
        composedTags: flattenedTags,
      };
    });

    // Configure batch size for tag saving - use provided option or default
    const tagBatchSize = options.batchSize ?? DEFAULT_TAG_BATCH_SIZE;

    // Batch write all tag files in controlled batches
    try {
      const { results: writeResults } = await writeMultipleTagsToDisk(
        writeOperations,
        tagBatchSize,
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
          const success = await writeTagsToDisk(asset.fileId, flattenedTags);

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

    return {
      savedCount: successCount,
      errorCount: errorCount,
      results,
    };
  },
);

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
