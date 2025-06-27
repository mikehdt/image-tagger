import { SyntheticEvent, useCallback } from 'react';

import { addTag, deleteTag, editTag } from '../../../store/assets';
import { useAppDispatch } from '../../../store/hooks';

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

  return {
    startEditingTag,
    cancelEditingTag,
    saveEditingTag,
    handleAddTag,
    handleDeleteTag,
    handleEditValueChange,
    handleInputChange,
    handleCancelAdd,
    handleToggleTag,
  };
};
