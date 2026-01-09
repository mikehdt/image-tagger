'use client';

import { BookmarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { RootState } from '@/app/store';
import { selectAllImages, selectFilteredAssets } from '@/app/store/assets';
import { selectHasActiveFilters } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectSelectedAssets,
  selectSelectedAssetsCount,
} from '@/app/store/selection';
import {
  selectDuplicateTagInfo,
  selectTagCoExistence,
} from '@/app/store/selection/combinedSelectors';
import { editTagsAcrossAssets } from '@/app/store/selection/thunks';

import { Button } from '../../shared/button';
import { Modal } from '../../shared/modal';
import { ScopingCheckboxes } from '../../shared/scoping-checkboxes';
import { TagStatusLegend } from '../../shared/tag-status-legend';

/**
 * Enhanced tag processing that handles duplicate tags - allows multiple renames to the same value
 */
const processTagUpdatesWithDuplicateHandling = (
  editedTags: Record<string, string>,
  filterTags: string[],
  getTagStatus: (originalTag: string) => 'none' | 'some' | 'all' | 'duplicate',
): Array<{
  oldTagName: string;
  newTagName: string;
  operation: 'RENAME' | 'DELETE';
}> => {
  const result: Array<{
    oldTagName: string;
    newTagName: string;
    operation: 'RENAME' | 'DELETE';
  }> = [];

  // Process tags in the order they appear in filterTags
  filterTags.forEach((originalTag) => {
    const newValue = editedTags[originalTag];

    // Skip undefined, unchanged, or empty tags
    if (!newValue || originalTag === newValue || newValue.trim() === '') {
      return;
    }

    const trimmedValue = newValue.trim();
    const status = getTagStatus(originalTag);

    // Check if this value would create duplicates in ALL assets - these cannot be renamed
    if (status === 'all') {
      result.push({
        oldTagName: originalTag,
        newTagName: trimmedValue, // Pass the intended target name
        operation: 'DELETE',
      });
      return;
    }

    // Allow all other renames - the thunk will handle duplicate detection at the asset level
    // This means multiple tags can be renamed to the same value, and the thunk will properly
    // handle duplicates within individual assets
    result.push({
      oldTagName: originalTag,
      newTagName: trimmedValue,
      operation: 'RENAME',
    });
  });

  return result;
};

interface EditTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterTags: string[];
}

