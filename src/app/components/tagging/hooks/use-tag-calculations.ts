import { useCallback, useMemo } from 'react';

/**
 * Hook for tag-related calculations
 *
 * @param props Required properties for calculations
 * @returns Object containing tag calculation functions
 */
export const useTagCalculations = ({
  tagList,
  editingTagName,
  isEditing,
  newTagInput,
  editTagValue,
  filterTagsSet,
}: {
  tagList: string[];
  editingTagName: string;
  isEditing: boolean;
  newTagInput: string;
  editTagValue: string;
  filterTagsSet?: Set<string>;
}) => {
  // Check if a tag is a duplicate
  const isDuplicate = useCallback(
    (tagName: string): boolean => {
      if (!tagName.trim()) return false;

      // In edit mode, only consider it a duplicate if it matches a tag other than the one being edited
      if (isEditing && editingTagName) {
        return tagList.some(
          (tag) =>
            tag !== editingTagName &&
            tag.toLowerCase() === tagName.toLowerCase().trim(),
        );
      }

      // In add mode, any matching tag is a duplicate
      return tagList.some(
        (tag) => tag.toLowerCase() === tagName.toLowerCase().trim(),
      );
    },
    [tagList, editingTagName, isEditing],
  );

  // Determine if a specific tag should fade based on current state
  const shouldFade = useCallback(
    (tagName: string): boolean => {
      // For add mode: fade tags except one matching current input
      if (newTagInput !== '' && !isEditing) {
        return newTagInput !== tagName;
      }

      // For edit mode: don't fade the tag being edited or duplicates
      if (isEditing) {
        // Always keep the currently-being-edited tag visible
        if (tagName === editingTagName) {
          return false;
        }

        // If the edit value is empty, fade everything else
        if (editTagValue === '') {
          return true;
        }

        // Otherwise, only match tags that match the current edit value exactly
        return tagName.toLowerCase() !== editTagValue.toLowerCase().trim();
      }

      return false;
    },
    [newTagInput, isEditing, editingTagName, editTagValue],
  );

  // Determine if a tag should be interactive
  const isTagInteractive = useCallback(
    (tagName: string): boolean => {
      // In edit mode - all tags non-interactive except the one being edited
      // In add mode with input - all tags non-interactive
      return !(
        (isEditing && tagName !== editingTagName) ||
        (!isEditing && newTagInput !== '')
      );
    },
    [isEditing, editingTagName, newTagInput],
  );

  // Check if this specific tag is being edited
  const isTagBeingEdited = useCallback(
    (tagName: string): boolean => {
      return isEditing && editingTagName === tagName;
    },
    [isEditing, editingTagName],
  );

  // Check if a tag is highlighted (part of the filter)
  const isHighlighted = useCallback(
    (tagName: string): boolean => {
      return filterTagsSet?.has(tagName) || false;
    },
    [filterTagsSet],
  );

  return useMemo(
    () => ({
      isDuplicate,
      shouldFade,
      isTagInteractive,
      isTagBeingEdited,
      isHighlighted,
    }),
    [
      isDuplicate,
      shouldFade,
      isTagInteractive,
      isTagBeingEdited,
      isHighlighted,
    ],
  );
};
