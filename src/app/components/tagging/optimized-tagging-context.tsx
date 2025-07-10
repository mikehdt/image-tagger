import { SyntheticEvent } from 'react';
import { createContext, ReactNode, useContext, useMemo } from 'react';

import {
  useTagActions as useTagActionsHook,
  useTagCalculations as useTagCalculationsHook,
  useTagStateWithCallback,
} from './hooks';

// Split contexts for better performance
type TagDataContextType = {
  tagList: string[];
  tagsByStatus: Record<string, number>;
  globalTagList: Record<string, number>;
  filterTagsSet: Set<string>;
};

type TagStateContextType = {
  newTagInput: string;
  editTagValue: string;
  editingTagName: string;
  isEditing: boolean;
  setNewTagInput: (value: string) => void;
};

type TagCalculationsContextType = {
  isDuplicate: (tagName: string) => boolean;
  isTagBeingEdited: (tagName: string) => boolean;
  shouldFade: (tagName: string) => boolean;
  isTagInteractive: (tagName: string) => boolean;
  isHighlighted: (tagName: string) => boolean;
};

type TagActionsContextType = {
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

// New type for pre-calculated tag props
type TagPropsContextType = {
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

const TagDataContext = createContext<TagDataContextType | undefined>(undefined);
const TagStateContext = createContext<TagStateContextType | undefined>(
  undefined,
);
const TagCalculationsContext = createContext<
  TagCalculationsContextType | undefined
>(undefined);
const TagActionsContext = createContext<TagActionsContextType | undefined>(
  undefined,
);
const TagPropsContext = createContext<TagPropsContextType | undefined>(
  undefined,
);

// Optimized provider that splits concerns
export const OptimizedTaggingProvider = ({
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

  // Memoize each context value separately to minimize re-renders
  const tagDataValue = useMemo(
    () => ({
      tagList,
      tagsByStatus,
      globalTagList,
      filterTagsSet,
    }),
    [tagList, tagsByStatus, globalTagList, filterTagsSet],
  );

  const tagStateValue = useMemo(
    () => ({
      newTagInput,
      editTagValue,
      editingTagName,
      isEditing,
      setNewTagInput,
    }),
    [newTagInput, editTagValue, editingTagName, isEditing, setNewTagInput],
  );

  const calculationsValue = useMemo(() => calculations, [calculations]);

  const actionsValue = useMemo(() => actions, [actions]);

  // Pre-calculate all tag props to avoid function calls in render loop
  const tagPropsValue = useMemo(() => {
    const tagProps: Record<
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
      tagProps[tagName] = {
        fade: calculations.shouldFade(tagName),
        nonInteractive: !calculations.isTagInteractive(tagName),
        tagState: tagsByStatus[tagName] || 0,
        count: globalTagList[tagName] || 0,
        isHighlighted: calculations.isHighlighted(tagName),
      };
    });

    return { tagProps };
  }, [tagList, calculations, tagsByStatus, globalTagList]);

  return (
    <TagDataContext.Provider value={tagDataValue}>
      <TagStateContext.Provider value={tagStateValue}>
        <TagCalculationsContext.Provider value={calculationsValue}>
          <TagActionsContext.Provider value={actionsValue}>
            <TagPropsContext.Provider value={tagPropsValue}>
              {children}
            </TagPropsContext.Provider>
          </TagActionsContext.Provider>
        </TagCalculationsContext.Provider>
      </TagStateContext.Provider>
    </TagDataContext.Provider>
  );
};

// Hooks for accessing specific contexts
export const useOptimizedTagData = () => {
  const context = useContext(TagDataContext);
  if (context === undefined) {
    throw new Error(
      'useOptimizedTagData must be used within a TaggingProvider',
    );
  }
  return context;
};

export const useOptimizedTagState = () => {
  const context = useContext(TagStateContext);
  if (context === undefined) {
    throw new Error(
      'useOptimizedTagState must be used within a TaggingProvider',
    );
  }
  return context;
};

export const useOptimizedTagCalculations = () => {
  const context = useContext(TagCalculationsContext);
  if (context === undefined) {
    throw new Error(
      'useOptimizedTagCalculations must be used within a TaggingProvider',
    );
  }
  return context;
};

export const useOptimizedTagActions = () => {
  const context = useContext(TagActionsContext);
  if (context === undefined) {
    throw new Error(
      'useOptimizedTagActions must be used within a TaggingProvider',
    );
  }
  return context;
};

export const useOptimizedTagProps = () => {
  const context = useContext(TagPropsContext);
  if (context === undefined) {
    throw new Error(
      'useOptimizedTagProps must be used within a TaggingProvider',
    );
  }
  return context;
};

// Composite hook for backwards compatibility
export const useOptimizedTaggingContext = () => {
  const data = useOptimizedTagData();
  const state = useOptimizedTagState();
  const calculations = useOptimizedTagCalculations();
  const actions = useOptimizedTagActions();
  const props = useOptimizedTagProps();

  return {
    ...data,
    ...state,
    ...calculations,
    ...actions,
    ...props,
  };
};
