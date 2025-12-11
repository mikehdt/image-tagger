import { SyntheticEvent, useCallback, useMemo } from 'react';

import {
  addTag,
  deleteTag,
  resetTags,
  saveAsset,
  selectOrderedTagsWithStatus,
} from '@/app/store/assets';
import {
  toggleBucketFilter,
  toggleExtensionFilter,
  toggleSizeFilter,
  toggleTagFilter,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

export const useAssetTags = (assetId: string) => {
  const dispatch = useAppDispatch();

  // Only subscribe to this specific asset's tags - no global subscriptions
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

  const addNewTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.stopPropagation();

      if (tagName.trim() !== '') {
        if (!tagList.includes(tagName)) {
          dispatch(addTag({ assetId, tagName }));
          return true; // Tag was added successfully
        } else {
          console.log("Couldn't add tag, it's already is in the list", tagName);
        }
      } else {
        console.log("Couldn't add tag, it was empty.");
      }
      return false; // Tag was not added
    },
    [dispatch, tagList, assetId],
  );

  const toggleTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.preventDefault();
      dispatch(toggleTagFilter(tagName));
    },
    [dispatch],
  );

  const toggleDeleteTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.stopPropagation();
      dispatch(deleteTag({ assetId, tagName }));
    },
    [dispatch, assetId],
  );

  const saveAction = useCallback(() => {
    const selectedProject = sessionStorage.getItem('selectedProject');
    dispatch(
      saveAsset({
        fileId: assetId,
        projectPath: selectedProject || undefined,
      }),
    );
  }, [dispatch, assetId]);

  const cancelAction = useCallback(() => {
    dispatch(resetTags(assetId));
  }, [dispatch, assetId]);

  const toggleSize = useCallback(
    (composedSize: string) => {
      dispatch(toggleSizeFilter(composedSize));
    },
    [dispatch],
  );

  const toggleBucket = useCallback(
    (bucketDimensions: string) => {
      dispatch(toggleBucketFilter(bucketDimensions));
    },
    [dispatch],
  );

  const toggleExtension = useCallback(
    (extension: string) => {
      dispatch(toggleExtensionFilter(extension));
    },
    [dispatch],
  );

  return {
    tagList,
    tagsByStatus,
    addNewTag,
    toggleTag,
    toggleDeleteTag,
    saveAction,
    cancelAction,
    toggleSize,
    toggleBucket,
    toggleExtension,
  };
};
