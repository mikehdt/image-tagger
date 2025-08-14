// External imports
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SyntheticEvent, useCallback } from 'react';
import { memo, useRef } from 'react';

import { useTagActions, useTaggingContext } from '../tagging-context';
import { InputTag } from './input-tag';
import { Tag } from './tag';

type SortableTagProps = {
  id: string;
  tagName: string;
  fade: boolean;
  nonInteractive: boolean;
  tagState: number;
  count: number;
  isHighlighted: boolean; // Pre-computed from context
  isBeingEdited: boolean; // Pre-computed from context
};

const SortableTagComponent = ({
  id,
  tagName,
  fade,
  nonInteractive,
  tagState,
  count,
  isHighlighted,
  isBeingEdited,
}: SortableTagProps) => {
  const {
    isDuplicate,
    editTagValue,
    handleEditValueChange,
    startEditingTag,
    saveEditingTag,
    cancelEditingTag,
    handleDeleteTag,
    handleToggleTag,
  } = useTagActions();

  // Get drag/drop disabled state from context
  const { isDragDropDisabled } = useTaggingContext();

  const isEditing = isBeingEdited;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    // Use custom animation settings  for flex-wrap layout
    animateLayoutChanges: ({
      isSorting,
      isDragging,
      wasDragging,
      index,
      newIndex,
    }) => {
      // Only animate when not dragging and we have a new position after sorting
      if (!isDragging && wasDragging && isSorting && index !== newIndex) {
        return true;
      }
      return false;
    },
    // Customize transition for smoother animations with variable-width items
    transition: {
      duration: 200, // milliseconds
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // Smooth easing function
    },
  });

  // Create our own ref to measure the element
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Combined ref function that sets both our tracking ref and dnd-kit's ref
  const setRefs = (element: HTMLDivElement | null) => {
    elementRef.current = element;
    setNodeRef(element);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0, // Higher z-index while dragging
    touchAction: 'none' as const, // Disable browser handling of touch gestures
    // Add will-change to improve rendering performance during animations
    willChange: transition ? 'transform' : undefined,
  };

  // Handler for input value changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // Update via context
      handleEditValueChange(newValue);
    },
    [handleEditValueChange],
  );

  // Handler for saving edits
  const handleSaveEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      saveEditingTag(e);
    },
    [saveEditingTag],
  );

  // Handler for canceling edits
  const handleCancelEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      cancelEditingTag(e);
    },
    [cancelEditingTag],
  );

  // Handler for starting edit mode
  const onHandleStartEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      startEditingTag(tagName);
    },
    [startEditingTag, tagName],
  );

  const onHandleToggleTag = useCallback(
    (e: SyntheticEvent) => handleToggleTag(e, tagName),
    [handleToggleTag, tagName],
  );

  const onHandleDeleteTag = useCallback(
    (e: SyntheticEvent) => handleDeleteTag(e, tagName),
    [handleDeleteTag, tagName],
  );

  return (
    <div
      ref={setRefs}
      style={style}
      // Don't apply drag attributes or listeners when editing, explicitly non-interactive, or drag/drop is disabled
      {...(isEditing || nonInteractive || isDragDropDisabled ? {} : attributes)}
      {...(isEditing || nonInteractive || isDragDropDisabled ? {} : listeners)}
      className={`mr-2 mb-2 flex touch-none ${nonInteractive ? 'pointer-events-none' : ''}`}
      data-tag-name={tagName}
    >
      {isEditing ? (
        <InputTag
          inputValue={editTagValue}
          onInputChange={handleInputChange}
          onSubmit={handleSaveEdit}
          onCancel={handleCancelEdit}
          placeholder="Edit tag..."
          mode="edit"
          isDuplicate={isDuplicate(editTagValue)}
          nonInteractive={nonInteractive}
        />
      ) : (
        <Tag
          tagName={tagName}
          tagState={tagState}
          count={count}
          highlight={isHighlighted}
          fade={fade}
          nonInteractive={nonInteractive}
          onToggleTag={onHandleToggleTag}
          onDeleteTag={onHandleDeleteTag}
          onStartEdit={onHandleStartEdit}
          isDraggable={!isEditing && !isDragDropDisabled}
        />
      )}
    </div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const sortableTagPropsAreEqual = (
  prevProps: SortableTagProps,
  nextProps: SortableTagProps,
): boolean => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.tagName === nextProps.tagName &&
    prevProps.fade === nextProps.fade &&
    prevProps.nonInteractive === nextProps.nonInteractive &&
    prevProps.tagState === nextProps.tagState &&
    prevProps.count === nextProps.count &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isBeingEdited === nextProps.isBeingEdited
  );
};

export const SortableTag = memo(SortableTagComponent, sortableTagPropsAreEqual);
