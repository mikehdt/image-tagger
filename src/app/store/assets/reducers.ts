// Core reducers for the assets slice
import { PayloadAction } from '@reduxjs/toolkit';

import { toggleDirection } from '../utils';
import {
  ImageAssets,
  IoState,
  SortDirection,
  SortType,
  TagState,
} from './types';
import { addState, hasState, removeState, toggleState } from './utils';

export const coreReducers = {
  // Reset assets to initial state (useful when switching projects)
  resetAssetsState: (state: ImageAssets) => {
    state.ioState = IoState.INITIAL;
    state.ioMessage = undefined;
    state.images = [];
    state.imageIndexById = {};
    state.loadProgress = undefined;
    state.saveProgress = undefined;
    // Reset sorting to defaults
    state.sortType = SortType.NAME;
    state.sortDirection = SortDirection.ASC;
  },

  markFilterTagsToDelete: (
    state: ImageAssets,
    { payload }: PayloadAction<{ tags: string[]; assetIds?: string[] }>,
  ) => {
    const { tags, assetIds } = payload;
    if (!tags || tags.length === 0) return;

    // If assetIds provided, only operate on those assets
    const targetAssetIds = assetIds ? new Set(assetIds) : null;

    // Iterate over images and mark matching tags for deletion
    state.images.forEach((image) => {
      // Skip if we have a scope and this image isn't in it
      if (targetAssetIds && !targetAssetIds.has(image.fileId)) return;

      tags.forEach((filterTag) => {
        if (image.tagList.includes(filterTag)) {
          // Only toggle TO_DELETE for tags that are not marked as TO_ADD
          if (!hasState(image.tagStatus[filterTag], TagState.TO_ADD)) {
            image.tagStatus[filterTag] = toggleState(
              image.tagStatus[filterTag],
              TagState.TO_DELETE,
            );
          }
        }
      });
    });

    // Invalidate tag counts cache since TO_DELETE state affects counts
    state.tagCountsCache = null;
  },

  addTag: (
    state: ImageAssets,
    {
      payload,
    }: PayloadAction<{
      assetId: string;
      tagName: string;
      position?: 'start' | 'end';
    }>,
  ) => {
    const { assetId, tagName, position = 'end' } = payload;

    if (tagName.trim() === '') return;

    const imageIndex = state.imageIndexById[assetId];
    if (imageIndex === undefined) return;

    // Even if duplicate tags might exist, we'll only allow adding if not already in the list
    // This prevents inadvertently adding more duplicates
    if (!state.images[imageIndex].tagList.includes(tagName)) {
      if (position === 'start') {
        // Add to the beginning of the list
        state.images[imageIndex].tagList.unshift(tagName);

        // When adding to start, mark all other existing valid tags as DIRTY
        // since their positions have shifted (similar to drag/drop behavior)
        const currentTagStatus = state.images[imageIndex].tagStatus;
        Object.keys(currentTagStatus).forEach((existingTag) => {
          // Only mark tags as DIRTY if they are not already TO_ADD
          if (!hasState(currentTagStatus[existingTag], TagState.TO_ADD)) {
            currentTagStatus[existingTag] = addState(
              currentTagStatus[existingTag],
              TagState.DIRTY,
            );
          }
        });
      } else {
        // Add to the end of the list (default behavior)
        state.images[imageIndex].tagList.push(tagName);
      }

      // Mark the new tag as TO_ADD
      state.images[imageIndex].tagStatus[tagName] = TagState.TO_ADD;

      // Invalidate tag counts cache
      state.tagCountsCache = null;
    }
  },

  addMultipleTags: (
    state: ImageAssets,
    {
      payload,
    }: PayloadAction<{
      assetId: string;
      tagNames: string[];
      position?: 'start' | 'end';
    }>,
  ) => {
    const { assetId, tagNames, position = 'end' } = payload;

    if (tagNames.length === 0) return;

    const imageIndex = state.imageIndexById[assetId];
    if (imageIndex === undefined) return;

    // Filter out tags that already exist and empty tags
    const tagsToAdd = tagNames.filter(
      (tagName) =>
        tagName.trim() !== '' &&
        !state.images[imageIndex].tagList.includes(tagName),
    );

    if (tagsToAdd.length === 0) return;

    // Get current tag status for efficiency
    const currentTagStatus = state.images[imageIndex].tagStatus;

    if (position === 'start') {
      // Add all new tags to the beginning of the list in the order provided
      state.images[imageIndex].tagList.unshift(...tagsToAdd);

      // Mark all other existing valid tags as DIRTY only once
      // since their positions have shifted (similar to drag/drop behavior)
      Object.keys(currentTagStatus).forEach((existingTag) => {
        // Only mark tags as DIRTY if they are not already TO_ADD
        if (!hasState(currentTagStatus[existingTag], TagState.TO_ADD)) {
          currentTagStatus[existingTag] = addState(
            currentTagStatus[existingTag],
            TagState.DIRTY,
          );
        }
      });
    } else {
      // Add all new tags to the end of the list (default behavior)
      state.images[imageIndex].tagList.push(...tagsToAdd);
    }

    // Mark all new tags as TO_ADD
    tagsToAdd.forEach((tagName) => {
      state.images[imageIndex].tagStatus[tagName] = TagState.TO_ADD;
    });

    // Invalidate tag counts cache
    state.tagCountsCache = null;
  },

  editTag: (
    state: ImageAssets,
    {
      payload,
    }: PayloadAction<{
      assetId: string;
      oldTagName: string;
      newTagName: string;
    }>,
  ) => {
    // savedTagList contains the unmodified tags in case of reverting
    const { assetId, oldTagName, newTagName } = payload;

    const assetIndex = state.imageIndexById[assetId];
    if (assetIndex === undefined) return;

    // Update the name in the tagList
    const tagListIndex = state.images[assetIndex].tagList.findIndex(
      (item) => item === oldTagName,
    );

    state.images[assetIndex].tagList[tagListIndex] = newTagName;

    const asset = state.images[assetIndex];
    const savedIndex = asset.savedTagList?.indexOf(newTagName);

    // Check if this is a revert to the original name AND position
    const isBackToOriginal =
      savedIndex !== undefined &&
      savedIndex !== -1 &&
      savedIndex === tagListIndex;

    // If tag is back to original name and position, don't mark as DIRTY
    if (isBackToOriginal) {
      // Copy any other flags except DIRTY
      state.images[assetIndex].tagStatus[newTagName] =
        state.images[assetIndex].tagStatus[oldTagName] & ~TagState.DIRTY;
    } else {
      // Otherwise, mark as DIRTY
      state.images[assetIndex].tagStatus[newTagName] = addState(
        state.images[assetIndex].tagStatus[oldTagName],
        TagState.DIRTY,
      );
    }

    delete state.images[assetIndex].tagStatus[oldTagName];

    // Invalidate tag counts cache since tag name changed
    state.tagCountsCache = null;

    // On cancel, need to also remove superfluous and reset any tag keys missing as a result!
  },

  deleteTag: (
    state: ImageAssets,
    { payload }: PayloadAction<{ assetId: string; tagName: string }>,
  ) => {
    const { assetId, tagName } = payload;

    const assetIndex = state.imageIndexById[assetId];
    if (assetIndex === undefined) return;

    // Stop if no tags to operate on
    if (!state.images[assetIndex]?.tagStatus) return;

    const tagState = state.images[assetIndex].tagStatus[tagName];

    // Handle cases based on the current state
    if (hasState(tagState, TagState.TO_ADD)) {
      // For TO_ADD tags, remove them completely
      const asset = state.images[assetIndex];
      const deletedIndex = asset.tagList.findIndex((item) => item === tagName);

      delete asset.tagStatus[tagName];
      asset.tagList.splice(deletedIndex, 1);

      // Re-evaluate DIRTY state for all tags after the deleted position
      // since their positions may have shifted back to original
      const savedTagList = asset.savedTagList || [];

      for (let i = deletedIndex; i < asset.tagList.length; i++) {
        const tag = asset.tagList[i];

        // Skip TO_ADD tags (they don't have original positions)
        if (tag && !hasState(asset.tagStatus[tag], TagState.TO_ADD)) {
          const originalIndex = savedTagList.indexOf(tag);

          // If tag is now in its original position, remove DIRTY flag
          // Otherwise, ensure DIRTY flag is set
          if (originalIndex === i) {
            asset.tagStatus[tag] = removeState(
              asset.tagStatus[tag],
              TagState.DIRTY,
            );
          } else {
            asset.tagStatus[tag] = addState(
              asset.tagStatus[tag],
              TagState.DIRTY,
            );
          }
        }
      }
    } else {
      // Toggle TO_DELETE flag for all other tags
      state.images[assetIndex].tagStatus[tagName] = toggleState(
        tagState,
        TagState.TO_DELETE,
      );
    }

    // Invalidate tag counts cache
    state.tagCountsCache = null;
  },

  reorderTags: (
    state: ImageAssets,
    {
      payload,
    }: PayloadAction<{ assetId: string; oldIndex: number; newIndex: number }>,
  ) => {
    const { assetId, oldIndex, newIndex } = payload;

    // No need to reorder if indexes are the same
    if (oldIndex === newIndex) return;

    const assetIndex = state.imageIndexById[assetId];
    if (assetIndex === undefined) return;

    const asset = state.images[assetIndex];
    const tagList = asset.tagList;
    const tagStatus = asset.tagStatus;

    // Get the tag being moved
    const tagToMove = tagList[oldIndex];

    // Reorder in place - Immer handles immutability
    tagList.splice(oldIndex, 1);
    tagList.splice(newIndex, 0, tagToMove);

    // Use savedTagList to compare current vs original positions
    const savedTagList = asset.savedTagList || [];

    // Only examine tags in the range that was reordered
    const minIndex = Math.min(oldIndex, newIndex);
    const maxIndex = Math.max(oldIndex, newIndex);

    // Check each tag in the affected range
    for (let i = minIndex; i <= maxIndex; i++) {
      const tag = tagList[i];

      // Skip TO_ADD tags (they're always dirty)
      if (tag && !hasState(tagStatus[tag], TagState.TO_ADD)) {
        const originalIndex = savedTagList.indexOf(tag);

        // If tag is in its original position, remove DIRTY flag
        // Otherwise, add DIRTY flag
        if (originalIndex === i) {
          tagStatus[tag] = removeState(tagStatus[tag], TagState.DIRTY);
        } else {
          tagStatus[tag] = addState(tagStatus[tag], TagState.DIRTY);
        }
      }
    }
  },

  resetTags: (state: ImageAssets, { payload }: PayloadAction<string>) => {
    const assetIndex = state.imageIndexById[payload];
    if (assetIndex === undefined) return;

    const asset = state.images[assetIndex];
    const tagStatus = asset.tagStatus;
    const savedList = asset.savedTagList || [];
    const savedTagsSet = new Set(savedList);

    // Remove TO_ADD tags and tags not in savedList from tagStatus
    for (const tag of Object.keys(tagStatus)) {
      if (hasState(tagStatus[tag], TagState.TO_ADD) || !savedTagsSet.has(tag)) {
        delete tagStatus[tag];
      } else {
        // Reset all remaining flags to SAVED state
        tagStatus[tag] = TagState.SAVED;
      }
    }

    // Ensure all tags in savedList have a status entry
    for (const tag of savedList) {
      if (!(tag in tagStatus)) {
        // If a tag from savedList is missing (was likely renamed), recreate it
        tagStatus[tag] = TagState.SAVED;
      }
    }

    // Restore tagList to saved order - Immer handles immutability
    asset.tagList.length = 0;
    asset.tagList.push(...savedList);

    // Invalidate tag counts cache since TO_ADD/TO_DELETE tags are removed
    state.tagCountsCache = null;
  },

  // Sorting reducers
  setSortType: (state: ImageAssets, { payload }: PayloadAction<SortType>) => {
    state.sortType = payload;
  },

  setSortDirection: (
    state: ImageAssets,
    { payload }: PayloadAction<SortDirection>,
  ) => {
    state.sortDirection = payload;
  },

  toggleSortDirection: (state: ImageAssets) => {
    state.sortDirection = toggleDirection(
      state.sortDirection,
      SortDirection.ASC,
      SortDirection.DESC,
    );
  },

  /**
   * Gathers selected tags to be consecutive, starting at the position of the first selected tag.
   * Works per-asset: gathers whichever of the selected tags are present in that asset.
   * For example: [a] [b] [c] [d] [e] with [b], [d], [e] selected becomes [a] [b] [d] [e] [c]
   */
  gatherTags: (
    state: ImageAssets,
    { payload }: PayloadAction<{ tags: string[]; assetIds?: string[] }>,
  ) => {
    const { tags, assetIds } = payload;
    if (!tags || tags.length < 2) return;

    const tagsToGather = tags;

    // If assetIds provided, only operate on those assets
    const targetAssetIds = assetIds ? new Set(assetIds) : null;

    state.images.forEach((asset) => {
      // Skip if we have a scope and this asset isn't in it
      if (targetAssetIds && !targetAssetIds.has(asset.fileId)) return;
      // Find which of the selected tags exist in this asset
      const presentTags = tagsToGather.filter((tag) =>
        asset.tagList.includes(tag),
      );

      // Need at least 2 tags present in this asset to gather
      if (presentTags.length < 2) return;

      // Find the index of the first tag to gather (in current tag order)
      const firstTagIndex = Math.min(
        ...presentTags.map((tag) => asset.tagList.indexOf(tag)),
      );

      // Get tags in their current order within the asset
      const orderedTagsToGather = asset.tagList.filter((tag) =>
        presentTags.includes(tag),
      );

      // Remove all tags to gather from their current positions
      asset.tagList = asset.tagList.filter((tag) => !presentTags.includes(tag));

      // Insert them consecutively at the first tag's original position
      asset.tagList.splice(firstTagIndex, 0, ...orderedTagsToGather);

      // Update DIRTY flags by comparing with savedTagList
      const savedTagList = asset.savedTagList || [];

      // Check all tags that might have been affected
      asset.tagList.forEach((tag, currentIndex) => {
        // Skip TO_ADD tags (they don't have original positions)
        if (!hasState(asset.tagStatus[tag], TagState.TO_ADD)) {
          const originalIndex = savedTagList.indexOf(tag);

          if (originalIndex === currentIndex) {
            asset.tagStatus[tag] = removeState(
              asset.tagStatus[tag],
              TagState.DIRTY,
            );
          } else {
            asset.tagStatus[tag] = addState(
              asset.tagStatus[tag],
              TagState.DIRTY,
            );
          }
        }
      });
    });
  },

  /**
   * Copies tags from one asset (donor) to multiple target assets (recipients).
   * Only adds tags that don't already exist in each target asset.
   * New tags are marked with TO_ADD state.
   */
  copyTagsToAssets: (
    state: ImageAssets,
    {
      payload,
    }: PayloadAction<{
      tags: string[];
      targetAssetIds: string[];
      position?: 'start' | 'end';
    }>,
  ) => {
    const { tags, targetAssetIds, position = 'end' } = payload;

    if (tags.length === 0 || targetAssetIds.length === 0) return;

    targetAssetIds.forEach((assetId) => {
      const assetIndex = state.imageIndexById[assetId];
      if (assetIndex === undefined) return;

      const asset = state.images[assetIndex];

      // Filter to tags that don't already exist in this asset
      const tagsToAdd = tags.filter(
        (tag) => tag.trim() !== '' && !asset.tagList.includes(tag),
      );

      if (tagsToAdd.length === 0) return;

      if (position === 'start') {
        // Add to the beginning of the list
        asset.tagList.unshift(...tagsToAdd);

        // Mark all existing tags as DIRTY since their positions have shifted
        Object.keys(asset.tagStatus).forEach((existingTag) => {
          if (!hasState(asset.tagStatus[existingTag], TagState.TO_ADD)) {
            asset.tagStatus[existingTag] = addState(
              asset.tagStatus[existingTag],
              TagState.DIRTY,
            );
          }
        });
      } else {
        // Append new tags to the end
        asset.tagList.push(...tagsToAdd);
      }

      // Mark all new tags as TO_ADD
      tagsToAdd.forEach((tag) => {
        asset.tagStatus[tag] = TagState.TO_ADD;
      });
    });

    // Invalidate tag counts cache
    state.tagCountsCache = null;
  },
};
