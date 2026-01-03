'use client';

import { BookmarkIcon } from '@heroicons/react/24/outline';
import { SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';

import type { RootState } from '@/app/store';
import { selectHasActiveFilters } from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';
import {
  selectAssetsWithActiveFilters,
  selectDuplicateTagInfo,
  selectSelectedAssets,
  selectSelectedAssetsCount,
} from '@/app/store/selection';

import { Button } from '../../shared/button';
import { Checkbox } from '../../shared/checkbox';
import { Modal } from '../../shared/modal';
import { MultiTagInput } from '../../shared/multi-tag-input';
import { RadioGroup } from '../../shared/radio-group';
import { ScopingCheckboxes } from '../../shared/scoping-checkboxes';
import { TagStatusLegend } from '../../shared/tag-status-legend';

type AddTagsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddTag: (
    tag: string,
    addToStart?: boolean,
    onlySelectedAssets?: boolean,
    onlyFilteredAssets?: boolean,
  ) => void;
  onAddMultipleTags?: (
    tags: string[],
    addToStart?: boolean,
    onlySelectedAssets?: boolean,
    onlyFilteredAssets?: boolean,
  ) => void;
  onClearSelection?: () => void; // Optional callback to clear selection
};

export const AddTagsModal = ({
  isOpen,
  onClose,
  onAddTag,
  onAddMultipleTags,
  onClearSelection,
}: AddTagsModalProps) => {
  const [tags, setTags] = useState<string[]>([]);
  const [keepSelection, setKeepSelection] = useState(false);
  const [addToStart, setAddToStart] = useState(false);

  // New state for dual selection mode
  const [applyToSelectedAssets, setApplyToSelectedAssets] = useState(false);
  const [applyToAssetsWithActiveFilters, setApplyToAssetsWithActiveFilters] =
    useState(false);

  // Get data for dual selection logic
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const assetsWithActiveFilters = useAppSelector(selectAssetsWithActiveFilters);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);

  // Check state conditions
  const hasSelectedAssets = selectedAssetsCount > 0;
  const assetsWithActiveFiltersCount = assetsWithActiveFilters.length;

  // Calculate the intersection count for summary display
  const intersectionCount =
    hasSelectedAssets && hasActiveFilters
      ? assetsWithActiveFilters.filter((asset) =>
          selectedAssets.includes(asset.fileId),
        ).length
      : 0;

  // For duplicate checking in the input field
  const [checkTag, setCheckTag] = useState('');
  const pendingCheckTagRef = useRef('');

  // Get duplicate info for the current check tag (cached selector)
  const tagDuplicateInfo = useAppSelector(selectDuplicateTagInfo(checkTag));

  // Sync checkTag with pending value after render to avoid setState-during-render
  useEffect(() => {
    if (pendingCheckTagRef.current !== checkTag) {
      setCheckTag(pendingCheckTagRef.current);
    }
  }, [checkTag]);

  // Create a memoized selector for getting all tag statuses
  // The selector is recreated when tags change, but returns cached results for unchanged tags
  const tagsStatusSelector = useMemo(
    () => (state: RootState) =>
      tags.map((tag) => {
        const info = selectDuplicateTagInfo(tag)(state);
        let status: 'all' | 'some' | 'none' = 'none';
        if (info.isDuplicate) {
          status = info.isAllDuplicates ? 'all' : 'some';
        }
        return { tag, status };
      }),
    [tags],
  );

  // Get status for all tags - uses custom equality to prevent unnecessary re-renders
  const memoizedTagsStatus = useAppSelector(
    tagsStatusSelector,
    (a, b) => JSON.stringify(a) === JSON.stringify(b),
  );

  // Reset the form state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional form reset on modal close
      setTags([]);
      setCheckTag('');
      pendingCheckTagRef.current = '';
      setAddToStart(false);
    }
  }, [isOpen]);

  // Initialize checkboxes based on what selections are available
  useEffect(() => {
    if (isOpen) {
      // Simply enable each constraint if it's available
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional form initialization on modal open
      setApplyToSelectedAssets(hasSelectedAssets);
      setApplyToAssetsWithActiveFilters(hasActiveFilters);
    }
  }, [isOpen, hasSelectedAssets, hasActiveFilters]);

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    if (tags.length === 0) return;

    // Check that at least one constraint is selected when both are available
    if (
      hasSelectedAssets &&
      hasActiveFilters &&
      !applyToSelectedAssets &&
      !applyToAssetsWithActiveFilters
    ) {
      return; // Don't submit if no constraints are selected
    }

    // Get valid tags that aren't marked as "all"
    const validTags = tags.filter((tag) => {
      const tagInfo = memoizedTagsStatus.find((t) => t.tag === tag);
      return !tagInfo || tagInfo.status !== 'all';
    });

    // Use batched approach if we have multiple tags and the callback is available
    if (validTags.length > 1 && onAddMultipleTags) {
      // For batch operations, maintain original order (no need to reverse)
      onAddMultipleTags(
        validTags,
        addToStart,
        applyToSelectedAssets,
        applyToAssetsWithActiveFilters,
      );
    } else {
      // Fall back to individual tag addition for single tags or if batch function not available
      // If adding to start, process tags in reverse order to maintain the original order
      const tagsToProcess = addToStart ? [...validTags].reverse() : validTags;

      tagsToProcess.forEach((tag) => {
        onAddTag(
          tag,
          addToStart,
          applyToSelectedAssets,
          applyToAssetsWithActiveFilters,
        );
      });
    }

    setTags([]);
    if (!keepSelection && onClearSelection) {
      onClearSelection();
    }
    onClose();
  };

  // Duplicate check function for the input field
  const handleDuplicateCheck = (tag: string) => {
    // Store the tag in a ref to be synced via useEffect (avoids setState during render)
    pendingCheckTagRef.current = tag;
    return tagDuplicateInfo;
  };

  // Determine if the form is submittable
  // A tag is valid if it's not marked as "all" (exists on all assets)
  const validTags = tags.filter((tag) => {
    const status = memoizedTagsStatus.find((t) => t.tag === tag)?.status;
    return status !== 'all';
  });

  // Check if we have valid input
  const hasNoValidTags = tags.length === 0 || validTags.length === 0;

  // Check if at least one constraint is selected when both are available
  const hasInvalidConstraints =
    hasSelectedAssets &&
    hasActiveFilters &&
    !applyToSelectedAssets &&
    !applyToAssetsWithActiveFilters;

  // Calculate the effective asset count that would be affected
  const effectiveAssetCount = (() => {
    if (hasSelectedAssets && hasActiveFilters) {
      if (applyToSelectedAssets && applyToAssetsWithActiveFilters) {
        return intersectionCount;
      } else if (applyToSelectedAssets) {
        return selectedAssetsCount;
      } else if (applyToAssetsWithActiveFilters) {
        return assetsWithActiveFiltersCount;
      }
      return 0; // Neither selected
    } else if (hasSelectedAssets) {
      return selectedAssetsCount;
    } else if (hasActiveFilters) {
      return assetsWithActiveFiltersCount;
    }
    return 0; // No scoping available
  })();

  const hasNoAffectedAssets = effectiveAssetCount === 0;

  const isFormInvalid =
    hasNoValidTags || hasInvalidConstraints || hasNoAffectedAssets;

  // Calculate the summary message for how many assets will be affected
  const getSummaryMessage = () => {
    if (hasSelectedAssets && hasActiveFilters) {
      // Dual selection mode
      if (applyToSelectedAssets && applyToAssetsWithActiveFilters) {
        // Both constraints: intersection
        return `Tags will be added to ${intersectionCount} ${intersectionCount === 1 ? 'asset that is' : 'assets that are'} both selected and ${intersectionCount === 1 ? 'matches' : 'match'} active filters.`;
      } else if (applyToSelectedAssets) {
        // Only selected assets
        return `Tags will be added to the ${selectedAssetsCount} selected ${selectedAssetsCount === 1 ? 'asset' : 'assets'}.`;
      } else if (applyToAssetsWithActiveFilters) {
        // Only assets with active filters
        return `Tags will be added to ${assetsWithActiveFiltersCount} ${assetsWithActiveFiltersCount === 1 ? 'asset' : 'assets'} with active filters.`;
      }
    } else if (hasSelectedAssets) {
      // Only assets selected
      return `Tags will be added to the ${selectedAssetsCount} selected ${selectedAssetsCount === 1 ? 'asset' : 'assets'}.`;
    } else if (hasActiveFilters) {
      // Only filters active
      return `Tags will be added to ${assetsWithActiveFiltersCount} ${assetsWithActiveFiltersCount === 1 ? 'asset' : 'assets'} with active filters.`;
    }
    return '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md min-w-[24rem]">
      <div className="flex flex-wrap gap-4">
        {/* Title */}
        <h2 className="w-full text-2xl font-semibold text-slate-700 dark:text-slate-200">
          Add Tags
        </h2>

        {/* Selected assets/filters count and description */}
        {hasSelectedAssets && hasActiveFilters ? (
          <p className="text-sm text-slate-500">
            Choose where to add tags:{' '}
            <span className="font-medium">{selectedAssetsCount}</span> selected{' '}
            {selectedAssetsCount === 1 ? 'asset' : 'assets'} and/or{' '}
            <span className="font-medium">{assetsWithActiveFiltersCount}</span>{' '}
            assets with active filters.
          </p>
        ) : hasSelectedAssets ? (
          <p className="text-sm text-slate-500">
            Adding tags to{' '}
            <span className="font-medium">{selectedAssetsCount}</span> selected{' '}
            {selectedAssetsCount === 1 ? 'asset' : 'assets'}.
          </p>
        ) : hasActiveFilters ? (
          <p className="text-sm text-slate-500">
            Adding tags to{' '}
            <span className="font-medium">{assetsWithActiveFiltersCount}</span>{' '}
            assets with active filters.
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            No assets or filters selected.
          </p>
        )}

        {/* Tag input form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
          <MultiTagInput
            tags={tags}
            onTagsChange={setTags}
            duplicateCheck={handleDuplicateCheck}
            tagStatus={memoizedTagsStatus}
            autoFocus
            className="w-full"
          />

          {tags.length === 0 ? (
            <p className="text-xs text-slate-500">
              Tags to add to selected assets. Press Enter, Tab, or use commas to
              add new tags.
            </p>
          ) : memoizedTagsStatus.some(
              (t) => t.status === 'some' || t.status === 'all',
            ) ? (
            <TagStatusLegend
              all={{
                show: memoizedTagsStatus.some((t) => t.status === 'all'),
                message:
                  'Red tags exist on all selected assets and will be disregarded.',
              }}
              some={{
                show: memoizedTagsStatus.some((t) => t.status === 'some'),
                message:
                  'Yellow tags exist on some assets and will only be added to assets without them.',
              }}
            />
          ) : (
            <p className="text-xs text-slate-500">
              Tags will be added to all selected assets that don&apos;t already
              have them.
            </p>
          )}

          {/* Tag position */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-500">
              New tags
            </label>
            <RadioGroup
              name="tagPosition"
              options={[
                { value: 'prepend', label: 'Prepend to start' },
                { value: 'append', label: 'Append to end' },
              ]}
              value={addToStart ? 'prepend' : 'append'}
              onChange={(mode) => setAddToStart(mode === 'prepend')}
            />
          </div>

          {/* Keep selection checkbox */}
          <div className="flex items-center">
            <Checkbox
              isSelected={keepSelection}
              onChange={() => setKeepSelection((v) => !v)}
              label="Keep asset selection after adding new tags"
              ariaLabel="Keep asset selection after adding new tags"
            />
          </div>

          {/* Constraint checkboxes - only show when both assets and active filters are available */}
          <ScopingCheckboxes
            hasActiveFilters={hasActiveFilters}
            filteredCount={assetsWithActiveFiltersCount}
            scopeToFiltered={applyToAssetsWithActiveFilters}
            onScopeToFilteredChange={setApplyToAssetsWithActiveFilters}
            hasSelectedAssets={hasSelectedAssets}
            selectedCount={selectedAssetsCount}
            scopeToSelected={applyToSelectedAssets}
            onScopeToSelectedChange={setApplyToSelectedAssets}
            requireBothConstraints
            requireAtLeastOne
          />

          {/* Summary of how many assets will be affected - show for all cases */}
          {!hasInvalidConstraints &&
            (hasNoAffectedAssets ? (
              <p className="text-xs text-rose-600">
                No assets match the current selection and filter combination.
              </p>
            ) : (
              <p className="text-xs text-slate-500">{getSummaryMessage()}</p>
            ))}

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
