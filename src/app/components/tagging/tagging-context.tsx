import { SyntheticEvent } from 'react';
import { createContext, ReactNode, useContext, useMemo, useRef } from 'react';

import {
  useTagActions as useTagActionsHook,
  useTagCalculations as useTagCalculationsHook,
  useTagStateWithCallback,
} from './hooks';

// Combined context type
type TaggingContextType = {
  // Data
  tagList: string[];
  tagsByStatus: Record<string, number>;
  globalTagList: Record<string, number>;
  filterTagsSet: Set<string>;

  // State
  newTagInput: string;
  editTagValue: string;
  editingTagName: string;
  isEditing: boolean;
  setNewTagInput: (value: string) => void;
  isDragDropDisabled: boolean;

  // Calculations
  isDuplicate: (tagName: string) => boolean;
  isTagBeingEdited: (tagName: string) => boolean;
  shouldFade: (tagName: string) => boolean;
  isTagInteractive: (tagName: string) => boolean;
  isHighlighted: (tagName: string) => boolean;

  // Actions
  startEditingTag: (tagName: string) => void;
  cancelEditingTag: (e?: SyntheticEvent) => void;
  saveEditingTag: (e?: SyntheticEvent) => void;
  handleAddTag: (e: SyntheticEvent, tagName: string) => boolean;
  handleAddMultipleTags: (tags: string[]) => void;
  handleDeleteTag: (e: SyntheticEvent, tagName: string) => void;
  handleEditValueChange: (value: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCancelAdd: (e: SyntheticEvent) => void;
  handleToggleTag: (e: SyntheticEvent, tagName: string) => void;

  // Pre-calculated props
  tagProps: Record<
    string,
    {
      fade: boolean;
      nonInteractive: boolean;
      tagState: number;
      count: number;
      isHighlighted: boolean;
      isBeingEdited: boolean;
      editTagValue: string;
      isDuplicate: (value: string) => boolean;
      onEditValueChange: (value: string) => void;
      onStartEdit: (tagName: string) => void;
      onSaveEdit: (e?: SyntheticEvent) => void;
      onCancelEdit: (e?: SyntheticEvent) => void;
      onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
      onToggleTag: (e: SyntheticEvent, tagName: string) => void;
    }
  >;
};

const TaggingContext = createContext<TaggingContextType | undefined>(undefined);

//  provider that combines all concerns
export const TaggingProvider = ({
  children,
  assetId,
  tagList,
  tagsByStatus = {},
  globalTagList = {},
  filterTagsSet = new Set<string>(),
  toggleTag,
  onTagEditingChange,
  isDragDropDisabled = false,
}: {
  children: ReactNode;
  assetId: string;
  tagList: string[];
  tagsByStatus?: Record<string, number>;
  globalTagList?: Record<string, number>;
  filterTagsSet?: Set<string>;
  toggleTag?: (e: SyntheticEvent, tagName: string) => void;
  onTagEditingChange?: (isEditing: boolean) => void;
  isDragDropDisabled?: boolean;
}) => {
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

  const calculations = useTagCalculationsHook({
    tagList,
    editingTagName,
    isEditing,
    newTagInput,
    editTagValue,
    filterTagsSet,
  });

  const actions = useTagActionsHook({
    assetId,
    isDuplicate: calculations.isDuplicate,
    setNewTagInput,
    setIsEditing,
    setEditingTagName,
    setEditTagValue,
    editingTagName,
    editTagValue,
    toggleTag,
  });

  // Pre-calculate all tag props to avoid function calls in render loop
  // Cache individual tag prop objects to prevent unnecessary re-renders when only some tags change
  const tagPropsCache = useRef<
    Record<
      string,
      {
        fade: boolean;
        nonInteractive: boolean;
        tagState: number;
        count: number;
        isHighlighted: boolean;
        isBeingEdited: boolean;
        editTagValue: string;
        isDuplicate: (value: string) => boolean;
        onEditValueChange: (value: string) => void;
        onStartEdit: (tagName: string) => void;
        onSaveEdit: (e?: SyntheticEvent) => void;
        onCancelEdit: (e?: SyntheticEvent) => void;
        onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
        onToggleTag: (e: SyntheticEvent, tagName: string) => void;
      }
    >
  >({});

  const tagProps = useMemo(() => {
    const props: typeof tagPropsCache.current = {};
    let hasChanges = false;

    tagList.forEach((tagName) => {
      const newProps = {
        fade: calculations.shouldFade(tagName),
        nonInteractive: !calculations.isTagInteractive(tagName),
        tagState: tagsByStatus[tagName] || 0,
        count: globalTagList[tagName] || 0,
        isHighlighted: filterTagsSet.has(tagName),
        isBeingEdited: calculations.isTagBeingEdited(tagName),
        // Include values and callbacks - these are stable references from hooks
        editTagValue,
        isDuplicate: calculations.isDuplicate,
        onEditValueChange: actions.handleEditValueChange,
        onStartEdit: actions.startEditingTag,
        onSaveEdit: actions.saveEditingTag,
        onCancelEdit: actions.cancelEditingTag,
        onDeleteTag: actions.handleDeleteTag,
        onToggleTag: actions.handleToggleTag,
      };

      const cached = tagPropsCache.current[tagName];

      // Only create new object if values actually changed
      if (
        !cached ||
        cached.fade !== newProps.fade ||
        cached.nonInteractive !== newProps.nonInteractive ||
        cached.tagState !== newProps.tagState ||
        cached.count !== newProps.count ||
        cached.isHighlighted !== newProps.isHighlighted ||
        cached.isBeingEdited !== newProps.isBeingEdited ||
        cached.editTagValue !== newProps.editTagValue ||
        cached.isDuplicate !== newProps.isDuplicate ||
        cached.onEditValueChange !== newProps.onEditValueChange ||
        cached.onStartEdit !== newProps.onStartEdit ||
        cached.onSaveEdit !== newProps.onSaveEdit ||
        cached.onCancelEdit !== newProps.onCancelEdit ||
        cached.onDeleteTag !== newProps.onDeleteTag ||
        cached.onToggleTag !== newProps.onToggleTag
      ) {
        props[tagName] = newProps;
        hasChanges = true;
      } else {
        props[tagName] = cached; // Reuse cached object reference
      }
    });

    // If nothing changed, return the previous object to maintain referential equality
    if (!hasChanges && Object.keys(tagPropsCache.current).length === tagList.length) {
      return tagPropsCache.current;
    }

    tagPropsCache.current = props;
    return props;
  }, [tagList, calculations, tagsByStatus, globalTagList, filterTagsSet, editTagValue, actions]);

  // Combine all values into a single context value
  // Both calculations and actions are already stable memoized objects from their hooks
  const contextValue = useMemo(
    () => ({
      // Data
      tagList,
      tagsByStatus,
      globalTagList,
      filterTagsSet,

      // State
      newTagInput,
      editTagValue,
      editingTagName,
      isEditing,
      setNewTagInput,
      isDragDropDisabled,

      // Calculations - use stable object reference
      isDuplicate: calculations.isDuplicate,
      isTagBeingEdited: calculations.isTagBeingEdited,
      shouldFade: calculations.shouldFade,
      isTagInteractive: calculations.isTagInteractive,
      isHighlighted: calculations.isHighlighted,

      // Actions - use stable object reference
      startEditingTag: actions.startEditingTag,
      cancelEditingTag: actions.cancelEditingTag,
      saveEditingTag: actions.saveEditingTag,
      handleAddTag: actions.handleAddTag,
      handleAddMultipleTags: actions.handleAddMultipleTags,
      handleDeleteTag: actions.handleDeleteTag,
      handleEditValueChange: actions.handleEditValueChange,
      handleInputChange: actions.handleInputChange,
      handleCancelAdd: actions.handleCancelAdd,
      handleToggleTag: actions.handleToggleTag,

      // Pre-calculated props
      tagProps,
    }),
    [
      tagList,
      tagsByStatus,
      globalTagList,
      filterTagsSet,
      newTagInput,
      editTagValue,
      editingTagName,
      isEditing,
      setNewTagInput,
      isDragDropDisabled,
      calculations, // Use stable object reference
      actions, // Use stable object reference
      tagProps,
    ],
  );

  return (
    <TaggingContext.Provider value={contextValue}>
      {children}
    </TaggingContext.Provider>
  );
};

// Hooks for accessing the unified context
export const useTaggingContext = () => {
  const context = useContext(TaggingContext);
  if (context === undefined) {
    throw new Error('useTaggingContext must be used within a TaggingProvider');
  }
  return context;
};

// Legacy hook - kept for backwards compatibility but no longer used by SortableTag
// SortableTag now receives all props directly to avoid context re-render issues
export const useTagActions = () => {
  const context = useContext(TaggingContext);
  if (context === undefined) {
    throw new Error('useTagActions must be used within a TaggingProvider');
  }

  return {
    isDuplicate: context.isDuplicate,
    editTagValue: context.editTagValue,
    handleEditValueChange: context.handleEditValueChange,
    startEditingTag: context.startEditingTag,
    saveEditingTag: context.saveEditingTag,
    cancelEditingTag: context.cancelEditingTag,
    handleDeleteTag: context.handleDeleteTag,
    handleToggleTag: context.handleToggleTag,
  };
};
