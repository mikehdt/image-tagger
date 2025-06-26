import { SyntheticEvent } from 'react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { addTag, deleteTag, editTag } from '../../store/assets';
import { useAppDispatch } from '../../store/hooks';

// Define the context shape
type TagContextType = {
  // Tag state
  tagList: string[];
  tagsByStatus: Record<string, number>;
  globalTagList: Record<string, number>;
  newTagInput: string;
  editTagValue: string;
  editingTagName: string;
  isEditing: boolean;

  // Computed values
  isDuplicate: (tagName: string) => boolean;
  isTagBeingEdited: (tagName: string) => boolean;
  shouldFade: (tagName: string) => boolean;
  isTagInteractive: (tagName: string) => boolean;
  isHighlighted: (tagName: string) => boolean;

  // Actions
  setNewTagInput: (value: string) => void;
  startEditingTag: (tagName: string) => void;
  cancelEditingTag: (e?: SyntheticEvent) => void;
  saveEditingTag: (e?: SyntheticEvent) => void;
  handleAddTag: (e: SyntheticEvent, tagName: string) => boolean;
  handleDeleteTag: (e: SyntheticEvent, tagName: string) => void;
  handleEditValueChange: (value: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCancelAdd: (e: SyntheticEvent) => void;
  handleToggleTag: (e: SyntheticEvent, tagName: string) => void;
};

// Create the context with a default value
const TagContext = createContext<TagContextType | undefined>(undefined);

// Provider component
export const TagProvider = ({
  children,
  assetId,
  tagList,
  tagsByStatus = {},
  globalTagList = {},
  filterTagsSet = new Set<string>(),
  toggleTag,
}: {
  children: ReactNode;
  assetId: string;
  tagList: string[];
  tagsByStatus?: Record<string, number>;
  globalTagList?: Record<string, number>;
  filterTagsSet?: Set<string>;
  toggleTag?: (e: SyntheticEvent, tagName: string) => void;
}) => {
  const dispatch = useAppDispatch();

  // All tag-related state in one place
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [editTagValue, setEditTagValue] = useState<string>('');
  const [editingTagName, setEditingTagName] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

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

  // Action to start editing a tag
  const startEditingTag = useCallback((tagName: string) => {
    setIsEditing(true);
    setEditingTagName(tagName);
    setEditTagValue(tagName);
  }, []);

  // Action to cancel editing
  const cancelEditingTag = useCallback((e?: SyntheticEvent) => {
    if (e) e.stopPropagation();
    setIsEditing(false);
    setEditingTagName('');
    setEditTagValue('');
  }, []);

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
  const handleEditValueChange = useCallback((value: string) => {
    setEditTagValue(value);
  }, []);

  // Handle input change in add mode
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTagInput(e.currentTarget.value.trimStart());
    },
    [],
  );

  // Handle canceling add
  const handleCancelAdd = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
    setNewTagInput('');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  // Handle toggling a tag for filtering
  const handleToggleTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      if (toggleTag) {
        toggleTag(e, tagName);
      }
    },
    [toggleTag],
  );

  // Create the context value
  const contextValue = useMemo(
    () => ({
      tagList,
      newTagInput,
      editTagValue,
      editingTagName,
      isEditing,
      isDuplicate,
      isTagBeingEdited,
      shouldFade,
      isTagInteractive,
      isHighlighted,
      setNewTagInput,
      startEditingTag,
      cancelEditingTag,
      saveEditingTag,
      handleAddTag,
      handleDeleteTag,
      handleEditValueChange,
      handleInputChange,
      handleCancelAdd,
      handleToggleTag,
      globalTagList,
      tagsByStatus,
    }),
    [
      tagList,
      newTagInput,
      editTagValue,
      editingTagName,
      isEditing,
      isDuplicate,
      isTagBeingEdited,
      shouldFade,
      isTagInteractive,
      isHighlighted,
      setNewTagInput,
      startEditingTag,
      cancelEditingTag,
      saveEditingTag,
      handleAddTag,
      handleDeleteTag,
      handleEditValueChange,
      handleInputChange,
      handleCancelAdd,
      handleToggleTag,
      globalTagList,
      tagsByStatus,
    ],
  );

  return (
    <TagContext.Provider value={contextValue}>{children}</TagContext.Provider>
  );
};

// Custom hook for accessing the context
export const useTagContext = () => {
  const context = useContext(TagContext);

  if (context === undefined) {
    throw new Error('useTagContext must be used within a TagProvider');
  }

  return context;
};
