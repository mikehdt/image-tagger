/**
 * Enhanced tag processing that handles duplicate tags - allows multiple renames to the same value
 */
export const processTagUpdatesWithDuplicateHandling = (
  editedTags: Record<string, string>,
  filterTags: string[],
  getTagStatus: (originalTag: string) => 'none' | 'some' | 'all' | 'duplicate',
): Array<{
  oldTagName: string;
  newTagName: string;
  operation: 'RENAME' | 'DELETE';
}> => {
  const result: Array<{
    oldTagName: string;
    newTagName: string;
    operation: 'RENAME' | 'DELETE';
  }> = [];

  // Process tags in the order they appear in filterTags
  filterTags.forEach((originalTag) => {
    const newValue = editedTags[originalTag];

    // Skip undefined, unchanged, or empty tags
    if (!newValue || originalTag === newValue || newValue.trim() === '') {
      return;
    }

    const trimmedValue = newValue.trim();
    const status = getTagStatus(originalTag);

    // Check if this value would create duplicates in ALL assets - these cannot be renamed
    if (status === 'all') {
      result.push({
        oldTagName: originalTag,
        newTagName: trimmedValue, // Pass the intended target name
        operation: 'DELETE',
      });
      return;
    }

    // Allow all other renames - the thunk will handle duplicate detection at the asset level
    // This means multiple tags can be renamed to the same value, and the thunk will properly
    // handle duplicates within individual assets
    result.push({
      oldTagName: originalTag,
      newTagName: trimmedValue,
      operation: 'RENAME',
    });
  });

  return result;
};
