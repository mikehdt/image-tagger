import { createAsyncThunk } from '@reduxjs/toolkit';

import { addTag } from '../assets';
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
