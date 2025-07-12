import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { applyFilters } from '../../utils/filter-actions';
import { composeDimensions } from '../../utils/helpers';
import { RootState } from '..';
import { deleteTag } from '../assets';
import { loadAllAssets, saveAllAssets, saveAsset } from '../assets/actions';
import { IoState } from '../assets/types';
import {
  clearExtensionFilters,
  clearFilters,
  clearSizeFilters,
  clearTagFilters,
  FilterMode,
  selectHasActiveFilters,
  setTagFilterMode,
  toggleExtensionFilter,
  toggleModifiedFilter,
  toggleSizeFilter,
  toggleTagFilter,
} from '../filters';

/**
 * Helper function to check if filters need to be cleared
 * after a save action completes
 */
const shouldClearFilters = (state: RootState): boolean => {
  const { assets, filters } = state;

  // Check if we have any active filters
  const hasActiveFilters = selectHasActiveFilters({ filters });
  if (!hasActiveFilters) {
    return false; // No filters to clear
  }

  // Only proceed if we're in the complete state
  if (
    assets.ioState !== IoState.COMPLETE &&
    assets.ioState !== IoState.COMPLETING
  ) {
    return false;
  }

  // Apply the current filters to see if any results remain
  const filteredAssets = applyFilters({
    assets: assets.images,
    filterTags: filters.filterTags,
    filterSizes: filters.filterSizes,
    filterExtensions: filters.filterExtensions,
    filterMode: filters.filterMode,
    showModified: filters.showModified,
  });

  // If there are no filtered results, filters should be cleared
  return filteredAssets.length === 0;
};

/**
 * Check if there are any tag filters that no longer match any images
 */
const findInvalidTagFilters = (state: RootState): string[] => {
  const { assets, filters } = state;

  // Quick return if no tag filters or not in complete state
  if (
    filters.filterTags.length === 0 ||
    (assets.ioState !== IoState.COMPLETE &&
      assets.ioState !== IoState.COMPLETING)
  ) {
    return [];
  }

  // Get all unique tags that exist in the current assets
  const allExistingTags = new Set<string>();
  assets.images.forEach((img) => {
    img.tagList.forEach((tag) => allExistingTags.add(tag));
  });

  // Find tag filters that no longer exist in any asset
  return filters.filterTags.filter((tag) => !allExistingTags.has(tag));
};

/**
 * Check if there are any size filters that no longer match any images
 */
const findInvalidSizeFilters = (state: RootState): string[] => {
  const { assets, filters } = state;

  // Quick return if no size filters or not in complete state
  if (
    filters.filterSizes.length === 0 ||
    (assets.ioState !== IoState.COMPLETE &&
      assets.ioState !== IoState.COMPLETING)
  ) {
    return [];
  }

  // Get all unique sizes that exist in the current assets
  const allExistingSizes = new Set<string>();
  assets.images.forEach((img) => {
    allExistingSizes.add(composeDimensions(img.dimensions));
  });

  // Find size filters that no longer exist in any asset
  return filters.filterSizes.filter((size) => !allExistingSizes.has(size));
};

/**
 * Check if there are any extension filters that no longer match any images
 */
const findInvalidExtensionFilters = (state: RootState): string[] => {
  const { assets, filters } = state;

  // Quick return if no extension filters or not in complete state
  if (
    filters.filterExtensions.length === 0 ||
    (assets.ioState !== IoState.COMPLETE &&
      assets.ioState !== IoState.COMPLETING)
  ) {
    return [];
  }

  // Get all unique extensions that exist in the current assets
  const allExistingExtensions = new Set<string>();
  assets.images.forEach((img) => {
    allExistingExtensions.add(img.fileExtension);
  });

  // Find extension filters that no longer exist in any asset
  return filters.filterExtensions.filter(
    (ext) => !allExistingExtensions.has(ext),
  );
};

/**
 * Clean up invalid filters regardless of current filter mode
 * This is more comprehensive than shouldClearFilters as it works
 * even when the current filter mode doesn't actually apply filters
 */
