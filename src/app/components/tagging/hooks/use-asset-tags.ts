import { SyntheticEvent, useCallback, useMemo } from 'react';

import {
  addTag,
  deleteTag,
  reorderTags,
  resetTags,
  saveAsset,
  selectAssetTagCounts,
  selectOrderedTagsWithStatus,
} from '@/app/store/assets';
import { selectFilterTagsSet, toggleTagFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

/**
 * Hook for managing tags for a specific asset
 *
 * This hook provides:
 * 1. Access to tag data for a specific asset
 * 2. Functions to add, delete, and reorder tags
 * 3. Access to global tag information and filter states
 * 4. Functions to save or reset changes
 *
 * It serves as the data interface between the asset store and the tagging components
 *
 * @param assetId - The ID of the asset to manage tags for
 * @returns Object containing tag data and functions to manipulate tags
 */
export const useAssetTags = (assetId: string) => {
  const dispatch = useAppDispatch();

  // Use optimized selector for asset-specific tag counts instead of global
  const assetTagCounts = useAppSelector((state) =>
    selectAssetTagCounts(state, assetId),
  );

  // Use memoized filter tags set
  const filterTagsSet = useAppSelector(selectFilterTagsSet);

  // Memoize the selector to avoid unnecessary re-renders
  const orderedTagsWithStatus = useAppSelector((state) =>
    selectOrderedTagsWithStatus(state, assetId),
  );

  // Memoize the tag list and status object derived from orderedTagsWithStatus
  const tagList = useMemo(
    () =>
      orderedTagsWithStatus.map(
        (tag: { name: string; status: number }) => tag.name,
      ),
    [orderedTagsWithStatus],
  );

  // Keep the tagsByStatus object for compatibility with the rest of the code
  const tagsByStatus = useMemo(
    () =>
      orderedTagsWithStatus.reduce(
        (
          acc: Record<string, number>,
          tag: { name: string; status: number },
        ) => {
          acc[tag.name] = tag.status;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [orderedTagsWithStatus],
  );

  // Function to handle tag toggle (used for filtering)
  const toggleTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.preventDefault();
      dispatch(toggleTagFilter(tagName));
    },
    [dispatch],
  );

  // Handle tag reordering
  const reorderAssetTags = useCallback(
    (oldIndex: number, newIndex: number) => {
      dispatch(
        reorderTags({
          assetId,
          oldIndex,
          newIndex,
        }),
      );
    },
    [dispatch, assetId],
  );

  // Function to add a new tag
  const addNewTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.stopPropagation();

      if (tagName.trim() !== '') {
        if (!tagList.includes(tagName)) {
          dispatch(addTag({ assetId, tagName }));
          return true; // Tag was added successfully
        } else {
          console.log("Couldn't add tag, it's already in the list", tagName);
        }
      } else {
        console.log("Couldn't add tag, it was empty.");
      }
      return false; // Tag was not added
    },
    [dispatch, tagList, assetId],
  );

  // Function to delete a tag
  const deleteAssetTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.stopPropagation();
      dispatch(deleteTag({ assetId, tagName }));
    },
    [dispatch, assetId],
  );

  // Function to save asset changes
  const saveAssetChanges = useCallback(() => {
    const selectedProject = sessionStorage.getItem('selectedProject');
    dispatch(
      saveAsset({
        fileId: assetId,
        projectPath: selectedProject || undefined,
      }),
    );
  }, [dispatch, assetId]);

  // Function to reset asset changes
  const resetAssetChanges = useCallback(() => {
    dispatch(resetTags(assetId));
  }, [dispatch, assetId]);

  return {
    tagList,
    tagsByStatus,
    globalTagList: assetTagCounts,
    filterTagsSet,
    addNewTag,
    toggleTag,
    deleteAssetTag,
    saveAssetChanges,
    resetAssetChanges,
    reorderAssetTags,
  };
};
