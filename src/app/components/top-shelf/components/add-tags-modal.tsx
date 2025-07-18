'use client';

import { BookmarkIcon } from '@heroicons/react/24/outline';
import { createSelector } from '@reduxjs/toolkit';
import { SyntheticEvent, useEffect, useRef, useState } from 'react';

import { selectFilterTags } from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';
import {
  selectAssetsWithSelectedTags,
  selectDuplicateTagInfo,
  selectSelectedAssets,
} from '@/app/store/selection';

import { Button } from '../../shared/button';
import { Checkbox } from '../../shared/checkbox/checkbox';
import { Modal } from '../../shared/modal';
import { MultiTagInput } from '../../shared/multi-tag-input';

type AddTagsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedAssetsCount: number;
  onAddTag: (
    tag: string,
    addToStart?: boolean,
    onlySelectedAssets?: boolean,
    onlyFilteredAssets?: boolean,
  ) => void;
  onClearSelection?: () => void; // Optional callback to clear selection
};

export const AddTagsModal = ({
  isOpen,
  onClose,
  selectedAssetsCount,
  onAddTag,
  onClearSelection,
}: AddTagsModalProps) => {
  const [tags, setTags] = useState<string[]>([]);
  const [keepSelection, setKeepSelection] = useState(false);
  const [addToStart, setAddToStart] = useState(false);

  // New state for dual selection mode
  const [applyToSelectedAssets, setApplyToSelectedAssets] = useState(false);
  const [applyToAssetsWithSelectedTags, setApplyToAssetsWithSelectedTags] =
    useState(false);

  // Get data for dual selection logic
  const filterTags = useAppSelector(selectFilterTags);
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const assetsWithSelectedTags = useAppSelector(selectAssetsWithSelectedTags);

  // Check state conditions
  const hasSelectedAssets = selectedAssetsCount > 0;
  const hasSelectedTags = filterTags.length > 0;
  const assetsWithSelectedTagsCount = assetsWithSelectedTags.length;

  // Calculate the intersection count for summary display
  const intersectionCount =
    hasSelectedAssets && hasSelectedTags
      ? assetsWithSelectedTags.filter((asset) =>
          selectedAssets.includes(asset.fileId),
        ).length
      : 0;

  // For duplicate checking, we'll get the current tag from the multitagInput
  // by using an Effect instead of setting state during render
  const [checkTag, setCheckTag] = useState('');

  // Get duplicate info for the current check tag
  const tagDuplicateInfo = useAppSelector(selectDuplicateTagInfo(checkTag));

  // Create a real memoized selector outside of render
  // This ensures we're not creating a new selector on each render
  const makeTagStatusSelector = () =>
    createSelector(
      [(state) => state, (_state, tagsList: string[]) => tagsList],
      (state, tagsList) => {
        // Return empty array for empty tags to avoid unnecessary processing
        if (!tagsList.length) return [];

        // Process all tags at once inside the memoized function
        return tagsList.map((tag) => {
          const selector = selectDuplicateTagInfo(tag);
          const info = selector(state);

          // Map the tag info to a status
          let status: 'all' | 'some' | 'none' = 'none';
          if (info.isDuplicate) {
            status = info.isAllDuplicates ? 'all' : 'some';
          }

          return { tag, status };
        });
      },
    );

  // Keep the selector instance stable across renders with useRef
  const tagStatusSelectorRef = useRef<ReturnType<typeof makeTagStatusSelector>>(
    makeTagStatusSelector(),
  );
  // Note: No need for initialization check since we provide the initial value above

  // Use the stable selector with the current tags array
  const tagsStatus = useAppSelector((state) =>
    tagStatusSelectorRef.current!(state, tags),
  );

  // Reset the form state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTags([]);
      setCheckTag('');
      setAddToStart(false);
      lastInputRef.current = '';
      setInputChanged(false);
    }
  }, [isOpen]);

  // Initialize checkboxes based on what selections are available
  useEffect(() => {
    if (isOpen) {
      // Set defaults based on what's available
      if (hasSelectedAssets && !hasSelectedTags) {
        // Only assets selected - apply to selected assets
        setApplyToSelectedAssets(true);
        setApplyToAssetsWithSelectedTags(false);
      } else if (!hasSelectedAssets && hasSelectedTags) {
        // Only tags selected - apply to assets with selected tags
        setApplyToSelectedAssets(false);
        setApplyToAssetsWithSelectedTags(true);
      } else if (hasSelectedAssets && hasSelectedTags) {
        // Both available - let user choose, default to both
        setApplyToSelectedAssets(true);
        setApplyToAssetsWithSelectedTags(true);
      } else {
        // Neither available - shouldn't happen but handle gracefully
        setApplyToSelectedAssets(false);
        setApplyToAssetsWithSelectedTags(false);
      }
    }
  }, [isOpen, hasSelectedAssets, hasSelectedTags]);

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    if (tags.length === 0) return;

    // Check that at least one constraint is selected when both are available
    if (
      hasSelectedAssets &&
      hasSelectedTags &&
      !applyToSelectedAssets &&
      !applyToAssetsWithSelectedTags
    ) {
      return; // Don't submit if no constraints are selected
    }

    // Get valid tags that aren't marked as "all"
    const validTags = tags.filter((tag) => {
      const tagInfo = tagsStatus.find((t) => t.tag === tag);
      return !tagInfo || tagInfo.status !== 'all';
    });

    // If adding to start, process tags in reverse order to maintain the original order
    const tagsToProcess = addToStart ? [...validTags].reverse() : validTags;

    tagsToProcess.forEach((tag) => {
      onAddTag(
        tag,
        addToStart,
        applyToSelectedAssets,
        applyToAssetsWithSelectedTags,
      );
    });

    setTags([]);
    if (!keepSelection && onClearSelection) {
      onClearSelection();
    }
    onClose();
  };

  // Let's use a ref to track the last input value
  const lastInputRef = useRef('');

  // Use effect to update the check tag safely
  // We'll use input value change detection instead of the ref as a dependency
  const [inputChanged, setInputChanged] = useState(false);

  useEffect(() => {
    if (inputChanged) {
      setCheckTag(lastInputRef.current);
      setInputChanged(false);
    }
  }, [inputChanged]);

  // Safe duplicate check function that doesn't set state during render
  const handleDuplicateCheck = (tag: string) => {
    // Only update if the tag changed
    if (lastInputRef.current !== tag) {
      lastInputRef.current = tag;
      // Schedule an update after render is complete
      setTimeout(() => setInputChanged(true), 0);
    }

    // Return the appropriate result
    if (checkTag === tag) {
      // If we're currently checking this exact tag, return its info
      return tagDuplicateInfo;
    }

    // Otherwise return a default state
    return {
      isDuplicate: false,
      isAllDuplicates: false,
      duplicateCount: 0,
      totalSelected: selectedAssetsCount,
    };
  };

  // Determine if the form is submittable
  // A tag is valid if it's not marked as "all" (exists on all assets)
  const validTags = tags.filter((tag) => {
    const status = tagsStatus.find((t) => t.tag === tag)?.status;
    return status !== 'all';
  });

  // Check if we have valid input
  const hasNoValidTags = tags.length === 0 || validTags.length === 0;

  // Check if at least one constraint is selected when both are available
  const hasInvalidConstraints =
    hasSelectedAssets &&
    hasSelectedTags &&
    !applyToSelectedAssets &&
    !applyToAssetsWithSelectedTags;

  const isFormInvalid = hasNoValidTags || hasInvalidConstraints;

  // Calculate the summary message for how many assets will be affected
  const getSummaryMessage = () => {
    if (hasSelectedAssets && hasSelectedTags) {
      // Dual selection mode
      if (applyToSelectedAssets && applyToAssetsWithSelectedTags) {
        // Both constraints: intersection
        return `Tags will be added to ${intersectionCount} ${intersectionCount === 1 ? 'asset that is' : 'assets that are'} both selected and have selected tags.`;
      } else if (applyToSelectedAssets) {
        // Only selected assets
        return `Tags will be added to the ${selectedAssetsCount} selected ${selectedAssetsCount === 1 ? 'asset' : 'assets'}.`;
      } else if (applyToAssetsWithSelectedTags) {
        // Only assets with selected tags
        return `Tags will be added to ${assetsWithSelectedTagsCount} ${assetsWithSelectedTagsCount === 1 ? 'asset' : 'assets'} with selected tags.`;
      }
    } else if (hasSelectedAssets) {
      // Only assets selected
      return `Tags will be added to the ${selectedAssetsCount} selected ${selectedAssetsCount === 1 ? 'asset' : 'assets'}.`;
    } else if (hasSelectedTags) {
      // Only tags selected
      return `Tags will be added to ${assetsWithSelectedTagsCount} ${assetsWithSelectedTagsCount === 1 ? 'asset' : 'assets'} with selected tags.`;
    }
    return '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md min-w-[24rem]">
      <div className="relative space-y-4">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-slate-700">Add Tags</h2>

        {/* Selected assets/tags count and description */}
        {hasSelectedAssets && hasSelectedTags ? (
          <p className="text-sm text-slate-500">
            Choose where to add tags:{' '}
            <span className="font-medium">{selectedAssetsCount}</span> selected{' '}
            {selectedAssetsCount === 1 ? 'asset' : 'assets'} and/or{' '}
            <span className="font-medium">{assetsWithSelectedTagsCount}</span>{' '}
            assets with selected tags.
          </p>
        ) : hasSelectedAssets ? (
          <p className="text-sm text-slate-500">
            Adding tags to{' '}
            <span className="font-medium">{selectedAssetsCount}</span> selected{' '}
            {selectedAssetsCount === 1 ? 'asset' : 'assets'}.
          </p>
        ) : hasSelectedTags ? (
          <p className="text-sm text-slate-500">
            Adding tags to{' '}
            <span className="font-medium">{assetsWithSelectedTagsCount}</span>{' '}
            assets with selected tags.
          </p>
        ) : (
          <p className="text-sm text-slate-500">No assets or tags selected.</p>
        )}

        {/* Tag input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <MultiTagInput
              tags={tags}
              onTagsChange={setTags}
              duplicateCheck={handleDuplicateCheck}
              tagStatus={tagsStatus}
              autoFocus
              className="w-full"
            />
          </div>

          {tags.length === 0 ? (
            <p className="text-xs text-slate-700">
              Tags to add to selected assets. Press Enter, Tab, or use commas to
              add new tags.
            </p>
          ) : tagsStatus.some(
              (t) => t.status === 'some' || t.status === 'all',
            ) ? (
            <div className="space-y-2 text-xs text-slate-500">
              {tagsStatus.some((t) => t.status === 'all') && (
                <p className="flex">
                  <span className="mt-0.5 mr-2 h-3 min-w-3 rounded-full border border-rose-400 bg-rose-100"></span>
                  Red tags exist on all selected assets and will be disregarded.
                </p>
              )}
              {tagsStatus.some((t) => t.status === 'some') && (
                <p className="flex">
                  <span className="mt-0.5 mr-2 h-3 min-w-3 rounded-full border border-amber-400 bg-amber-50"></span>
                  Yellow tags exist on some assets and will only be added to
                  assets without them.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Tags will be added to all selected assets that don&apos;t already
              have them.
            </p>
          )}

          {/* Tag position */}
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              isSelected={addToStart}
              onChange={() => setAddToStart((v) => !v)}
              label="Add new tags to the start"
              ariaLabel="Add new tags to the start"
            />
          </div>

          {/* Constraint checkboxes - only show when both assets and tags are available */}
          {hasSelectedAssets && hasSelectedTags ? (
            <>
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  isSelected={applyToSelectedAssets}
                  onChange={() =>
                    setApplyToSelectedAssets(!applyToSelectedAssets)
                  }
                  label={`Add to selected assets (${selectedAssetsCount} ${selectedAssetsCount === 1 ? 'asset' : 'assets'})`}
                  ariaLabel="Add tags to selected assets"
                />
              </div>

              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  isSelected={applyToAssetsWithSelectedTags}
                  onChange={() =>
                    setApplyToAssetsWithSelectedTags(
                      !applyToAssetsWithSelectedTags,
                    )
                  }
                  label={`Add to assets with selected tags (${assetsWithSelectedTagsCount} ${assetsWithSelectedTagsCount === 1 ? 'asset' : 'assets'})`}
                  ariaLabel="Add tags to assets with selected tags"
                />
              </div>

              {hasInvalidConstraints && (
                <p className="text-xs text-red-600">
                  Select at least one option above to proceed.
                </p>
              )}
            </>
          ) : null}

          {/* Summary of how many assets will be affected - show for all cases */}
          {!hasInvalidConstraints && (
            <p className="text-xs text-slate-500">{getSummaryMessage()}</p>
          )}

          {/* Keep selection checkbox */}
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              isSelected={keepSelection}
              onChange={() => setKeepSelection((v) => !v)}
              label="Keep asset selection after adding new tags"
              ariaLabel="Keep asset selection after adding new tags"
            />
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
              disabled={isFormInvalid}
              neutralDisabled
              color="amber"
              size="mediumWide"
            >
              <BookmarkIcon className="mr-1 w-4" />
              Add New Tags
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
