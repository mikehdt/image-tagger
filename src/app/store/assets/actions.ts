// Async thunk actions
import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

// Action to handle delayed completion transition (250ms delay to show 100% progress)
export const completeAfterDelay = createAsyncThunk<void, void>(
  'assets/completeAfterDelay',
  async () => {
    return new Promise<void>((resolve) => {
      // Use requestAnimationFrame to ensure we wait for the next frame first
      requestAnimationFrame(() => {
        setTimeout(() => {
          resolve();
        }, 350);
      });
    });
  },
);

// Import removed since DEFAULT_BATCH_SIZE is now used through helpers
import {
  AssetTagOperation,
  getImageAssetDetails,
  getImageFileList,
  getMultipleImageAssetDetails,
  ImageFileListResult,
  saveAssetTags,
  saveMultipleAssetTags,
} from '../../utils/asset-actions';
import { addToast } from '../toasts';
import {
  createCleanTagStatus,
  createFlattenedTags,
  createSaveAssetResult,
  findModifiedAssets,
  getUpdatedTags,
  processBatchesWithProgress,
  processSaveResults,
} from './helpers';
import {
  ImageAsset,
  ImageAssets,
  LoadProgress,
  SaveAssetResult,
  SaveProgress,
} from './types';

export const updateSaveProgress = createAction<SaveProgress>(
  'assets/updateSaveProgress',
);

export const clearSaveErrors = createAction('assets/clearSaveErrors');

export const updateLoadProgress = createAction<LoadProgress>(
  'assets/updateLoadProgress',
);

export const clearLoadErrors = createAction('assets/clearLoadErrors');

export const loadAllAssets = createAsyncThunk<
  ImageAsset[],
  { maintainIoState?: boolean; projectPath?: string } | undefined
>('assets/loadAllAssets', async (options, { dispatch }) => {
  try {
    // First, get the list of image files (fast operation)
    const result: ImageFileListResult = await getImageFileList(
      options?.projectPath,
    );

    // Handle directory read errors
    if (result.error) {
      dispatch(addToast({ children: result.error, variant: 'error' }));

      // For custom projects (projectPath provided) with folder not found,
      // reject so AppProvider redirects to project list
      if (options?.projectPath && result.errorType === 'not_found') {
        throw new Error(result.error);
      }

      // For default project or other errors, return empty array gracefully
      return [];
    }

    const imageFiles = result.files;

    // Initialize progress tracking when we know the total and clear any previous errors
    const totalFiles = imageFiles.length;
    if (totalFiles === 0) return [];

    dispatch(clearLoadErrors());

    // Define the update progress function that includes error tracking
    // Track failed loads
    let failedCount = 0;
    const failedFiles: string[] = [];

    // Define the update progress function that includes error tracking
    const updateProgress = (completed: number, total: number) => {
      dispatch(
        updateLoadProgress({
          completed,
          total,
          failed: failedCount,
          errors: failedFiles.length > 0 ? failedFiles : undefined,
        }),
      );
    };

    // Process batches using the helper
    const imageAssets = await processBatchesWithProgress<
      string,
      ImageAsset,
      ImageAsset
    >(
      imageFiles,
      // Process a batch of files
      async (batch) => {
        const { assets, errors } = await getMultipleImageAssetDetails(
          batch,
          options?.projectPath,
        );
        // Update error count and track failed files for this batch
        if (errors.length > 0) {
          failedCount += errors.length;
          failedFiles.push(...errors);
        }
        return assets;
      },
      // Update progress
      updateProgress,
      // Total items for progress tracking
      totalFiles,
      // Fallback for individual processing
      async (file) => {
        try {
          return await getImageAssetDetails(file, options?.projectPath);
        } catch (error) {
          console.error(`Failed to process file ${file}:`, error);
          failedCount++;
          failedFiles.push(file);
          return null;
        }
      },
    );

    return imageAssets;
  } catch (error) {
    // Provide better error messages to the user
    console.error('Error loading assets:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to load assets',
    );
  }
});

export const saveAsset = createAsyncThunk<
  SaveAssetResult,
  { fileId: string; projectPath?: string },
  { state: { assets: ImageAssets } }
