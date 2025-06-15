// Core reducers for the assets slice
import { PayloadAction } from '@reduxjs/toolkit';

import { ImageAssets, TagState } from './types';
import { addState, hasState, toggleState } from './utils';

export const coreReducers = {
  addTag: (
    state: ImageAssets,
    { payload }: PayloadAction<{ assetId: string; tagName: string }>,
  ) => {
    const { assetId, tagName } = payload;

    if (tagName.trim() === '') return;

    const imageIndex = state.images.findIndex(
      (element) => element.fileId === assetId,
    );

    // Even if duplicate tags might exist, we'll only allow adding if not already in the list
    // This prevents inadvertently adding more duplicates
    if (!state.images[imageIndex].tagList.includes(tagName)) {
      state.images[imageIndex].tagList.push(tagName);
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

    console.log(
      'EDIT',
      assetId,
      ':',
      oldTagName,
      '=>',
      newTagName,
      'assetIndex',
      assetIndex,
    );
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

    // Mark tags affected by the reordering as DIRTY
    // Only if they were previously SAVED
    const minIndex = Math.min(oldIndex, newIndex);
    const maxIndex = Math.max(oldIndex, newIndex);

    // Mark all tags in the affected range as DIRTY if they don't already have TO_ADD state
    for (let i = minIndex; i <= maxIndex; i++) {
      const tag = i === newIndex ? tagToMove : newTagList[i];
      if (tag && !hasState(newTagStatus[tag], TagState.TO_ADD)) {
        // Add DIRTY flag without removing other flags
        newTagStatus[tag] = addState(newTagStatus[tag], TagState.DIRTY);
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

    if (assetIndex === -1) return;

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
    // Only include tags that still exist (weren't marked as TO_ADD)
    const newTagList = savedList.filter((tag) => validTags.has(tag));

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