export const EditTagsModal = ({
  isOpen,
  onClose,
  filterTags,
}: EditTagsModalProps) => {
  const dispatch = useAppDispatch();

  // State for edited tags and UI
  const [editedTags, setEditedTags] = useState<Record<string, string>>(() => {
    // Initialize with original tag values
    return filterTags.reduce(
      (acc, tag) => {
        acc[tag] = tag;
        return acc;
      },
      {} as Record<string, string>,
    );
  });

  // State for the "only apply to filtered assets" checkbox
  // Default to true only if there are active filters
  const [onlyFilteredAssets, setOnlyFilteredAssets] = useState(true);

  // State for the "only apply to selected assets" checkbox
  const [onlySelectedAssets, setOnlySelectedAssets] = useState(false);

  // Get assets for the checkbox logic and scoping
  const allImages = useAppSelector(selectAllImages);
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const hasSelectedAssets = selectedAssetsCount > 0;

  // Compute the effective scoped asset IDs based on checkbox state
  const scopedAssetIds = useMemo(() => {
    const useFiltered = onlyFilteredAssets && hasActiveFilters;
    const useSelected = onlySelectedAssets && hasSelectedAssets;

    if (useFiltered && useSelected) {
      // Intersection of filtered and selected
      const filteredIds = new Set(filteredAssets.map((a) => a.fileId));
      return selectedAssets.filter((id) => filteredIds.has(id));
    } else if (useFiltered) {
      return filteredAssets.map((a) => a.fileId);
    } else if (useSelected) {
      return selectedAssets;
    }
    // No constraints - all assets
    return allImages.map((a) => a.fileId);
  }, [
    onlyFilteredAssets,
    hasActiveFilters,
    onlySelectedAssets,
    hasSelectedAssets,
    filteredAssets,
    selectedAssets,
    allImages,
  ]);

  // Filter the filterTags to only show tags that exist on assets in scope
  const scopedFilterTags = useMemo(() => {
    const scopedIds = new Set(scopedAssetIds);
    const scopedImages = allImages.filter((img) => scopedIds.has(img.fileId));

    // Get all tags that exist on at least one scoped asset
    const tagsInScope = new Set<string>();
    scopedImages.forEach((img) => {
      img.tagList.forEach((tag) => {
        if (filterTags.includes(tag)) {
          tagsInScope.add(tag);
        }
      });
    });

    // Return filterTags in their original order, filtered to those in scope
    return filterTags.filter((tag) => tagsInScope.has(tag));
  }, [filterTags, scopedAssetIds, allImages]);

  // Create a memoized selector for computing tag status info
  // The selector is recreated when editedTags change, but returns cached results for unchanged tags
  const tagsStatusSelector = useMemo(
    () => (state: RootState) => {
      // Return empty object for empty tags to avoid unnecessary processing
      if (Object.keys(editedTags).length === 0) return {};

      const result: Record<
        string,
        {
          isDuplicate: boolean;
          isAllDuplicates: boolean;
          duplicateCount: number;
          totalSelected: number;
          wouldCreateDuplicates?: boolean;
          assetsWithBothTags?: number;
          assetsWithOriginalTag?: number;
        }
      > = {};

      // Process all edited tags at once
      Object.entries(editedTags).forEach(([originalTag, newValue]) => {
        // Skip checks for undefined, unchanged or empty tags
        if (!newValue || originalTag === newValue || newValue.trim() === '') {
          result[originalTag] = {
            isDuplicate: false,
            isAllDuplicates: false,
            duplicateCount: 0,
            totalSelected: 0,
            wouldCreateDuplicates: false,
            assetsWithBothTags: 0,
            assetsWithOriginalTag: 0,
          };
          return;
        }

        // Check for existing tag duplicates using cached selector
        const duplicateInfo = selectDuplicateTagInfo(newValue)(state);

        // Check for tag co-existence using cached selector
        const coExistenceInfo = selectTagCoExistence(
          originalTag.trim(),
          newValue.trim(),
        )(state);

        result[originalTag] = {
          ...duplicateInfo,
          ...coExistenceInfo,
        };
      });

      return result;
    },
    [editedTags],
  );

  // Get tag status info - uses custom equality to prevent unnecessary re-renders
  const memoizedTagsStatus = useAppSelector(
    tagsStatusSelector,
    (a, b) => JSON.stringify(a) === JSON.stringify(b),
  );

  // Reset the form when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset checkboxes based on current state
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional form initialization on modal open
      setOnlyFilteredAssets(hasActiveFilters);
      setOnlySelectedAssets(hasSelectedAssets);
    }
  }, [isOpen, hasActiveFilters, hasSelectedAssets]);

  // Update editedTags when scopedFilterTags change (due to scope checkbox changes)
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional form update when scope changes
      setEditedTags((prev) => {
        // Keep existing edits for tags still in scope, add new tags that came into scope
        const newEditedTags: Record<string, string> = {};
        scopedFilterTags.forEach((tag) => {
          // Preserve existing edit if present, otherwise initialize to original value
          newEditedTags[tag] = prev[tag] !== undefined ? prev[tag] : tag;
        });
        return newEditedTags;
      });
    }
  }, [isOpen, scopedFilterTags]);

  // Handle tag value change for a specific tag
  const handleTagChange = useCallback(
    (originalTag: string, newValue: string) => {
      // Ensure we're not setting undefined values
      const safeValue = newValue || '';

      setEditedTags((prev) => ({
        ...prev,
        [originalTag]: safeValue,
      }));
    },
    [],
  );

  // Helper function to determine tag status based on duplicate info
  const getTagStatus = useCallback(
    (originalTag: string): 'none' | 'some' | 'all' | 'duplicate' => {
      const tagInfo = memoizedTagsStatus[originalTag];
      const newValue = editedTags[originalTag];

      // If newValue is undefined or unchanged or empty, no status
      if (!newValue || originalTag === newValue || newValue.trim() === '') {
        return 'none';
      }

      const trimmedValue = newValue.trim();

      // Check if this value is a duplicate of another edited tag (form-level duplicate)
      const duplicateCount = Object.entries(editedTags).filter(
        ([otherTag, otherValue]) =>
          otherTag !== originalTag && // Not the same tag
          otherValue && // Value exists
          otherValue.trim() === trimmedValue, // Values match
      ).length;

      const hasFormDuplicates = duplicateCount > 0;

      // Check for potential duplicates within the same assets
      // This is the case where an asset has both the original tag and the new tag value
      if (tagInfo?.wouldCreateDuplicates) {
        // Check if duplicates would be created in ALL assets with the original tag or just SOME
        const allAssetsWouldHaveDuplicates =
          tagInfo.assetsWithBothTags === tagInfo.assetsWithOriginalTag;

        if (allAssetsWouldHaveDuplicates) {
          // Every asset that has the original tag also has the new tag
          // Asset-level 'all' takes priority over form duplicates
          return 'all';
        } else {
          // Only some assets that have the original tag also have the new tag
          // Asset-level 'some' takes priority over form duplicates
          return 'some';
        }
      }

      // If we have form duplicates but no asset-level issues, show form duplicate
      if (hasFormDuplicates) {
        return 'duplicate';
      }

      // If the new value is the same as any other original tag (case-sensitive match)
      // but not found in assets, consider it a form duplicate as a warning
      const isAnyOriginalTag = scopedFilterTags.some(
        (tag) => tag !== originalTag && tag === trimmedValue,
      );

      if (isAnyOriginalTag) {
        return 'duplicate';
      }

      // If duplicates exist in assets but it's not another original tag
      // (this might be a new tag that happens to exist in some assets)
      if (tagInfo?.isDuplicate) {
        return tagInfo.isAllDuplicates ? 'all' : 'some';
      }

      return 'none';
    },
    [memoizedTagsStatus, editedTags, scopedFilterTags],
  );

  // Submit the form
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Process all edited tags with enhanced duplicate handling
      // Use scopedFilterTags to only process tags in the current scope
      const processedUpdates = processTagUpdatesWithDuplicateHandling(
        editedTags,
        scopedFilterTags,
        getTagStatus,
      );

      if (processedUpdates.length === 0) {
        onClose();
        return;
      }

      // Dispatch the thunk to update tags with both constraints
      dispatch(
        editTagsAcrossAssets({
          tagUpdates: processedUpdates,
          onlyFilteredAssets: onlyFilteredAssets && hasActiveFilters,
          onlySelectedAssets: onlySelectedAssets && hasSelectedAssets,
        }),
      );

      // Close the modal
      onClose();
    },
    [
      dispatch,
      editedTags,
      scopedFilterTags,
      getTagStatus,
      onClose,
      onlyFilteredAssets,
      hasActiveFilters,
      onlySelectedAssets,
      hasSelectedAssets,
    ],
  );

  // Check if any tags have been modified (allow form duplicates now)
  const hasModifiedTags = Object.entries(editedTags).some(
    ([originalTag, newTag]) => {
      // Must be defined, changed and not empty
      if (!newTag || originalTag === newTag || newTag.trim() === '') {
        return false;
      }

      // Allow all changes except those that would create duplicates in ALL assets
      const status = getTagStatus(originalTag);
      return status !== 'all';
    },
  );

  // Calculate the effective asset count that would be affected
  const effectiveAssetCount = (() => {
    const useFiltered = onlyFilteredAssets && hasActiveFilters;
    const useSelected = onlySelectedAssets && hasSelectedAssets;

    if (useFiltered && useSelected) {
      // Intersection of filtered and selected
      return selectedAssets.filter((assetId) =>
        filteredAssets.some((asset) => asset.fileId === assetId),
      ).length;
    } else if (useFiltered) {
      return filteredAssets.length;
    } else if (useSelected) {
      return selectedAssetsCount;
    }
    // No constraints - applies to all assets with these tags (always valid)
    return -1; // Signal that we're not constraining
  })();

  const hasNoAffectedAssets = effectiveAssetCount === 0;

  // Pre-compute all tag statuses once for use in the UI
  const tagStatuses = scopedFilterTags.map((tag) => ({
    tag,
    status: getTagStatus(tag),
  }));

  // Determine which status types are present
  const hasStatusSome = tagStatuses.some((item) => item.status === 'some');
  const hasStatusAll = tagStatuses.some((item) => item.status === 'all');
  const hasStatusFormDuplicate = tagStatuses.some(
    (item) => item.status === 'duplicate',
  );

  // Calculate the summary message for how many assets will be affected
  const getSummaryMessage = () => {
    const useFiltered = onlyFilteredAssets && hasActiveFilters;
    const useSelected = onlySelectedAssets && hasSelectedAssets;

    if (useFiltered && useSelected) {
      // Both constraints active: intersection of filtered and selected
      const intersection = selectedAssets.filter((assetId) =>
        filteredAssets.some((asset) => asset.fileId === assetId),
      ).length;
      return `Tag changes will apply to ${intersection} ${intersection === 1 ? 'asset that is' : 'assets that are'} both filtered and selected.`;
    } else if (useFiltered) {
      // Only filtered constraint active
      return `Tag changes will apply to the ${filteredAssets.length} currently filtered ${filteredAssets.length === 1 ? 'asset' : 'assets'}.`;
    } else if (useSelected) {
      // Only selected constraint active
      return `Tag changes will apply to the ${selectedAssetsCount} selected ${selectedAssetsCount === 1 ? 'asset' : 'assets'}.`;
    }
    // No constraints active
    return 'Tag changes will apply to all assets that have these tags.';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md min-w-[24rem]">
      <div className="flex flex-wrap gap-4">
        {/* Title */}
        <h2 className="w-full text-2xl font-semibold text-slate-700 dark:text-slate-200">
          Edit Tags
        </h2>

        {/* Scoping checkboxes - at top so tag list can react to scope changes */}
        <ScopingCheckboxes
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredAssets.length}
          scopeToFiltered={onlyFilteredAssets}
          onScopeToFilteredChange={setOnlyFilteredAssets}
          hasSelectedAssets={hasSelectedAssets}
          selectedCount={selectedAssetsCount}
          scopeToSelected={onlySelectedAssets}
          onScopeToSelectedChange={setOnlySelectedAssets}
          showBorder
        />

        {/* Summary message */}
        {hasNoAffectedAssets ? (
          <p className="text-xs text-rose-600">
            No assets match the current selection and filter combination.
          </p>
        ) : (
          <p className="text-xs text-slate-500">{getSummaryMessage()}</p>
        )}

        {/* Selected tags count - now shows scoped count */}
        <p className="text-sm text-slate-500">
          {scopedFilterTags.length === 0 ? (
            'No selected tags exist on assets in the current scope.'
          ) : (
            <>
              Editing{' '}
              <span className="font-medium">{scopedFilterTags.length}</span>{' '}
              {scopedFilterTags.length === 1 ? 'tag' : 'tags'}
              {scopedFilterTags.length < filterTags.length && (
                <span className="text-slate-400">
                  {' '}
                  (of {filterTags.length} selected)
                </span>
              )}
              .
            </>
          )}
        </p>

        {/* Tag editing form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-3">
            {tagStatuses.map(({ tag, status }, index) => {
              // Define style variants based on status
              const inputStyles = {
                none: 'border-slate-300 inset-shadow-slate-300/0 focus:inset-shadow-slate-300 focus:border-blue-500 focus:ring-slate-500 focus:outline-slate-500 dark:border-slate-500 dark:focus:inset-shadow-slate-600',
                some: 'border-amber-300 bg-amber-50 text-amber-800 inset-shadow-amber-300/0 focus:inset-shadow-amber-300 focus:border-amber-500 focus:ring-amber-500 dark:border-amber-500 dark:focus:inset-shadow-amber-600',
                all: 'border-rose-300 bg-rose-50 text-rose-800 inset-shadow-rose-300/0 focus:inset-shadow-rose-300 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-500 dark:focus:inset-shadow-rose-600',
                duplicate:
                  'border-purple-300 bg-purple-50 text-purple-800 inset-shadow-purple-300/0 focus:inset-shadow-purple-300 focus:border-purple-500 focus:ring-purple-500 dark:border-purple-500 dark:focus:inset-shadow-purple-600',
              };

              // Get duplicate info for tooltips
              const info = memoizedTagsStatus[tag] || {
                isDuplicate: false,
                duplicateCount: 0,
                totalSelected: 0,
                isAllDuplicates: false,
              };

              // Generate appropriate tooltip text
              let tooltipText = '';
              if (status === 'some') {
                if (info.wouldCreateDuplicates) {
                  // This is the case where changing the tag would create duplicates in SOME assets
                  tooltipText = `Would create duplicates in ${info.assetsWithBothTags} of ${info.assetsWithOriginalTag} assets with this tag`;
                } else {
                  // This is just a regular "exists in some assets" case
                  tooltipText = `Tag exists in ${info.duplicateCount} of ${info.totalSelected} selected assets`;
                }
              } else if (status === 'all') {
                if (info.wouldCreateDuplicates) {
                  // This is the case where changing the tag would create duplicates in ALL assets
                  tooltipText = `Would create duplicates in ALL ${info.assetsWithOriginalTag} assets with this tag`;
                } else {
                  // This is the case where the tag exists in all selected assets
                  tooltipText = `Tag already exists in all ${info.totalSelected} selected assets`;
                }
              } else if (status === 'duplicate') {
                tooltipText =
                  'Multiple tags are being renamed to the same value - duplicates within assets will be cleaned up automatically';
              }

              return (
                <div key={`${tag}-${index}`} className="flex w-full items-center">
                  {/* Original tag */}
                  <div className="relative w-1/2 truncate pr-10 font-medium text-slate-500 dark:text-slate-400">
                    {tag}
                    <div className="absolute top-0 right-0 w-10 text-center text-slate-700 dark:text-slate-500">
                      -&gt;
                    </div>
                  </div>

                  {/* Edit field */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={editedTags[tag] || ''}
                      onChange={(e) => handleTagChange(tag, e.target.value)}
                      className={`w-full rounded-full border px-4 py-1 inset-shadow-sm focus:outline ${inputStyles[status] || inputStyles.none}`}
                      placeholder="New tag name"
                      title={tooltipText}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <p className="w-full">
              Editing a tag will update it across all assets where it appears.
              Multiple tags can be renamed to the same value - duplicate tags
              within assets will be automatically cleaned up.
            </p>

            <TagStatusLegend
              all={{
                show: hasStatusAll,
                message:
                  'Red highlights indicate the tag would create duplicates in all assets that have this tag.',
              }}
              some={{
                show: hasStatusSome,
                message:
                  'Yellow highlights indicate the tag exists in some assets or would create duplicates in some (but not all) assets.',
              }}
              duplicate={{
                show: hasStatusFormDuplicate,
                message:
                  'Purple highlights indicate multiple tags are being renamed to the same value.',
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex w-full justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={onClose}
              color="slate"
              size="mediumWide"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                !hasModifiedTags ||
                hasNoAffectedAssets ||
                scopedFilterTags.length === 0
              }
              neutralDisabled
              color="indigo"
              size="mediumWide"
            >
              <BookmarkIcon className="mr-1 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
