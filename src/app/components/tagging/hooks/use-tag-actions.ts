import { SyntheticEvent, useCallback, useMemo } from 'react';

import { addTag, deleteTag, editTag } from '@/app/store/assets';
import { useAppDispatch } from '@/app/store/hooks';

/**
 * Hook for tag actions (add, delete, edit)
 *
 * @param props Properties required for tag actions
 * @returns Object containing tag action functions
 */
export const useTagActions = ({
  assetId,
  isDuplicate,
  setNewTagInput,
  setIsEditing,
  setEditingTagName,
  setEditTagValue,
  editingTagName,
  editTagValue,
  toggleTag: externalToggleTag,
}: {
  assetId: string;
  isDuplicate: (tagName: string) => boolean;
  setNewTagInput: (value: string) => void;
  setIsEditing: (value: boolean) => void;
  setEditingTagName: (value: string) => void;
  setEditTagValue: (value: string) => void;
  editingTagName: string;
  editTagValue: string;
  toggleTag?: (e: SyntheticEvent, tagName: string) => void;
}) => {
  const dispatch = useAppDispatch();

  // Action to start editing a tag
  const startEditingTag = useCallback(
    (tagName: string) => {
      setIsEditing(true);
      setEditingTagName(tagName);
      setEditTagValue(tagName);
    },
    [setIsEditing, setEditingTagName, setEditTagValue],
  );

  // Action to cancel editing
  const cancelEditingTag = useCallback(
    (e?: SyntheticEvent) => {
      if (e) e.stopPropagation();
      setIsEditing(false);
      setEditingTagName('');
      setEditTagValue('');
    },
    [setIsEditing, setEditingTagName, setEditTagValue],
  );

  // Action to save an edited tag
  const saveEditingTag = useCallback(
    (e?: SyntheticEvent) => {
      if (e) e.stopPropagation();

      if (!editTagValue.trim()) {
        console.log("Can't save an empty tag name");
        return;
      }

      if (editTagValue === editingTagName) {
        // No change, just clear edit state
        cancelEditingTag();
        return;
      }

      if (isDuplicate(editTagValue)) {
        console.log(
          "Couldn't edit tag, the new name already exists in the list",
          editTagValue,
        );
        return;
      }

      dispatch(
        editTag({
          assetId,
          oldTagName: editingTagName,
          newTagName: editTagValue,
        }),
      );
      cancelEditingTag();
    },
    [
      assetId,
      editingTagName,
      editTagValue,
      isDuplicate,
      dispatch,
      cancelEditingTag,
    ],
  );

  // Action to add multiple tags (for comma-separated input and paste)
  const handleAddMultipleTags = useCallback(
    (tags: string[]): void => {
      let addedCount = 0;

      tags.forEach((tagName) => {
        const trimmedTag = tagName.trim();
        if (trimmedTag && !isDuplicate(trimmedTag)) {
          dispatch(addTag({ assetId, tagName: trimmedTag }));
          addedCount++;
        }
      });

      // Clear the input field after processing
      setNewTagInput('');

      // Log results for debugging
      if (addedCount > 0) {
        console.log(`Added ${addedCount} new tags`);
      }
      if (addedCount < tags.length) {
        console.log(
          `Skipped ${tags.length - addedCount} duplicate or empty tags`,
        );
      }
    },
    [assetId, isDuplicate, dispatch, setNewTagInput],
  );

  // Action to add a new tag
  const handleAddTag = useCallback(
    (e: SyntheticEvent, tagName: string): boolean => {
      e.stopPropagation();

      if (tagName.trim() === '') {
        console.log("Couldn't add tag, it was empty.");
        return false;
      }

      if (isDuplicate(tagName)) {
        console.log("Couldn't add tag, it's already in the list", tagName);
        return false;
      }

      dispatch(addTag({ assetId, tagName }));
      // Clear the input field after successful tag addition
      setNewTagInput('');
      return true;
    },
    [assetId, isDuplicate, dispatch, setNewTagInput],
  );

  // Action to delete a tag
  const handleDeleteTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.stopPropagation();
      dispatch(deleteTag({ assetId, tagName }));
    },
    [assetId, dispatch],
  );

  // Handle changes to the edit value
  const handleEditValueChange = useCallback(
    (value: string) => {
      setEditTagValue(value);
    },
    [setEditTagValue],
  );

  // Handle input change in add mode
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTagInput(e.currentTarget.value.trimStart());
    },
    [setNewTagInput],
  );

  // Handle canceling add
  const handleCancelAdd = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      setNewTagInput('');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [setNewTagInput],
  );

  // Handle toggling a tag for filtering
  const handleToggleTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      if (externalToggleTag) {
        externalToggleTag(e, tagName);
      }
    },
    [externalToggleTag],
  );

  return useMemo(
    () => ({
      startEditingTag,
      cancelEditingTag,
      saveEditingTag,
      handleAddTag,
      handleAddMultipleTags,
      handleDeleteTag,
      handleEditValueChange,
      handleInputChange,
      handleCancelAdd,
      handleToggleTag,
    }),
    [
      startEditingTag,
      cancelEditingTag,
      saveEditingTag,
      handleAddTag,
      handleAddMultipleTags,
      handleDeleteTag,
      handleEditValueChange,
      handleInputChange,
      handleCancelAdd,
      handleToggleTag,
    ],
  );
};
