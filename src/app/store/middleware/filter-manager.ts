import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { applyFilters } from '../../utils/filter-actions';
import { composeDimensions } from '../../utils/helpers';
import { RootState } from '..';
import { saveAllAssets, saveAssets } from '../assets/actions';
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
  if (assets.ioState !== IoState.COMPLETE) {
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
  if (filters.filterTags.length === 0 || assets.ioState !== IoState.COMPLETE) {
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
  if (filters.filterSizes.length === 0 || assets.ioState !== IoState.COMPLETE) {
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
    assets.ioState !== IoState.COMPLETE
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
 * Check if we need to reset filter mode to SHOW_ALL
 * (when no filters are active)
 */
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
  matcher: isAnyOf(saveAllAssets.fulfilled, saveAssets.fulfilled),
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // First check if all filters need to be cleared
    if (shouldClearFilters(state)) {
      console.log('No filtered results remain after save - clearing filters');
      listenerApi.dispatch(clearFilters());
      return;
    }

    // If specific tag filters are no longer valid, remove them
    const invalidTagFilters = findInvalidTagFilters(state);
    if (invalidTagFilters.length > 0) {
      console.log('Removing invalid tag filters:', invalidTagFilters);

      // If all tag filters are invalid, clear them all at once
      if (invalidTagFilters.length === state.filters.filterTags.length) {
        listenerApi.dispatch(clearTagFilters());
      } else {
        // Otherwise remove them one by one
        invalidTagFilters.forEach((tag) => {
          listenerApi.dispatch(toggleTagFilter(tag));
        });
      }
    }

    // If specific size filters are no longer valid, remove them
    const invalidSizeFilters = findInvalidSizeFilters(state);
    if (invalidSizeFilters.length > 0) {
      console.log('Removing invalid size filters:', invalidSizeFilters);

      // If all size filters are invalid, clear them all at once
      if (invalidSizeFilters.length === state.filters.filterSizes.length) {
        listenerApi.dispatch(clearSizeFilters());
      } else {
        // Otherwise remove them one by one
        invalidSizeFilters.forEach((size) => {
          listenerApi.dispatch(toggleSizeFilter(size));
        });
      }
    }

    // If specific extension filters are no longer valid, remove them
    const invalidExtFilters = findInvalidExtensionFilters(state);
    if (invalidExtFilters.length > 0) {
      console.log('Removing invalid extension filters:', invalidExtFilters);

      // If all extension filters are invalid, clear them all at once
      if (invalidExtFilters.length === state.filters.filterExtensions.length) {
        listenerApi.dispatch(clearExtensionFilters());
      } else {
        // Otherwise remove them one by one
        invalidExtFilters.forEach((ext) => {
          listenerApi.dispatch(toggleExtensionFilter(ext));
        });
      }
    }

    // After removing invalid filters, check if we need to reset the filter mode
    const updatedState = listenerApi.getState() as RootState;
    if (shouldResetFilterMode(updatedState)) {
      console.log('No active filters - resetting filter mode to SHOW_ALL');
      listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
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
      console.log(
        'No active filters after toggle - resetting filter mode to SHOW_ALL',
      );
      listenerApi.dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
    }
  },
});
