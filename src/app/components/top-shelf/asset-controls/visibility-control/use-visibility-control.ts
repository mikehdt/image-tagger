import { useCallback, useMemo } from 'react';

import {
  selectHasModifiedAssets,
  selectHasSubfolderAssets,
  selectHasTaglessAssets,
} from '@/app/store/assets';
import {
  ClassFilterMode,
  selectFilenamePatterns,
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterSizes,
  selectFilterSubfolders,
  selectFilterTags,
  selectVisibility,
  setVisibilityClassMode,
  toggleVisibilityModified,
  toggleVisibilityScopeSelected,
  toggleVisibilityScopeTagless,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';

type VisibilityClassKey =
  | 'tags'
  | 'nameSearch'
  | 'sizes'
  | 'buckets'
  | 'extensions'
  | 'subfolders';

export type SectionConfig = {
  key: VisibilityClassKey;
  label: string;
  count: number;
  mode: ClassFilterMode;
  available: boolean;
  emptyMessage: string;
};

export const useVisibilityControl = () => {
  const dispatch = useAppDispatch();

  const visibility = useAppSelector(selectVisibility);
  const filterTags = useAppSelector(selectFilterTags);
  const filenamePatterns = useAppSelector(selectFilenamePatterns);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterBuckets = useAppSelector(selectFilterBuckets);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filterSubfolders = useAppSelector(selectFilterSubfolders);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const hasTaglessAssets = useAppSelector(selectHasTaglessAssets);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);
  const hasSubfolderAssets = useAppSelector(selectHasSubfolderAssets);

  const sections: SectionConfig[] = useMemo(() => {
    const all: SectionConfig[] = [
      {
        key: 'tags',
        label: 'Tags',
        count: filterTags.length,
        mode: visibility.tags,
        available: filterTags.length > 0,
        emptyMessage: 'No tags selected',
      },
      {
        key: 'nameSearch',
        label: 'Name search',
        count: filenamePatterns.length,
        mode: visibility.nameSearch,
        available: filenamePatterns.length > 0,
        emptyMessage: 'No name searches',
      },
      {
        key: 'sizes',
        label: 'Sizes',
        count: filterSizes.length,
        mode: visibility.sizes,
        available: filterSizes.length > 0,
        emptyMessage: 'No sizes selected',
      },
      {
        key: 'buckets',
        label: 'Buckets',
        count: filterBuckets.length,
        mode: visibility.buckets,
        available: filterBuckets.length > 0,
        emptyMessage: 'No buckets selected',
      },
      {
        key: 'extensions',
        label: 'Extensions',
        count: filterExtensions.length,
        mode: visibility.extensions,
        available: filterExtensions.length > 0,
        emptyMessage: 'No types selected',
      },
      ...(hasSubfolderAssets
        ? [
            {
              key: 'subfolders' as VisibilityClassKey,
              label: 'Subfolders',
              count: filterSubfolders.length,
              mode: visibility.subfolders,
              available: filterSubfolders.length > 0,
              emptyMessage: 'No folders selected',
            },
          ]
        : []),
    ];
    return all;
  }, [
    filterTags.length,
    filenamePatterns.length,
    filterSizes.length,
    filterBuckets.length,
    filterExtensions.length,
    filterSubfolders.length,
    hasSubfolderAssets,
    visibility,
  ]);

  const handleSetClassMode = useCallback(
    (classKey: VisibilityClassKey, mode: ClassFilterMode) => {
      dispatch(setVisibilityClassMode({ classKey, mode }));
    },
    [dispatch],
  );

  const handleToggleScopeTagless = useCallback(
    () => dispatch(toggleVisibilityScopeTagless()),
    [dispatch],
  );

  const handleToggleScopeSelected = useCallback(
    () => dispatch(toggleVisibilityScopeSelected()),
    [dispatch],
  );

  const handleToggleModified = useCallback(
    () => dispatch(toggleVisibilityModified()),
    [dispatch],
  );

  // Count how many classes/scopes are actively filtering
  // A class only counts if it has both a non-OFF mode AND selections to filter with
  const activeCount = useMemo(() => {
    let count = 0;
    for (const section of sections) {
      if (section.mode !== ClassFilterMode.OFF && section.count > 0) count++;
    }
    if (visibility.scopeTagless) count++;
    if (visibility.scopeSelected) count++;
    if (visibility.showModified) count++;
    return count;
  }, [
    sections,
    visibility.scopeTagless,
    visibility.scopeSelected,
    visibility.showModified,
  ]);

  return {
    sections,
    visibility,
    activeCount,
    selectedAssetsCount,
    hasTaglessAssets,
    hasModifiedAssets,
    handleSetClassMode,
    handleToggleScopeTagless,
    handleToggleScopeSelected,
    handleToggleModified,
  };
};
