'use client';

import { BookmarkIcon } from '@heroicons/react/24/outline';
import { createSelector } from '@reduxjs/toolkit';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectDuplicateTagInfo,
  selectTagCoExistence,
} from '../../../store/selection/combinedSelectors';
import { editTagsAcrossAssets } from '../../../store/selection/thunks';
import { Button } from '../../shared/button';
import { Modal } from '../../shared/modal';

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

  // No longer need the effect that was updating the check tag

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
    }
  }, [isOpen, filterTags]);

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

      // Check if this value is a duplicate of another edited tag
      // This is a separate check from the asset-level duplicates
      const trimmedValue = newValue.trim();
      const duplicateCount = Object.entries(editedTags).filter(
        ([otherTag, otherValue]) =>
          otherTag !== originalTag && // Not the same tag
          otherValue && // Value exists
          otherValue.trim() === trimmedValue, // Values match
      ).length;

      if (duplicateCount > 0) {
        // This is a duplicate within the form
        return 'duplicate';
      }

      // Check for potential duplicates within the same assets
      // This is the case where an asset has both the original tag and the new tag value
      if (tagInfo?.wouldCreateDuplicates) {
        // Check if duplicates would be created in ALL assets with the original tag or just SOME
        const allAssetsWouldHaveDuplicates =
          tagInfo.assetsWithBothTags === tagInfo.assetsWithOriginalTag;

        if (allAssetsWouldHaveDuplicates) {
          // Every asset that has the original tag also has the new tag
          return 'all'; // Complete duplicate, prevent saving
        } else {
          // Only some assets that have the original tag also have the new tag
          return 'some'; // Partial duplicate, show amber warning
        }
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

      // Filter out unchanged tags and tags that are duplicate in all assets
      const tagUpdates = Object.entries(editedTags)
        .filter(([oldTagName, newTagName]) => {
          // Skip undefined, unchanged, or empty tags
          if (
            !newTagName ||
            oldTagName === newTagName ||
            newTagName.trim() === ''
          ) {
            return false;
          }

          // Skip tags that exist in all assets (complete duplicates) or form duplicates
          const status = getTagStatus(oldTagName);
          return status !== 'all' && status !== 'duplicate';
        })
        .map(([oldTagName, newTagName]) => ({
          oldTagName,
          newTagName: newTagName.trim(),
        }));

      if (tagUpdates.length === 0) {
        onClose();
        return;
      }

      // Dispatch the thunk to update tags
      dispatch(editTagsAcrossAssets(tagUpdates));

      // Close the modal
      onClose();
    },
    [dispatch, editedTags, getTagStatus, onClose],
  );

  // Check if any tags have been modified and are not duplicates in all assets
  const hasModifiedTags = Object.entries(editedTags).some(
    ([originalTag, newTag]) => {
      // Must be defined, changed and not empty
      if (!newTag || originalTag === newTag || newTag.trim() === '') {
        return false;
      }

      // Must not be a duplicate in all assets or form duplicate
      const status = getTagStatus(originalTag);
      return status !== 'all' && status !== 'duplicate';
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
      <div className="relative space-y-4">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-slate-700">Edit Tags</h2>

        {/* Selected tags count */}
        <p className="text-sm text-slate-500">
          Editing <span className="font-medium">{filterTags.length}</span>{' '}
          selected {filterTags.length === 1 ? 'tag' : 'tags'}.
        </p>

        {/* Tag editing form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {tagStatuses.map(({ tag, status }) => {
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
                tooltipText = 'Multiple tags cannot have the same value';
              }

              return (
                <div key={tag} className="flex items-center">
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

          <div className="space-y-4 text-xs text-slate-500">
            <p>
              Editing a tag will update it across all assets where it appears.
            </p>

            {/* Conditionally show the status explanations based on usage */}
            {hasStatusAll && (
              <p className="flex">
                <span className="mt-0.5 mr-2 h-3 min-w-3 rounded-full border border-rose-400 bg-rose-100"></span>
                Red highlights indicate the tag exists in all assets and would
                create duplicates in all assets.
              </p>
            )}

            {hasStatusSome && (
              <p className="flex">
                <span className="mt-0.5 mr-2 inline-block h-3 min-w-3 rounded-full border border-amber-400 bg-amber-50"></span>
                Yellow highlights indicate the tag exists in some assets or
                would create duplicates in some (but not all) assets.
              </p>
            )}

            {hasStatusFormDuplicate && (
              <p className="flex">
                <span className="mt-0.5 mr-2 h-3 min-w-3 rounded-full border border-purple-400 bg-purple-100"></span>{' '}
                Purple highlights indicate duplicate tag names within the form.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2">
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
