import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { applyFilters } from '../../utils/filter-actions';
import { RootState } from '..';
import { saveAllAssets, saveAssets } from '../assets/actions';
import { IoState } from '../assets/types';
import { clearFilters, selectHasActiveFilters } from '../filters';

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

// Create the listener middleware
export const filterManagerMiddleware = createListenerMiddleware();

// Add a listener that checks after save operations if we need to clear filters
filterManagerMiddleware.startListening({
  matcher: isAnyOf(saveAllAssets.fulfilled, saveAssets.fulfilled),
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    if (shouldClearFilters(state)) {
      console.log('No filtered results remain after save - clearing filters');
      listenerApi.dispatch(clearFilters());
    }
  },
});
