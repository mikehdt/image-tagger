import { useEffect, useState } from 'react';

/**
 * Hook for managing tag state with an external state callback
 * @param onTagEditingChange Optional callback for when editing or adding a tag
 * @returns Tag state and setters
 */
export const useTagStateWithCallback = (
  onTagEditingChange?: (isEditing: boolean) => void,
) => {
  // All tag-related state in one place
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [editTagValue, setEditTagValue] = useState<string>('');
  const [editingTagName, setEditingTagName] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Notify parent component when either editing or adding state changes
  useEffect(() => {
    if (onTagEditingChange) {
      // Consider tag editing active when either:
      // 1. Actively editing an existing tag (isEditing === true)
      // 2. OR there's text in the new tag input (newTagInput is not empty)
      const isActiveTagInteraction = isEditing || newTagInput.trim() !== '';
      onTagEditingChange(isActiveTagInteraction);
    }
  }, [isEditing, newTagInput, onTagEditingChange]);

  return {
    // State
    newTagInput,
    editTagValue,
    editingTagName,
    isEditing,

    // Setters
    setNewTagInput,
    setEditTagValue,
    setEditingTagName,
    setIsEditing,
  };
};
