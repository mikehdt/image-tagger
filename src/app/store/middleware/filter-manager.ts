import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { applyFilters } from '../../utils/filter-actions';
import { composeDimensions } from '../../utils/helpers';
import { RootState } from '..';
import { addTag, deleteTag, editTag, selectHasTaglessAssets } from '../assets';
import { loadAllAssets, saveAllAssets, saveAsset } from '../assets/actions';
import { IoState } from '../assets/types';
import {
  clearBucketFilters,
  clearExtensionFilters,
  clearFilters,
  clearSizeFilters,
  clearTagFilters,
  FilterMode,
  selectHasActiveFilters,
  setTagFilterMode,
  toggleBucketFilter,
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
    filterBuckets: filters.filterBuckets,
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
 * Check if there are any bucket filters that no longer match any images
 */
const findInvalidBucketFilters = (state: RootState): string[] => {
  const { assets, filters } = state;

  // Quick return if no bucket filters or not in complete state
  if (
    filters.filterBuckets.length === 0 ||
    (assets.ioState !== IoState.COMPLETE &&
      assets.ioState !== IoState.COMPLETING)
  ) {
    return [];
  }

  // Get all unique buckets that exist in the current assets
  const allExistingBuckets = new Set<string>();
  assets.images.forEach((img) => {
    const bucketKey = `${img.bucket.width}×${img.bucket.height}`;
    allExistingBuckets.add(bucketKey);
  });

  // Find bucket filters that no longer exist in any asset
  return filters.filterBuckets.filter(
    (bucket) => !allExistingBuckets.has(bucket),
  );
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

  // Check for invalid bucket filters
  const invalidBucketFilters = findInvalidBucketFilters(state);
  if (invalidBucketFilters.length > 0) {
    // If all bucket filters are invalid, clear them all at once
    if (invalidBucketFilters.length === state.filters.filterBuckets.length) {
      listenerApi.dispatch(clearBucketFilters());
    } else {
      // Otherwise remove them one by one
      invalidBucketFilters.forEach((bucket) => {
        listenerApi.dispatch(toggleBucketFilter(bucket));
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

  // Special cases: modes that should auto-switch when their conditions are no longer met
  // Check these FIRST before general filter logic

  // TAGLESS mode should switch to SHOW_ALL when no tagless assets exist
  if (filters.filterMode === FilterMode.TAGLESS) {
    const hasTaglessAssets = selectHasTaglessAssets(state);
    if (!hasTaglessAssets) {
      return true;
    }
  }

  // SELECTED_ASSETS mode should switch to SHOW_ALL when no assets are selected
  if (filters.filterMode === FilterMode.SELECTED_ASSETS) {
    const selectedAssets = state.selection.selectedAssets;
    if (selectedAssets.length === 0) {
      return true;
    }
  }

  // General case: If there are no active filters but the mode is not SHOW_ALL
  if (
    !selectHasActiveFilters({ filters }) &&
    filters.filterMode !== FilterMode.SHOW_ALL
  ) {
    return true;
  }

  return false;
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
    // BUT NOT if we're in special modes like TAGLESS - those have their own logic
    if (
      updatedState.filters.filterMode !== FilterMode.TAGLESS &&
      shouldClearFilters(updatedState)
    ) {
      listenerApi.dispatch(clearFilters());
      return;
    }

    // If we made changes but didn't clear all filters, check if we need to reset the filter mode
    // BUT NOT if we're in TAGLESS mode - let the tagless-specific logic handle that
    if (
      hasChanges &&
      updatedState.filters.filterMode !== FilterMode.TAGLESS &&
      shouldResetFilterMode(updatedState)
    ) {
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
    editTag,
  ),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Check if we need to reset the filter mode after a filter toggle action
    // BUT NOT if we're in TAGLESS mode - let the tagless-specific logic handle that
    if (
      state.filters.filterMode !== FilterMode.TAGLESS &&
      shouldResetFilterMode(state)
    ) {
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
        // BUT NOT if we're in TAGLESS mode - let the tagless-specific logic handle that
        const updatedState = listenerApi.getState() as RootState;
        if (
          updatedState.filters.filterMode !== FilterMode.TAGLESS &&
          shouldResetFilterMode(updatedState)
        ) {
          listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
        }
      }
    }
  },
});

// Add a listener for tag edits to update filters when the old tag no longer exists
filterManagerMiddleware.startListening({
  actionCreator: editTag,
  effect: async (action, listenerApi) => {
    const { oldTagName, newTagName } = action.payload;
    const state = listenerApi.getState() as RootState;

    // Check if the old tag was in the current filters
    if (state.filters.filterTags.includes(oldTagName)) {
      // Check if the old tag still exists in any asset after the edit
      const oldTagStillExists = state.assets.images.some((img) =>
        img.tagList.includes(oldTagName),
      );

      // If the old tag no longer exists anywhere, replace it with the new tag in filters
      if (!oldTagStillExists) {
        // Remove the old tag from filters
        listenerApi.dispatch(toggleTagFilter(oldTagName));
        // Add the new tag to filters (only if it's not already there)
        if (!state.filters.filterTags.includes(newTagName)) {
          listenerApi.dispatch(toggleTagFilter(newTagName));
        }

        // After updating filters, check if we need to reset filter mode
        const updatedState = listenerApi.getState() as RootState;
        if (shouldResetFilterMode(updatedState)) {
          listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
        }
      }
    }
  },
});

// Add a listener for tag operations that might affect tagless filter mode
filterManagerMiddleware.startListening({
  matcher: isAnyOf(
    saveAllAssets.fulfilled,
    saveAsset.fulfilled,
    addTag,
    deleteTag,
    editTag,
  ),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Check if we're in TAGLESS mode and no longer have tagless assets
    if (state.filters.filterMode === FilterMode.TAGLESS) {
      const hasTaglessAssets = selectHasTaglessAssets(state);

      if (!hasTaglessAssets) {
        // When leaving TAGLESS mode, always switch to SHOW_ALL
        // This preserves any existing filters but shows all assets
        listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
      }
    }
  },
});
