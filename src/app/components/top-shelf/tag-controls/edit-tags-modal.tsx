'use client';

import { BookmarkIcon } from '@heroicons/react/24/outline';
import { createSelector } from '@reduxjs/toolkit';
import { useCallback, useEffect, useRef, useState } from 'react';

import { selectFilteredAssets, selectImageCount } from '@/app/store/assets';
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
import { Checkbox } from '../../shared/checkbox';
import { Modal } from '../../shared/modal';

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

  // Get filtered assets for the checkbox logic
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const allAssetsLength = useAppSelector(selectImageCount);
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);

  // Check if any filters are currently applied
  const hasActiveFilters = filteredAssets.length !== allAssetsLength;
  const hasSelectedAssets = selectedAssetsCount > 0;

  // For duplicate checking - used to track tag changes
  const lastInputRef = useRef<{ tag: string; value: string }>({
    tag: '',
    value: '',
  });

  // Create a memoized selector for checking duplicates of multiple tags
  const makeTagStatusSelector = () =>
    createSelector(
      [(state) => state, (_state, tagsMap: Record<string, string>) => tagsMap],
      (state, tagsMap) => {
        // Return empty object for empty tags to avoid unnecessary processing
        if (Object.keys(tagsMap).length === 0) return {};

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
        Object.entries(tagsMap).forEach(([originalTag, newValue]) => {
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

          // Check for existing tag duplicates
          const duplicateSelector = selectDuplicateTagInfo(newValue);
          const duplicateInfo = duplicateSelector(state);

          // Check for tag co-existence (critical for catching duplicates within the same assets)
          const coExistenceSelector = selectTagCoExistence(
            originalTag.trim(),
            newValue.trim(),
          );
          const coExistenceInfo = coExistenceSelector(state);

          result[originalTag] = {
            ...duplicateInfo,
            ...coExistenceInfo,
          };
        });

        return result;
      },
    );

  // Keep the selector stable across renders
  const tagStatusSelectorRef = useRef<ReturnType<typeof makeTagStatusSelector>>(
    makeTagStatusSelector(),
  );

  // Get duplicate info for all edited tags
  const tagsStatus = useAppSelector((state) =>
    tagStatusSelectorRef.current!(state, editedTags),
  );

  // Reset the form when the modal opens or when filter tags change
  useEffect(() => {
    if (isOpen) {
      // Make sure we initialize with valid tag values
      setEditedTags(
        filterTags.reduce(
          (acc, tag) => {
            // Ensure we're not adding undefined tags
            if (tag) {
              acc[tag] = tag;
            }
            return acc;
          },
          {} as Record<string, string>,
        ),
      );

      // Reset checkboxes based on current state
      setOnlyFilteredAssets(hasActiveFilters);
      setOnlySelectedAssets(hasSelectedAssets);
    }
  }, [isOpen, filterTags, hasActiveFilters, hasSelectedAssets]);

  // Handle tag value change for a specific tag
  const handleTagChange = useCallback(
    (originalTag: string, newValue: string) => {
      // Ensure we're not setting undefined values
      const safeValue = newValue || '';

      setEditedTags((prev) => ({
        ...prev,
        [originalTag]: safeValue,
      }));

      // Update the current tag reference for tracking changes
      lastInputRef.current = { tag: originalTag, value: safeValue };
    },
    [],
  );

  // Helper function to determine tag status based on duplicate info
  const getTagStatus = useCallback(
    (originalTag: string): 'none' | 'some' | 'all' | 'duplicate' => {
      const tagInfo = tagsStatus[originalTag];
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
      const isAnyOriginalTag = filterTags.some(
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
    [tagsStatus, editedTags, filterTags],
  );

  // Submit the form
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Process all edited tags with enhanced duplicate handling
      const processedUpdates = processTagUpdatesWithDuplicateHandling(
        editedTags,
        filterTags,
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
      filterTags,
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

  // Pre-compute all tag statuses once for use in the UI
  const tagStatuses = filterTags.map((tag) => ({
    tag,
    status: getTagStatus(tag),
  }));

  // Determine which status types are present
  const hasStatusSome = tagStatuses.some((item) => item.status === 'some');
  const hasStatusAll = tagStatuses.some((item) => item.status === 'all');
  const hasStatusFormDuplicate = tagStatuses.some(
    (item) => item.status === 'duplicate',
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md min-w-[24rem]">
      <div className="flex flex-wrap gap-4">
        {/* Title */}
        <h2 className="w-full text-2xl font-semibold text-slate-700">
          Edit Tags
        </h2>

        {/* Selected tags count */}
        <p className="text-sm text-slate-500">
          Editing <span className="font-medium">{filterTags.length}</span>{' '}
          selected {filterTags.length === 1 ? 'tag' : 'tags'}.
        </p>

        {/* Tag editing form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-3">
            {tagStatuses.map(({ tag, status }, index) => {
              // Define style variants based on status
              const inputStyles = {
                none: 'border-slate-300 inset-shadow-slate-300/0 focus:inset-shadow-slate-300 focus:border-blue-500 focus:ring-slate-500 focus:outline-slate-500',
                some: 'border-amber-300 bg-amber-50 text-amber-800 inset-shadow-amber-300/0 focus:inset-shadow-amber-300 focus:border-amber-500 focus:ring-amber-500',
                all: 'border-rose-300 bg-rose-50 text-rose-800 inset-shadow-rose-300/0 focus:inset-shadow-rose-300 focus:border-rose-500 focus:ring-rose-500',
                duplicate:
                  'border-purple-300 bg-purple-50 text-purple-800 inset-shadow-purple-300/0 focus:inset-shadow-purple-300 focus:border-purple-500 focus:ring-purple-500',
              };

              // Get duplicate info for tooltips
              const info = tagsStatus[tag] || {
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
                <div key={`${tag}-${index}`} className="flex items-center">
                  {/* Original tag */}
                  <div className="relative w-1/2 truncate pr-10 font-medium text-slate-500">
                    {tag}
                    <div className="absolute top-0 right-0 w-10 text-center text-slate-700">
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

            {/* Conditionally show the status explanations based on usage */}
            {hasStatusAll && (
              <p className="flex w-full">
                <span className="mt-0.5 mr-2 h-3 min-w-3 rounded-full border border-rose-400 bg-rose-100"></span>
                Red highlights indicate the tag would create duplicates in all
                assets that have this tag.
              </p>
            )}

            {hasStatusSome && (
              <p className="flex w-full">
                <span className="mt-0.5 mr-2 inline-block h-3 min-w-3 rounded-full border border-amber-400 bg-amber-50"></span>
                Yellow highlights indicate the tag exists in some assets or
                would create duplicates in some (but not all) assets.
              </p>
            )}

            {hasStatusFormDuplicate && (
              <p className="flex w-full">
                <span className="mt-0.5 mr-2 h-3 min-w-3 rounded-full border border-purple-400 bg-purple-100"></span>
                Purple highlights indicate multiple tags are being renamed to
                the same value.
              </p>
            )}
          </div>

          {hasActiveFilters ? (
            <div className="flex w-full items-center gap-2 pb-2">
              <Checkbox
                isSelected={onlyFilteredAssets}
                onChange={() => setOnlyFilteredAssets(!onlyFilteredAssets)}
                disabled={!hasActiveFilters}
                label={
                  hasActiveFilters
                    ? `Scope tag edits with filtered assets (${filteredAssets.length} asset${filteredAssets.length !== 1 ? 's' : ''})`
                    : 'Scope tag edits with filtered assets (no filters active)'
                }
                ariaLabel="Scope tag edits with filtered assets"
              />
            </div>
          ) : null}

          {hasSelectedAssets ? (
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                isSelected={onlySelectedAssets}
                onChange={() => setOnlySelectedAssets(!onlySelectedAssets)}
                disabled={!hasSelectedAssets}
                label={
                  hasSelectedAssets
                    ? `Scope tag edits with selected assets (${selectedAssetsCount} ${selectedAssetsCount === 1 ? 'asset' : 'assets'})`
                    : 'Scope tag edits with selected assets (no assets selected)'
                }
                ariaLabel="Scope tag edits with selected assets"
              />
            </div>
          ) : null}

          <p>
            {(() => {
              const useFiltered = onlyFilteredAssets && hasActiveFilters;
              const useSelected = onlySelectedAssets && hasSelectedAssets;

              if (useFiltered && useSelected) {
                // Both constraints active: intersection of filtered and selected
                const intersection = selectedAssets.filter((assetId) =>
                  filteredAssets.some((asset) => asset.fileId === assetId),
                ).length;
                return `Tag changes will apply to ${intersection} ${intersection === 1 ? 'asset that is' : 'assets that are'} both filtered and selected.`;
              } else if (useFiltered && !useSelected) {
                // Only filtered constraint active
                return `Tag changes will apply to the ${filteredAssets.length} currently filtered ${filteredAssets.length === 1 ? 'asset' : 'assets'}.`;
              } else if (!useFiltered && useSelected) {
                // Only selected constraint active
                return `Tag changes will apply to the ${selectedAssetsCount} selected ${selectedAssetsCount === 1 ? 'asset' : 'assets'}.`;
              } else {
                // No constraints active
                return `Tag changes will apply to all assets that have these tags regardless of active filters.`;
              }
            })()}
          </p>

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
              disabled={!hasModifiedTags}
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
