import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { composeDimensions } from '../../utils/helpers';
import { RootState } from '..';
import { addTag, deleteTag, editTag, selectHasTaglessAssets } from '../assets';
import { loadAllAssets, saveAllAssets, saveAsset } from '../assets/actions';
import { IoState } from '../assets/types';
import {
  clearBucketFilters,
  clearExtensionFilters,
  clearSizeFilters,
  clearTagFilters,
  FilterMode,
  selectHasActiveFilters,
  setTagFilterMode,
  toggleBucketFilter,
  toggleExtensionFilter,
  toggleSizeFilter,
  toggleTagFilter,
} from '../filters';

/**
 * Generic helper to find invalid filters
 */
const findInvalidFilters = <T extends string>(
  activeFilters: T[],
  existingValues: Set<T>,
): T[] => {
  if (activeFilters.length === 0) return [];
  return activeFilters.filter((filter) => !existingValues.has(filter));
};

/**
 * Extract all existing filter values from assets
 */
const extractExistingValues = (state: RootState) => {
  const tags = new Set<string>();
  const sizes = new Set<string>();
  const buckets = new Set<string>();
  const extensions = new Set<string>();

  state.assets.images.forEach((img) => {
    img.tagList.forEach((tag) => tags.add(tag));
    sizes.add(composeDimensions(img.dimensions));
    buckets.add(`${img.bucket.width}×${img.bucket.height}`);
    extensions.add(img.fileExtension);
  });

  return { tags, sizes, buckets, extensions };
};

/**
 * Clean up invalid filters and return whether any changes were made
 */
const cleanupInvalidFilters = (
  state: RootState,
  dispatch: (action: any) => void,
): boolean => {
  const { assets, filters } = state;

  // Only proceed if data is stable
  if (
    assets.ioState !== IoState.COMPLETE &&
    assets.ioState !== IoState.COMPLETING
  ) {
    return false;
  }

  const existing = extractExistingValues(state);
  let hasChanges = false;

  // Remove invalid tag filters
  const invalidTags = findInvalidFilters(filters.filterTags, existing.tags);
  if (invalidTags.length > 0) {
    if (invalidTags.length === filters.filterTags.length) {
      dispatch(clearTagFilters());
    } else {
      invalidTags.forEach((tag) => dispatch(toggleTagFilter(tag)));
    }
    hasChanges = true;
  }

  // Remove invalid size filters
  const invalidSizes = findInvalidFilters(filters.filterSizes, existing.sizes);
  if (invalidSizes.length > 0) {
    if (invalidSizes.length === filters.filterSizes.length) {
      dispatch(clearSizeFilters());
    } else {
      invalidSizes.forEach((size) => dispatch(toggleSizeFilter(size)));
    }
    hasChanges = true;
  }

  // Remove invalid bucket filters
  const invalidBuckets = findInvalidFilters(
    filters.filterBuckets,
    existing.buckets,
  );
  if (invalidBuckets.length > 0) {
    if (invalidBuckets.length === filters.filterBuckets.length) {
      dispatch(clearBucketFilters());
    } else {
      invalidBuckets.forEach((bucket) => dispatch(toggleBucketFilter(bucket)));
    }
    hasChanges = true;
  }

  // Remove invalid extension filters
  const invalidExtensions = findInvalidFilters(
    filters.filterExtensions,
    existing.extensions,
  );
  if (invalidExtensions.length > 0) {
    if (invalidExtensions.length === filters.filterExtensions.length) {
      dispatch(clearExtensionFilters());
    } else {
      invalidExtensions.forEach((ext) => dispatch(toggleExtensionFilter(ext)));
    }
    hasChanges = true;
  }

  return hasChanges;
};

/**
 * Check if filter mode should be reset to SHOW_ALL
 */
const shouldResetFilterMode = (state: RootState): boolean => {
  const { filters, selection } = state;

  // TAGLESS mode: reset if no tagless assets exist
  if (filters.filterMode === FilterMode.TAGLESS) {
    return !selectHasTaglessAssets(state);
  }

  // SELECTED_ASSETS mode: reset if no assets selected
  if (filters.filterMode === FilterMode.SELECTED_ASSETS) {
    return selection.selectedAssets.length === 0;
  }

  // General case: reset if no active filters but mode isn't SHOW_ALL
  if (
    !selectHasActiveFilters(state) &&
    filters.filterMode !== FilterMode.SHOW_ALL
  ) {
    return true;
  }

  return false;
};

export const filterManagerMiddleware = createListenerMiddleware();

// Listen to save/load completion and clean up invalid filters
filterManagerMiddleware.startListening({
  matcher: isAnyOf(
    saveAllAssets.fulfilled,
    saveAsset.fulfilled,
    loadAllAssets.fulfilled,
  ),
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Clean up invalid filters
    const hasChanges = cleanupInvalidFilters(state, listenerApi.dispatch);

    // Check if filter mode needs reset (after cleanup)
    if (hasChanges) {
      const updatedState = listenerApi.getState() as RootState;
      if (shouldResetFilterMode(updatedState)) {
        listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
      }
    }
  },
});

// Listen to tag operations and update filters/mode accordingly
filterManagerMiddleware.startListening({
  matcher: isAnyOf(addTag, deleteTag, editTag),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Handle TAGLESS mode auto-exit
    if (state.filters.filterMode === FilterMode.TAGLESS) {
      if (!selectHasTaglessAssets(state)) {
        listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
        return;
      }
    }

    // Handle tag deletion from filters
    if (deleteTag.match(action)) {
      const { tagName } = action.payload;
      if (state.filters.filterTags.includes(tagName)) {
        const tagStillExists = state.assets.images.some((img) =>
          img.tagList.includes(tagName),
        );
        if (!tagStillExists) {
          listenerApi.dispatch(toggleTagFilter(tagName));

          // Check if mode needs reset
          const updatedState = listenerApi.getState() as RootState;
          if (shouldResetFilterMode(updatedState)) {
            listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
          }
        }
      }
    }

    // Handle tag edit in filters
    if (editTag.match(action)) {
      const { oldTagName, newTagName } = action.payload;
      if (state.filters.filterTags.includes(oldTagName)) {
        const oldTagStillExists = state.assets.images.some((img) =>
          img.tagList.includes(oldTagName),
        );

        if (!oldTagStillExists) {
          listenerApi.dispatch(toggleTagFilter(oldTagName));
          if (!state.filters.filterTags.includes(newTagName)) {
            listenerApi.dispatch(toggleTagFilter(newTagName));
          }
        }
      }
    }
  },
});

// Listen to filter toggles and reset mode if needed
filterManagerMiddleware.startListening({
  matcher: isAnyOf(
    toggleTagFilter,
    toggleSizeFilter,
    toggleExtensionFilter,
    toggleBucketFilter,
    clearTagFilters,
    clearSizeFilters,
    clearExtensionFilters,
    clearBucketFilters,
  ),
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Don't auto-reset for TAGLESS mode (has its own logic)
    if (
      state.filters.filterMode !== FilterMode.TAGLESS &&
      shouldResetFilterMode(state)
    ) {
      listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
    }
  },
});
