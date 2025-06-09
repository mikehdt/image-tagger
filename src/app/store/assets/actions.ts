// Async thunk actions
import { createAsyncThunk } from '@reduxjs/toolkit';

import { getImageFiles, writeTagsToDisk } from '../../utils/asset-actions';
import { ImageAssets, SaveAssetResult, TagState } from './types';
import { hasState } from './utils';

export const loadAssets = createAsyncThunk(
  'assets/loadAssets',
  async () => await getImageFiles(),
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
    asset.tagList.some((tag) => asset.tagStatus[tag] !== TagState.SAVED),
  );

  if (modifiedAssets.length === 0) {
    return { savedCount: 0 };
  }

  const results: Array<SaveAssetResult> = [];
  let successCount = 0;
  let errorCount = 0;

  // Save each modified asset
  for (const asset of modifiedAssets) {
    try {
      const result = await dispatch(saveAssets(asset.fileId)).unwrap();
      results.push(result);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`Failed to save asset ${asset.fileId}:`, error);
    }
  }

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
      asset.tagList.some((tag) => asset.tagStatus[tag] !== TagState.SAVED),
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
