// Core reducers for the assets slice
import { PayloadAction } from '@reduxjs/toolkit';

import { ImageAssets, IoState, TagState } from './types';
import { addState, hasState, removeState, toggleState } from './utils';

export const coreReducers = {
  // Set project information
  setProjectInfo: (
    state: ImageAssets,
    {
      payload,
    }: PayloadAction<{ name: string; path: string; thumbnail?: string }>,
  ) => {
    state.projectName = payload.name;
    state.projectPath = payload.path;
    state.projectThumbnail = payload.thumbnail;
  },

  // Reset assets to initial state (useful when switching projects)
  resetAssetsState: (state: ImageAssets) => {
    state.ioState = IoState.INITIAL;
    state.ioMessage = undefined;
    state.images = [];
    state.loadProgress = undefined;
    state.saveProgress = undefined;
    state.projectName = undefined;
    state.projectPath = undefined;
    state.projectThumbnail = undefined;
  },

  markFilterTagsToDelete: (
    state: ImageAssets,
    { payload }: PayloadAction<string[]>,
  ) => {
    if (!payload || payload.length === 0) return;

    // Iterate over all images and mark matching tags for deletion
    state.images.forEach((image) => {
      payload.forEach((filterTag) => {
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

    const imageIndex = state.images.findIndex(
      (element) => element.fileId === assetId,
    );

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
    }
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

    const assetIndex = state.images.findIndex(
      (element) => element.fileId === assetId,
    );

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

    // On cancel, need to also remove superfluous and reset any tag keys missing as a result!
  },

  deleteTag: (
    state: ImageAssets,
    { payload }: PayloadAction<{ assetId: string; tagName: string }>,
  ) => {
    const { assetId, tagName } = payload;

    const assetIndex = state.images.findIndex(
      (element) => element.fileId === assetId,
    );

    // Stop if no tags to operate on
    if (!state.images[assetIndex]?.tagStatus) return;

    const tagState = state.images[assetIndex].tagStatus[tagName];

    // Handle cases based on the current state
    if (hasState(tagState, TagState.TO_ADD)) {
      // For TO_ADD tags, we still want to remove them completely
      delete state.images[assetIndex].tagStatus[tagName];
      state.images[assetIndex].tagList.splice(
        state.images[assetIndex].tagList.findIndex((item) => item === tagName),
        1,
      );
    } else {
      // Toggle TO_DELETE flag for all other tags
      state.images[assetIndex].tagStatus[tagName] = toggleState(
        tagState,
        TagState.TO_DELETE,
      );
    }
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

    const assetIndex = state.images.findIndex(
      (element) => element.fileId === assetId,
    );

    if (assetIndex === -1) return;

    const asset = { ...state.images[assetIndex] };

    // Get the tag being moved
    const tagToMove = asset.tagList[oldIndex];

    // Create a completely new tag list
    const newTagList = [...asset.tagList];
    newTagList.splice(oldIndex, 1);
    newTagList.splice(newIndex, 0, tagToMove);

    // Create a new tag status object
    const newTagStatus = { ...asset.tagStatus };

    // Use savedTagList to compare current vs original positions
    const savedTagList = asset.savedTagList || [];

    // Only examine tags in the range that was reordered
    const minIndex = Math.min(oldIndex, newIndex);
    const maxIndex = Math.max(oldIndex, newIndex);

    // Check each tag in the affected range
    for (let i = minIndex; i <= maxIndex; i++) {
      const tag = i === newIndex ? tagToMove : newTagList[i];

      // Skip TO_ADD tags (they're always dirty)
      if (tag && !hasState(newTagStatus[tag], TagState.TO_ADD)) {
        const originalIndex = savedTagList.indexOf(tag);

        // If tag is in its original position, remove DIRTY flag
        // Otherwise, add DIRTY flag
        if (originalIndex === i) {
          newTagStatus[tag] = removeState(newTagStatus[tag], TagState.DIRTY);
        } else {
          newTagStatus[tag] = addState(newTagStatus[tag], TagState.DIRTY);
        }
      }
    }

    // Replace the entire asset with a new object
    state.images = [
      ...state.images.slice(0, assetIndex),
      {
        ...asset,
        tagList: newTagList,
        tagStatus: newTagStatus,
      },
      ...state.images.slice(assetIndex + 1),
    ];
  },

  resetTags: (state: ImageAssets, { payload }: PayloadAction<string>) => {
    const assetIndex = state.images.findIndex(
      (element) => element.fileId === payload,
    );

    const asset = { ...state.images[assetIndex] };
    const newTagStatus = { ...asset.tagStatus };

    // Start with the saved order as our base
    const savedList = [...(asset.savedTagList || [])];

    // Create filter map of valid tags (those that are not TO_ADD)
    const validTags = new Set();
    asset.tagList.forEach((tag) => {
      // Skip TO_ADD tags
      if (hasState(newTagStatus[tag], TagState.TO_ADD)) {
        delete newTagStatus[tag];
      } else {
        validTags.add(tag);
        // Reset all flags to SAVED state
        newTagStatus[tag] = TagState.SAVED;
      }
    });

    // Generate the restored tag list from the saved order
    // Include all tags from savedList, as they're part of the original state
    const newTagList = [...savedList];

    // Create a Set from savedList for efficient lookup
    const savedTagsSet = new Set(savedList);

    // Clean up tagStatus by removing any tags not in savedList
    Object.keys(newTagStatus).forEach((tag) => {
      if (!savedTagsSet.has(tag)) {
        delete newTagStatus[tag];
      }
    });

    // Ensure all tags in savedList have a status entry
    savedList.forEach((tag) => {
      if (!newTagStatus[tag]) {
        // If a tag from savedList is missing (was likely renamed), recreate it
        newTagStatus[tag] = TagState.SAVED;
      }
    });

    // Replace the entire asset with a new object
    state.images = [
      ...state.images.slice(0, assetIndex),
      {
        ...asset,
        tagList: newTagList,
        tagStatus: newTagStatus,
      },
      ...state.images.slice(assetIndex + 1),
    ];
  },
};
