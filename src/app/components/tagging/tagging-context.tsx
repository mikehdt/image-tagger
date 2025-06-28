import { SyntheticEvent } from 'react';
import { createContext, ReactNode, useContext, useMemo } from 'react';

/**
 * Tagging module - Provides functionality for managing tags on assets
 */
import {
  useTagActions,
  useTagCalculations,
  useTagStateWithCallback,
} from './hooks';

// Define the context shape
type TaggingContextType = {
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
const TaggingContext = createContext<TaggingContextType | undefined>(undefined);

// Provider component
export const TaggingProvider = ({
  children,
  assetId,
  tagList,
  tagsByStatus = {},
  globalTagList = {},
  filterTagsSet = new Set<string>(),
  toggleTag,
  onTagEditingChange,
}: {
  children: ReactNode;
  assetId: string;
  tagList: string[];
  tagsByStatus?: Record<string, number>;
  globalTagList?: Record<string, number>;
  filterTagsSet?: Set<string>;
  toggleTag?: (e: SyntheticEvent, tagName: string) => void;
  onTagEditingChange?: (isEditing: boolean) => void;
}) => {
  // Use extracted hooks with callback for editing state
  const {
    newTagInput,
    editTagValue,
    editingTagName,
    isEditing,
    setNewTagInput,
    setEditTagValue,
    setEditingTagName,
    setIsEditing,
  } = useTagStateWithCallback(onTagEditingChange);

  const {
    isDuplicate,
    shouldFade,
    isTagInteractive,
    isTagBeingEdited,
    isHighlighted,
  } = useTagCalculations({
    tagList,
    editingTagName,
    isEditing,
    newTagInput,
    editTagValue,
    filterTagsSet,
  });

  const {
    startEditingTag,
    cancelEditingTag,
    saveEditingTag,
    handleAddTag,
    handleDeleteTag,
    handleEditValueChange,
    handleInputChange,
    handleCancelAdd,
    handleToggleTag,
  } = useTagActions({
    assetId,
    isDuplicate,
    setNewTagInput,
    setIsEditing,
    setEditingTagName,
    setEditTagValue,
    editingTagName,
    editTagValue,
    toggleTag,
  });

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
    <TaggingContext.Provider value={contextValue}>
      {children}
    </TaggingContext.Provider>
  );
};

// Custom hook for accessing the context
export const useTaggingContext = () => {
  const context = useContext(TaggingContext);

  if (context === undefined) {
    throw new Error('useTaggingContext must be used within a TaggingProvider');
  }

  return context;
};
