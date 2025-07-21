import { createAsyncThunk } from '@reduxjs/toolkit';

import { addTag, deleteTag, editTag, markFilterTagsToDelete } from '../assets';
import { selectFilteredAssets } from '../assets';
import { updateTagFilters } from '../filters';
import { RootState } from '../index';
import {
  selectAssetsWithActiveFilters,
  selectAssetsWithSelectedTags,
} from './combinedSelectors';

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

    // Create a snapshot of the original asset state to avoid interference between operations
    const originalAssetState = new Map(
      allAssets.map((asset) => [asset.fileId, [...asset.tagList]]),
    );

    // Track which assets have already had a tag renamed to each target name
    // This prevents multiple tags from being renamed to the same value in the same asset
    const assetRenamedTargets = new Map<string, Set<string>>();

    // Process each tag update
    tagUpdates.forEach(({ oldTagName, newTagName, operation }) => {
      // Skip empty or unchanged tags
      if (!newTagName.trim() || oldTagName === newTagName) {
        return;
      }

      if (operation === 'DELETE') {
        // For DELETE operations, check if this is a duplicate prevention delete
        // (when newTagName != oldTagName, it means this tag was intended to be renamed
        // but is being deleted due to duplicate detection)
        if (newTagName.trim() !== oldTagName) {
          // This is a duplicate prevention delete - handle it like a rename that creates duplicates
          allAssets.forEach((asset) => {
            if (asset.tagList.includes(oldTagName)) {
              dispatch(
                deleteTag({
                  assetId: asset.fileId,
                  tagName: oldTagName,
                }),
              );

              // Count modifications
              modifiedAssetCount[oldTagName] =
                (modifiedAssetCount[oldTagName] || 0) + 1;
            }
          });
        } else {
          // Regular delete operation - collect tags to be marked for deletion
          tagsToDelete.push(oldTagName);
        }
        return;
      }

      // Handle RENAME operations
      if (operation === 'RENAME') {
        const trimmedNewName = newTagName.trim();

        // Find all assets with this tag
        allAssets.forEach((asset) => {
          if (asset.tagList.includes(oldTagName)) {
            // Initialize tracking for this asset if needed
            if (!assetRenamedTargets.has(asset.fileId)) {
              assetRenamedTargets.set(asset.fileId, new Set());
            }
            const assetTargets = assetRenamedTargets.get(asset.fileId)!;

            // Check against the ORIGINAL asset state for existing duplicates
            const originalTags = originalAssetState.get(asset.fileId) || [];
            const originallyHadTarget = originalTags.includes(trimmedNewName);

            // Check if we've already renamed another tag to this target in this operation
            const alreadyRenamedToTarget = assetTargets.has(trimmedNewName);

            if (originallyHadTarget || alreadyRenamedToTarget) {
              // Mark the ORIGINAL tag for deletion, not the target
              dispatch(
                deleteTag({
                  assetId: asset.fileId,
                  tagName: oldTagName, // Mark the ORIGINAL tag for deletion, not the target
                }),
              );
            } else {
              dispatch(
                editTag({
                  assetId: asset.fileId,
                  oldTagName,
                  newTagName: trimmedNewName,
                }),
              );

              // Track that we've renamed a tag to this target in this asset
              assetTargets.add(trimmedNewName);
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

/**
 * Enhanced thunk action to add a tag to assets based on dual selection logic
 * Supports adding to selected assets, assets with active filters, or both
 */
export const addTagToAssetsWithDualSelection = createAsyncThunk(
  'selection/addTagToAssetsWithDualSelection',
  async (
    {
      tagName,
      addToStart = false,
      applyToSelectedAssets = false,
      applyToAssetsWithSelectedTags = false,
      applyToAssetsWithActiveFilters = false,
      onlyFilteredAssets = false,
    }: {
      tagName: string;
      addToStart?: boolean;
      applyToSelectedAssets?: boolean;
      applyToAssetsWithSelectedTags?: boolean; // Deprecated: kept for backwards compatibility
      applyToAssetsWithActiveFilters?: boolean; // New: supports all filter types
      onlyFilteredAssets?: boolean;
    },
    { getState, dispatch },
  ) => {
    const state = getState() as RootState;

    // Get the final assets based on constraints
    let finalAssets: string[] = [];

    // Determine which filter logic to use
    // Priority: applyToAssetsWithActiveFilters > applyToAssetsWithSelectedTags (backwards compatibility)
    const useActiveFilters =
      applyToAssetsWithActiveFilters || applyToAssetsWithSelectedTags;

    if (applyToSelectedAssets && useActiveFilters) {
      // Both constraints: intersection of selected assets AND assets with active filters
      const selectedAssetIds = new Set(state.selection.selectedAssets);
      const assetsWithFilters = applyToAssetsWithActiveFilters
        ? selectAssetsWithActiveFilters(state)
        : selectAssetsWithSelectedTags(state);

      finalAssets = assetsWithFilters
        .filter((asset) => selectedAssetIds.has(asset.fileId))
        .map((asset) => asset.fileId);
    } else if (applyToSelectedAssets) {
      // Only selected assets constraint
      finalAssets = [...state.selection.selectedAssets];
    } else if (useActiveFilters) {
      // Only assets with active filters constraint
      const assetsWithFilters = applyToAssetsWithActiveFilters
        ? selectAssetsWithActiveFilters(state)
        : selectAssetsWithSelectedTags(state);
      finalAssets = assetsWithFilters.map((asset) => asset.fileId);
    }

    // Further filter by filtered assets if constraint is active
    if (onlyFilteredAssets) {
      const filteredAssets = selectFilteredAssets(state);
      const filteredAssetIds = new Set(
        filteredAssets.map((asset) => asset.fileId),
      );
      finalAssets = finalAssets.filter((assetId) =>
        filteredAssetIds.has(assetId),
      );
    }

    // Check if we have assets and a valid tag
    if (!finalAssets.length || !tagName.trim()) {
      return { success: false, message: 'No assets available or invalid tag' };
    }

    // For each final asset, dispatch an addTag action
    finalAssets.forEach((assetId) => {
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
      count: finalAssets.length,
      message: `Added tag "${tagName}" to ${finalAssets.length} assets`,
    };
  },
);
