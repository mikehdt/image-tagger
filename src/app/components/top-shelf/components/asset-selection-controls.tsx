import { TagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  addTagToSelectedAssets,
  clearSelection,
  selectHasSelectedAssets,
  selectSelectedAssetsCount,
} from '../../../store/selection';
import { Button } from '../../shared/button';
import { AddTagsModal } from './add-tags-modal';

export const AssetSelectionControls = () => {
  const dispatch = useAppDispatch();
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);

  const hasSelectedAssets = useAppSelector(selectHasSelectedAssets);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);

  const handleClearSelection = () => dispatch(clearSelection());
  const handleCloseModal = () => setIsAddTagsModalOpen(false);

  const handleAddTag = (tag: string) => {
    dispatch(addTagToSelectedAssets(tag));
    setIsAddTagsModalOpen(false);
  };

  return (
    <div className="flex space-x-2 rounded-md bg-slate-100 p-1">
      <input className="px-2 py-1" placeholder="Find by asset name..." />

      <Button type="button">add to selection</Button>

      <Button
        type="button"
        onClick={() => setIsAddTagsModalOpen(true)}
        className="mr-2 flex items-center px-3"
        disabled={!hasSelectedAssets}
        variant="ghost"
        color="slate"
        size="medium"
        title="Add tags to selected assets"
      >
        <TagIcon className="mr-2 h-4 w-4" />
        <span>Add Tags</span>
        <span className="ml-2 rounded-full bg-white px-1 text-xs font-medium text-slate-400 tabular-nums">
          {selectedAssetsCount}
        </span>
      </Button>

      <Button
        type="button"
        onClick={handleClearSelection}
        className="inline-flex items-center"
        disabled={!hasSelectedAssets}
        variant="ghost"
        color="slate"
        size="medium"
        title="Clear selection"
      >
        <XMarkIcon className="mr-1 w-4" /> <span>Clear</span>
      </Button>

      <AddTagsModal
        isOpen={isAddTagsModalOpen}
        onClose={handleCloseModal}
        onClearSelection={handleClearSelection}
        selectedAssetsCount={selectedAssetsCount}
        onAddTag={handleAddTag}
      />
    </div>
  );
};