>('assets/saveAsset', async ({ fileId, projectPath }, { getState }) => {
  const {
    assets: { images, imageIndexById },
  } = getState();

  const assetIndex = imageIndexById[fileId];
  if (assetIndex === undefined) {
    throw new Error(`Asset with ID ${fileId} not found`);
  }

  const asset = images[assetIndex];

  // Get updated tags using the helper function
  const updateTags = getUpdatedTags(asset);

  // Create flattened tags for disk storage
  const flattenedTags = createFlattenedTags(updateTags);

  const success = await saveAssetTags(fileId, flattenedTags, projectPath);

  if (success) {
    // Create a clean tag status object with helper function
    const newTagStatus = createCleanTagStatus(updateTags);

    // Create and return the save result object
    return createSaveAssetResult(
      asset,
      updateTags,
      newTagStatus,
      imageIndexById,
    );
  }

  throw new Error(`Unable to save the asset ${fileId}`);
});

// Save all assets with modified tags
export const saveAllAssets = createAsyncThunk<
  { savedCount: number; errorCount?: number; results?: Array<SaveAssetResult> },
  { projectPath?: string } | undefined,
  { state: { assets: ImageAssets } }
>('assets/saveAllAssets', async (options, { getState, dispatch }) => {
  const {
    assets: { images, imageIndexById },
  } = getState();

  // Find all images with modified tags
  const modifiedAssets = findModifiedAssets(images);

  if (modifiedAssets.length === 0) {
    return { savedCount: 0 };
  }

  // Initialize progress tracking and clear any previous errors
  const totalAssets = modifiedAssets.length;
  dispatch(clearSaveErrors());
  dispatch(updateSaveProgress({ total: totalAssets, completed: 0, failed: 0 }));

  // Prepare batch operations for disk writes using helper functions
  const writeOperations: AssetTagOperation[] = modifiedAssets.map((asset) => {
    const updateTags = getUpdatedTags(asset);
    const flattenedTags = createFlattenedTags(updateTags);

    return {
      fileId: asset.fileId,
      composedTags: flattenedTags,
    };
  });

  // Track success and error counts
  let successCount = 0;
  let errorCount = 0;
  const failedFiles: string[] = [];

  // Define the update progress function directly in this function
  const updateProgress = (completed: number, total: number, failed = 0) => {
    dispatch(
      updateSaveProgress({
        completed,
        total,
        failed,
        errors: failedFiles.length > 0 ? failedFiles : undefined,
      }),
    );
  };

  try {
    // Process batches using the helper
    const writeResults = await processBatchesWithProgress<
      AssetTagOperation,
      { fileId: string; success: boolean }
    >(
      writeOperations,
      // Process a batch of operations
      async (batch) => {
        const { results, errors } = await saveMultipleAssetTags(
          batch,
          options?.projectPath,
        );
        // Add any errors to our tracking
        if (errors.length > 0) {
          failedFiles.push(...errors);
        }
        return results;
      },
      // Update progress
      (completed, total, failed = 0) => {
        updateProgress(completed, total, failed);
      },
      // Total items for progress tracking
      totalAssets,
      // Fallback for individual processing
      async (operation) => {
        const success = await saveAssetTags(
          operation.fileId,
          operation.composedTags,
          options?.projectPath,
        );
        if (!success) {
          failedFiles.push(operation.fileId);
        }
        return { fileId: operation.fileId, success };
      },
    );

    // Process the results to create SaveAssetResult objects
    const processedResults = processSaveResults(
      writeResults,
      modifiedAssets,
      imageIndexById,
    );

    successCount = processedResults.successCount;
    errorCount = processedResults.errorCount;

    return {
      savedCount: successCount,
      errorCount: errorCount,
      results: processedResults.results,
    };
  } catch (error) {
    console.error('Error saving assets:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to save assets',
    );
  }
});

// Cancel all tag changes
export const resetAllTags = createAsyncThunk(
  'assets/resetAllTags',
  async (_, { getState, dispatch }) => {
    const {
      assets: { images },
    } = getState() as { assets: ImageAssets };

    // Find all images with modified tags using helper function
    const modifiedAssets = findModifiedAssets(images);

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
