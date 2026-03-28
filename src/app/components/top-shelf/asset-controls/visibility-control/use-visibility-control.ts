import { useCallback, useMemo } from 'react';

import {
  selectHasModifiedAssets,
  selectHasSubfolderAssets,
  selectHasTaglessAssets,
} from '@/app/store/assets';
import {
  ClassFilterMode,
  selectFilterCount,
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
  // Single memoised selector for all filter counts — avoids 6 array subscriptions
  const filterCount = useAppSelector(selectFilterCount);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const hasTaglessAssets = useAppSelector(selectHasTaglessAssets);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);
  const hasSubfolderAssets = useAppSelector(selectHasSubfolderAssets);

  const sections: SectionConfig[] = useMemo(() => {
    const all: SectionConfig[] = [
      {
        key: 'tags',
        label: 'Tags',
        count: filterCount.tags,
        mode: visibility.tags,
        available: filterCount.tags > 0,
        emptyMessage: 'No tags selected',
      },
      {
        key: 'nameSearch',
        label: 'Name search',
        count: filterCount.filenamePatterns,
        mode: visibility.nameSearch,
        available: filterCount.filenamePatterns > 0,
        emptyMessage: 'No name searches',
      },
      {
        key: 'sizes',
        label: 'Sizes',
        count: filterCount.sizes,
        mode: visibility.sizes,
        available: filterCount.sizes > 0,
        emptyMessage: 'No sizes selected',
      },
      {
        key: 'buckets',
        label: 'Buckets',
        count: filterCount.buckets,
        mode: visibility.buckets,
        available: filterCount.buckets > 0,
        emptyMessage: 'No buckets selected',
      },
      {
        key: 'extensions',
        label: 'Extensions',
        count: filterCount.extensions,
        mode: visibility.extensions,
        available: filterCount.extensions > 0,
        emptyMessage: 'No types selected',
      },
      ...(hasSubfolderAssets
        ? [
            {
              key: 'subfolders' as VisibilityClassKey,
              label: 'Subfolders',
              count: filterCount.subfolders,
              mode: visibility.subfolders,
              available: filterCount.subfolders > 0,
              emptyMessage: 'No folders selected',
            },
          ]
        : []),
    ];
    return all;
  }, [filterCount, hasSubfolderAssets, visibility]);

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
