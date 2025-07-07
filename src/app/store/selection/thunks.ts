import { createAsyncThunk } from '@reduxjs/toolkit';

import { addTag, deleteTag, editTag, markFilterTagsToDelete } from '../assets';
import { selectFilteredAssets } from '../assets';
import { updateTagFilters } from '../filters';
import { RootState } from '../index';

/**
 * Thunk action to add a tag to all selected assets
 * This demonstrates cross-slice interaction where we:
 * 1. Get selected assets from the selection slice
 * 2. Dispatch actions to add tags to each selected asset in the assets slice
 */
export const addTagToSelectedAssets = createAsyncThunk(
  'selection/addTagToSelectedAssets',
  async (
    { tagName, addToStart = false }: { tagName: string; addToStart?: boolean },
    { getState, dispatch },
  ) => {
    const state = getState() as RootState;
    const selectedAssets = state.selection.selectedAssets;

    // Check if we have selected assets and a valid tag
    if (!selectedAssets.length || !tagName.trim()) {
      return { success: false, message: 'No assets selected or invalid tag' };
    }

    // For each selected asset, dispatch an addTag action
    selectedAssets.forEach((assetId) => {
      dispatch(
        addTag({
          assetId,
          tagName: tagName.trim(),
          position: addToStart ? 'start' : 'end',
        }),
      );
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
    {
      tagUpdates,
      onlyFilteredAssets = false,
      onlySelectedAssets = false,
    }: {
      tagUpdates: Array<{
        oldTagName: string;
        newTagName: string;
        operation: 'RENAME' | 'DELETE';
      }>;
      onlyFilteredAssets?: boolean;
      onlySelectedAssets?: boolean;
    },
    { getState, dispatch },
  ) => {
    const state = getState() as RootState;

    // Start with all assets or filtered assets based on the filter constraint
    let candidateAssets = onlyFilteredAssets
      ? selectFilteredAssets(state)
      : state.assets.images;

    // Further filter by selected assets if that constraint is active
    if (onlySelectedAssets) {
      const selectedAssetIds = new Set(state.selection.selectedAssets);
      candidateAssets = candidateAssets.filter((asset) =>
        selectedAssetIds.has(asset.fileId),
      );
    }

    // These are the final assets we'll operate on
    const allAssets = candidateAssets;

    // Validate the input
    if (!tagUpdates.length) {
      return {
        success: false,
        message: 'No tag updates provided',
      };
    }

    // For tracking modified assets
    const modifiedAssetCount: Record<string, number> = {};
    const tagsToDelete: string[] = [];

    // Process each tag update
    tagUpdates.forEach(({ oldTagName, newTagName, operation }) => {
      // Skip empty or unchanged tags
      if (!newTagName.trim() || oldTagName === newTagName) {
        return;
      }

      if (operation === 'DELETE') {
        // Collect tags to be marked for deletion
        tagsToDelete.push(oldTagName);
        return;
      }

      // Handle RENAME operations
      if (operation === 'RENAME') {
        // Find all assets with this tag
        allAssets.forEach((asset) => {
          if (asset.tagList.includes(oldTagName)) {
            // Check if the asset already has the new tag
            if (asset.tagList.includes(newTagName.trim())) {
              // Asset already has the target tag, so:
              // Don't rename - just mark the original tag for deletion (TO_DELETE)
              // The existing target tag stays unchanged
              dispatch(
                deleteTag({
                  assetId: asset.fileId,
                  tagName: oldTagName, // Mark the ORIGINAL tag for deletion, not the target
                }),
              );
            } else {
              // Normal rename - asset doesn't have the target tag
              dispatch(
                editTag({
                  assetId: asset.fileId,
                  oldTagName,
                  newTagName: newTagName.trim(),
                }),
              );
            }

            // Count modifications
            modifiedAssetCount[oldTagName] =
              (modifiedAssetCount[oldTagName] || 0) + 1;
          }
        });
      }
    });

    // Mark tags for deletion in bulk
    if (tagsToDelete.length > 0) {
      dispatch(markFilterTagsToDelete(tagsToDelete));

      // Count deletions - count assets that have each tag
      tagsToDelete.forEach((tagName) => {
        const assetsWithTag = allAssets.filter((asset) =>
          asset.tagList.includes(tagName),
        ).length;
        modifiedAssetCount[tagName] = assetsWithTag;
      });
    }

    // Create a summary of changes
    const totalChangedTags = Object.keys(modifiedAssetCount).length;
    const totalChangedAssets = Object.values(modifiedAssetCount).reduce(
      (sum, count) => sum + count,
      0,
    );

    // Also update the filter tags to keep the selection in sync with the edits
    if (totalChangedTags > 0) {
      // Pass all operations to updateTagFilters - both RENAME and DELETE operations need filter updates
      dispatch(updateTagFilters(tagUpdates));
    }

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
