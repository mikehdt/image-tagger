import { SyntheticEvent, useCallback, useMemo, useState } from 'react';

import { editTag } from '../../../store/assets';
import { useAppDispatch } from '../../../store/hooks';

export const useTagEditing = (assetId: string, tagList: string[]) => {
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [editTagValue, setEditTagValue] = useState<string>('');
  const [editingTagName, setEditingTagName] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const handleEditTag = useCallback(
    (oldTagName: string, newTagName: string) => {
      // Don't allow saving empty values in edit mode
      if (newTagName.trim() === '') {
        console.log("Can't save an empty tag name");
        return;
      }

      // No change, nothing to do
      if (oldTagName === newTagName) return;

      // Check if the new tag name already exists in the list
      if (tagList.includes(newTagName)) {
        console.log(
          "Couldn't edit tag, the new name already exists in the list",
          newTagName,
        );
        return;
      }

      // Clear all edit state variables - this will un-fade tags
      setEditTagValue('');
      setEditingTagName('');
      setIsEditing(false);

      // Dispatch the edit action
      dispatch(editTag({ assetId, oldTagName, newTagName }));
    },
    [dispatch, assetId, tagList],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTagInput(e.currentTarget.value.trimStart());
    },
    [],
  );

  const handleCancelAdd = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
    // Clear the input field and optionally blur the input to remove focus
    setNewTagInput('');
    // Blur the input if we have access to it
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  // Track edit state changes and handle start/end of edit mode
  const handleEditStateChange = useCallback(
    (tagName: string, editing: boolean) => {
      // When editing ends (save or cancel), always make sure all states are cleaned up at once
      if (!editing) {
        // Batch these state updates to ensure they happen together
        // This is what un-fades the tags when edit mode ends
        setIsEditing(false);
        setEditingTagName('');
        setEditTagValue('');
        return;
      }

      // Start editing mode - which will fade all tags except the one being edited
      setIsEditing(true);
      setEditingTagName(tagName);
    },
    [],
  );

  const handleEditValueChange = useCallback(
    (tagName: string, value: string) => {
      // First, determine if this is an edit mode or add mode operation
      const isEditMode =
        editingTagName !== '' || (tagName && editingTagName === '');

      // In edit mode, always track the tag being edited
      if (isEditMode) {
        // If we don't have an editing tag name yet, set it now
        if (tagName && editingTagName === '') {
          setEditingTagName(tagName);
          setIsEditing(true);
        }

        // CRITICAL: In edit mode, NEVER clear states when value is empty
        // We always want to maintain edit state, even with empty input
        // States will ONLY be cleared through handleEditStateChange (on save/cancel)
        setEditTagValue(value);
      } else {
        // This is add mode (no tag being edited)
        // In add mode: clear all editing state when value is empty
        // This is what allows tags to un-fade when the add input is cleared
        if (value === '') {
          setEditingTagName('');
          setIsEditing(false);
          setEditTagValue('');
        } else {
          // Only update the value if not empty in add mode
          setEditTagValue(value);
        }
      }
    },
    [editingTagName],
  );

  // Check if the current edit value is a duplicate of another tag
  const isEditingDuplicate = useMemo(() => {
    if (editTagValue && editingTagName) {
      // Check if any tag except the one being edited matches the current edit value
      return tagList.some(
        (tag) =>
          tag !== editingTagName &&
          tag.toLowerCase() === editTagValue.toLowerCase().trim(),
      );
    }
    return false;
  }, [editTagValue, editingTagName, tagList]);

  return {
    newTagInput,
    setNewTagInput,
    editTagValue,
    editingTagName,
    isEditing,
    handleEditTag,
    handleInputChange,
    handleCancelAdd,
    handleEditStateChange,
    handleEditValueChange,
    isEditingDuplicate,
  };
};
