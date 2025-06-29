'use client';

import { BookmarkIcon } from '@heroicons/react/24/outline';
import {
  ChangeEvent,
  KeyboardEvent,
  SyntheticEvent,
  useEffect,
  useState,
} from 'react';

import { useAppSelector } from '../../../store/hooks';
import { selectTagExistsInSelectedAssets } from '../../../store/selection';
import { Modal } from './modal';

type AddTagsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedAssetsCount: number;
  onAddTag: (tag: string) => void;
};

export const AddTagsModal = ({
  isOpen,
  onClose,
  selectedAssetsCount,
  onAddTag,
}: AddTagsModalProps) => {
  const [tagInput, setTagInput] = useState('');

  // Check if the current tag input exists in any selected assets
  const isDuplicate = useAppSelector(selectTagExistsInSelectedAssets(tagInput));

  // Reset the form state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTagInput('');
    }
  }, [isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    // Duplicate checking is now handled by the selector
  };

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    if (!tagInput.trim() || isDuplicate) return;

    onAddTag(tagInput.trim());
    setTagInput('');
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() && !isDuplicate) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="relative space-y-4">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800">Add Tags</h2>

        {/* Selected assets count */}
        <p className="text-sm text-gray-600">
          Adding tags to{' '}
          <span className="font-medium">{selectedAssetsCount}</span> selected{' '}
          {selectedAssetsCount === 1 ? 'asset' : 'assets'}.
        </p>

        {/* Tag input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter tag name..."
              className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none ${isDuplicate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              autoFocus
            />
            {isDuplicate && (
              <p className="mt-1 text-sm text-red-600">
                This tag already exists on one or more selected assets.
              </p>
            )}
          </div>

          {isDuplicate ? (
            <p className="text-xs text-amber-600">
              This tag already exists on one or more selected assets. You can
              still add it to assets that don't have it.
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Tag will be added to all selected assets that don't already have
              it.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-sm bg-stone-200 px-4 py-1 text-stone-800 shadow-xs inset-shadow-xs shadow-stone-400 inset-shadow-white transition-colors hover:bg-stone-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!tagInput.trim() || isDuplicate}
              className={`flex rounded-sm px-4 py-1 shadow-xs inset-shadow-xs inset-shadow-white transition-colors ${
                !tagInput.trim() || isDuplicate
                  ? 'cursor-not-allowed bg-emerald-100 text-emerald-600 opacity-50'
                  : 'cursor-pointer bg-emerald-200 text-emerald-800 shadow-emerald-400 hover:bg-emerald-300'
              }`}
            >
              <BookmarkIcon className="mr-1 w-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