const cleanupInvalidFilters = (
  state: RootState,
  listenerApi: {
    dispatch: (action: { type: string; payload?: unknown }) => void;
  },
): boolean => {
  const { assets } = state;

  // Only proceed if we're in the complete or completing state (data is stable)
  if (
    assets.ioState !== IoState.COMPLETE &&
    assets.ioState !== IoState.COMPLETING
  ) {
    return false;
  }

  let hasChanges = false;

  // Check for invalid tag filters
  const invalidTagFilters = findInvalidTagFilters(state);
  if (invalidTagFilters.length > 0) {
    // If all tag filters are invalid, clear them all at once
    if (invalidTagFilters.length === state.filters.filterTags.length) {
      listenerApi.dispatch(clearTagFilters());
    } else {
      // Otherwise remove them one by one
      invalidTagFilters.forEach((tag) => {
        listenerApi.dispatch(toggleTagFilter(tag));
      });
    }
    hasChanges = true;
  }

  // Check for invalid size filters
  const invalidSizeFilters = findInvalidSizeFilters(state);
  if (invalidSizeFilters.length > 0) {
    // If all size filters are invalid, clear them all at once
    if (invalidSizeFilters.length === state.filters.filterSizes.length) {
      listenerApi.dispatch(clearSizeFilters());
    } else {
      // Otherwise remove them one by one
      invalidSizeFilters.forEach((size) => {
        listenerApi.dispatch(toggleSizeFilter(size));
      });
    }
    hasChanges = true;
  }

  // Check for invalid extension filters
  const invalidExtFilters = findInvalidExtensionFilters(state);
  if (invalidExtFilters.length > 0) {
    // If all extension filters are invalid, clear them all at once
    if (invalidExtFilters.length === state.filters.filterExtensions.length) {
      listenerApi.dispatch(clearExtensionFilters());
    } else {
      // Otherwise remove them one by one
      invalidExtFilters.forEach((ext) => {
        listenerApi.dispatch(toggleExtensionFilter(ext));
      });
    }
    hasChanges = true;
  }

  return hasChanges;
};
const shouldResetFilterMode = (state: RootState): boolean => {
  const { filters } = state;

  // If there are no active filters but the mode is not SHOW_ALL
  return (
    !selectHasActiveFilters({ filters }) &&
    filters.filterMode !== FilterMode.SHOW_ALL
  );
};

// Create the listener middleware
export const filterManagerMiddleware = createListenerMiddleware();

// Add a listener that checks after save operations if we need to clear filters
filterManagerMiddleware.startListening({
  matcher: isAnyOf(
    saveAllAssets.fulfilled,
    saveAsset.fulfilled,
    // completeAfterDelay.fulfilled, // Not needed - saveAllAssets.fulfilled handles it
  ),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Always run the comprehensive cleanup function first to remove invalid filters
    const hasChanges = cleanupInvalidFilters(state, listenerApi);

    // After cleanup, get the updated state and check if we should clear ALL remaining filters
    const updatedState = listenerApi.getState() as RootState;

    // Check if all remaining filters should be cleared (no results after cleanup)
    if (shouldClearFilters(updatedState)) {
      listenerApi.dispatch(clearFilters());
      return;
    }

    // If we made changes but didn't clear all filters, check if we need to reset the filter mode
    if (hasChanges && shouldResetFilterMode(updatedState)) {
      listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
    }
  },
});

// Add a listener that checks after asset loading operations to clean up invalid filters
filterManagerMiddleware.startListening({
  matcher: isAnyOf(loadAllAssets.fulfilled),
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Use the comprehensive cleanup function to remove any invalid filters
    const hasChanges = cleanupInvalidFilters(state, listenerApi);

    // After removing invalid filters, check if we need to reset the filter mode
    if (hasChanges) {
      const updatedState = listenerApi.getState() as RootState;
      if (shouldResetFilterMode(updatedState)) {
        listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
      }
    }
  },
});

// Add a separate listener for filter toggle actions to reset filter mode when all filters are removed
filterManagerMiddleware.startListening({
  matcher: isAnyOf(
    toggleTagFilter,
    toggleSizeFilter,
    toggleExtensionFilter,
    toggleModifiedFilter,
    clearTagFilters,
    clearSizeFilters,
    clearExtensionFilters,
    clearFilters,
  ),
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Check if we need to reset the filter mode after a filter toggle action
    if (shouldResetFilterMode(state)) {
      listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
    }
  },
});

// Add a listener for immediate tag deletions (TO_ADD tags)
filterManagerMiddleware.startListening({
  actionCreator: deleteTag,
  effect: async (action, listenerApi) => {
    const { tagName } = action.payload;
    const state = listenerApi.getState() as RootState;

    // Check if this deleted tag was in the current filters
    if (state.filters.filterTags.includes(tagName)) {
      // Check if this tag still exists in any asset after the deletion
      const tagStillExists = state.assets.images.some((img) =>
        img.tagList.includes(tagName),
      );

      if (!tagStillExists) {
        listenerApi.dispatch(toggleTagFilter(tagName));

        // After removing the filter, check if we need to reset filter mode
        const updatedState = listenerApi.getState() as RootState;
        if (shouldResetFilterMode(updatedState)) {
          listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
        }
      }
    }
  },
});
