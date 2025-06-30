'use client';

import { BookmarkIcon } from '@heroicons/react/24/outline';
import { createSelector } from '@reduxjs/toolkit';
import { SyntheticEvent, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '../../../store/hooks';
import { selectDuplicateTagInfo } from '../../../store/selection';
import { Checkbox } from '../../shared/checkbox/checkbox';
import { Modal } from '../../shared/modal';
import { MultiTagInput } from '../../shared/multi-tag-input';

type AddTagsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedAssetsCount: number;
  onAddTag: (tag: string) => void;
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
      lastInputRef.current = '';
      setInputChanged(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    if (tags.length === 0) return;
    tags.forEach((tag) => {
      const tagInfo = tagsStatus.find((t) => t.tag === tag);
      if (!tagInfo || tagInfo.status !== 'all') {
        onAddTag(tag);
      }
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
  const hasNoValidTags = tags.length === 0 || validTags.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md min-w-[24rem]">
      <div className="relative space-y-4">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-slate-700">Add Tags</h2>

        {/* Selected assets count */}
        <p className="text-sm text-slate-500">
          Adding tags to{' '}
          <span className="font-medium">{selectedAssetsCount}</span> selected{' '}
          {selectedAssetsCount === 1 ? 'asset' : 'assets'}.
        </p>

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
              Tags to add to selected assets. Press Enter to add a new tag.
            </p>
          ) : tagsStatus.some(
              (t) => t.status === 'some' || t.status === 'all',
            ) ? (
            <div className="space-y-2 text-xs text-slate-500">
              {tagsStatus.some((t) => t.status === 'all') && (
                <p className="flex">
                  <span className="mt-0.5 mr-2 h-3 w-3 rounded-full border border-rose-300 bg-rose-100 align-middle"></span>
                  Red tags exist on all selected assets and will be disregarded.
                </p>
              )}
              {tagsStatus.some((t) => t.status === 'some') && (
                <p className="flex">
                  <span className="mt-0.5 mr-2 inline-block h-3 w-3 rounded-full border border-amber-300 bg-amber-50"></span>
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
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-sm border border-stone-300 bg-stone-200 px-4 py-1 text-stone-800 shadow-xs inset-shadow-xs shadow-stone-400 inset-shadow-white transition-colors hover:bg-stone-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={hasNoValidTags}
              className={`flex rounded-sm border border-amber-300 px-4 py-1 shadow-xs inset-shadow-xs inset-shadow-white transition-colors ${
                hasNoValidTags
                  ? 'cursor-not-allowed bg-amber-100 text-amber-600 opacity-40'
                  : 'cursor-pointer bg-amber-200 text-amber-800 shadow-amber-400 hover:bg-amber-100'
              }`}
            >
              <BookmarkIcon className="mr-1 w-4" />
              Add New Tags
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
