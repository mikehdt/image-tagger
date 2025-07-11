import { SyntheticEvent } from 'react';
import { createContext, ReactNode, useContext, useMemo } from 'react';

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
  const tagProps = useMemo(() => {
    const props: Record<
      string,
      {
        fade: boolean;
        nonInteractive: boolean;
        tagState: number;
        count: number;
        isHighlighted: boolean;
      }
    > = {};

    tagList.forEach((tagName) => {
      props[tagName] = {
        fade: calculations.shouldFade(tagName),
        nonInteractive: !calculations.isTagInteractive(tagName),
        tagState: tagsByStatus[tagName] || 0,
        count: globalTagList[tagName] || 0,
        isHighlighted: calculations.isHighlighted(tagName),
      };
    });

    return props;
  }, [tagList, calculations, tagsByStatus, globalTagList]);

  // Combine all values into a single context value
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

      // Calculations
      ...calculations,

      // Actions
      ...actions,

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
      calculations,
      actions,
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
