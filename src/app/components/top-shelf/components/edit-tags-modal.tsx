'use client';

import { BookmarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '../../../store/hooks';
import { editTagsAcrossAssets } from '../../../store/selection/thunks';
import { Modal } from '../../shared/modal';

interface EditTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterTags: string[];
  onClearSelection?: () => void;
}

export const EditTagsModal = ({
  isOpen,
  onClose,
  filterTags,
  onClearSelection,
}: EditTagsModalProps) => {
  const dispatch = useAppDispatch();

  // State for edited tags and UI
  const [keepSelection, setKeepSelection] = useState(false);
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

  // Reset the form when the modal opens or when filter tags change
  useEffect(() => {
    if (isOpen) {
      setEditedTags(
        filterTags.reduce(
          (acc, tag) => {
            acc[tag] = tag;
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
      setEditedTags((prev) => ({
        ...prev,
        [originalTag]: newValue,
      }));
    },
    [],
  );

  // Submit the form
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Convert edited tags to the format expected by the thunk
      const tagUpdates = Object.entries(editedTags).map(
        ([oldTagName, newTagName]) => ({
          oldTagName,
          newTagName,
        }),
      );

      // Dispatch the thunk to update tags
      dispatch(editTagsAcrossAssets(tagUpdates));

      // Clear the selection if the option is not selected
      if (!keepSelection && onClearSelection) {
        onClearSelection();
      }

      // Close the modal
      onClose();
    },
    [dispatch, editedTags, keepSelection, onClearSelection, onClose],
  );

  // Check if any tags have been modified
  const hasModifiedTags = Object.entries(editedTags).some(
    ([originalTag, newTag]) => originalTag !== newTag && newTag.trim() !== '',
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
            {filterTags.map((tag) => (
              <div key={tag} className="flex items-center space-x-3">
                {/* Original tag */}
                <div className="w-1/2 truncate font-medium text-slate-700">
                  {tag}
                </div>

                {/* Edit field */}
                <input
                  type="text"
                  value={editedTags[tag] || ''}
                  onChange={(e) => handleTagChange(tag, e.target.value)}
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="New tag name"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Editing a tag will update it across all assets where it appears.
          </p>

          {/* Keep selection checkbox */}
          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="keep-selection"
              checked={keepSelection}
              onChange={() => setKeepSelection((v) => !v)}
              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="keep-selection" className="text-sm text-slate-700">
              Keep tag selection after editing
            </label>
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
              disabled={!hasModifiedTags}
              className={`flex rounded-sm border border-amber-300 px-4 py-1 shadow-xs inset-shadow-xs inset-shadow-white transition-colors ${
                !hasModifiedTags
                  ? 'cursor-not-allowed bg-amber-100 text-amber-600 opacity-40'
                  : 'cursor-pointer bg-amber-200 text-amber-800 shadow-amber-400 hover:bg-amber-100'
              }`}
            >
              <BookmarkIcon className="mr-1 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
