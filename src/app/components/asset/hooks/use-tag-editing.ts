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
      if (newTagName.trim() === '') return;
      if (oldTagName === newTagName) return;

      // Check if the new tag name already exists in the list
      if (tagList.includes(newTagName)) {
        console.log(
          "Couldn't edit tag, the new name already exists in the list",
          newTagName,
        );

        return;
      }

      // Clear the edit state variables
      setEditTagValue('');
      setEditingTagName('');

      // Dispatch the edit action
      dispatch(editTag({ assetId, oldTagName, newTagName }));
    },
    [dispatch, assetId, tagList, setEditTagValue, setEditingTagName],
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
      setIsEditing(editing);

      if (editing) {
        // Start of edit mode - set the tag being edited
        setEditingTagName(tagName);
      } else {
        // End of edit mode - clear both states
        setEditingTagName('');
        setEditTagValue('');
      }
    },
    [],
  );

  const handleEditValueChange = useCallback(
    (tagName: string, value: string) => {
      // Only update the tag being edited if we're not already tracking it
      if (tagName && editingTagName === '') {
        setEditingTagName(tagName);
      }

      // Always update the edit value
      setEditTagValue(value);
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
