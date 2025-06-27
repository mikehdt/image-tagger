import { useState } from 'react';

/**
 * Hook for managing tag state
 * @returns Tag state and setters
 */
export const useTagState = () => {
  // All tag-related state in one place
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [editTagValue, setEditTagValue] = useState<string>('');
  const [editingTagName, setEditingTagName] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

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
