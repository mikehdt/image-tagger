import { createAsyncThunk } from '@reduxjs/toolkit';

import { addTag, editTag } from '../assets';
import { RootState } from '../index';

/**
 * Thunk action to add a tag to all selected assets
 * This demonstrates cross-slice interaction where we:
 * 1. Get selected assets from the selection slice
 * 2. Dispatch actions to add tags to each selected asset in the assets slice
 */
export const addTagToSelectedAssets = createAsyncThunk(
  'selection/addTagToSelectedAssets',
  async (tagName: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const selectedAssets = state.selection.selectedAssets;

    // Check if we have selected assets and a valid tag
    if (!selectedAssets.length || !tagName.trim()) {
      return { success: false, message: 'No assets selected or invalid tag' };
    }

    // For each selected asset, dispatch an addTag action
    selectedAssets.forEach((assetId) => {
      dispatch(addTag({ assetId, tagName: tagName.trim() }));
    });

    return {
      success: true,
      count: selectedAssets.length,
      message: `Added tag "${tagName}" to ${selectedAssets.length} assets`,
    };
  },
);

/**
 * Thunk action to edit multiple tags in all filtered assets
 * This enables bulk editing of tags across all assets that have those tags
 */
export const editTagsAcrossAssets = createAsyncThunk(
  'selection/editTagsAcrossAssets',
  async (
    tagUpdates: Array<{ oldTagName: string; newTagName: string }>,
    { getState, dispatch },
  ) => {
    const state = getState() as RootState;
    const allAssets = state.assets.images;

    // Validate the input
    if (!tagUpdates.length) {
      return {
        success: false,
        message: 'No tag updates provided',
      };
    }

    // For tracking modified assets
    const modifiedAssetCount: Record<string, number> = {};

    // Process each tag update
    tagUpdates.forEach(({ oldTagName, newTagName }) => {
      // Skip empty or unchanged tags
      if (!newTagName.trim() || oldTagName === newTagName) {
        return;
      }

      // Find all assets with this tag
      allAssets.forEach((asset) => {
        if (asset.tagList.includes(oldTagName)) {
          // Dispatch edit action for each asset that has this tag
          dispatch(
            editTag({
              assetId: asset.fileId,
              oldTagName,
              newTagName: newTagName.trim(),
            }),
          );

          // Count modifications
          modifiedAssetCount[oldTagName] =
            (modifiedAssetCount[oldTagName] || 0) + 1;
        }
      });
    });

    // Create a summary of changes
    const totalChangedTags = Object.keys(modifiedAssetCount).length;
    const totalChangedAssets = Object.values(modifiedAssetCount).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      success: totalChangedTags > 0,
      count: totalChangedAssets,
      message:
        totalChangedTags > 0
          ? `Updated ${totalChangedTags} tags across ${totalChangedAssets} assets`
          : 'No tags were changed',
    };
  },
);
