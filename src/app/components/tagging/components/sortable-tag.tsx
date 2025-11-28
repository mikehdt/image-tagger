// External imports
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SyntheticEvent, useCallback } from 'react';
import { memo, useRef } from 'react';

import { InputTag } from './input-tag';
import { Tag } from './tag';

type SortableTagProps = {
  id: string;
  tagName: string;
  fade: boolean;
  nonInteractive: boolean;
  tagState: number;
  count: number;
  isHighlighted: boolean;
  isBeingEdited: boolean;
  isDragDropDisabled: boolean;
  // Action callbacks passed as props
  editTagValue: string;
  isDuplicate: (value: string) => boolean;
  onEditValueChange: (value: string) => void;
  onStartEdit: (tagName: string) => void;
  onSaveEdit: (e?: SyntheticEvent) => void;
  onCancelEdit: (e?: SyntheticEvent) => void;
  onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
  onToggleTag: (e: SyntheticEvent, tagName: string) => void;
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
  isDragDropDisabled,
  editTagValue,
  isDuplicate,
  onEditValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteTag,
  onToggleTag,
}: SortableTagProps) => {

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
      onEditValueChange(newValue);
    },
    [onEditValueChange],
  );

  // Handler for saving edits
  const handleSaveEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      onSaveEdit(e);
    },
    [onSaveEdit],
  );

  // Handler for canceling edits
  const handleCancelEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      onCancelEdit(e);
    },
    [onCancelEdit],
  );

  // Handler for starting edit mode
  const onHandleStartEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      onStartEdit(tagName);
    },
    [onStartEdit, tagName],
  );

  const onHandleToggleTag = useCallback(
    (e: SyntheticEvent) => onToggleTag(e, tagName),
    [onToggleTag, tagName],
  );

  const onHandleDeleteTag = useCallback(
    (e: SyntheticEvent) => onDeleteTag(e, tagName),
    [onDeleteTag, tagName],
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
  // Check primitive values
  if (
    prevProps.id !== nextProps.id ||
    prevProps.tagName !== nextProps.tagName ||
    prevProps.fade !== nextProps.fade ||
    prevProps.nonInteractive !== nextProps.nonInteractive ||
    prevProps.tagState !== nextProps.tagState ||
    prevProps.count !== nextProps.count ||
    prevProps.isHighlighted !== nextProps.isHighlighted ||
    prevProps.isBeingEdited !== nextProps.isBeingEdited ||
    prevProps.isDragDropDisabled !== nextProps.isDragDropDisabled
  ) {
    return false;
  }

  // Only check editTagValue if this tag is being edited
  if (nextProps.isBeingEdited && prevProps.editTagValue !== nextProps.editTagValue) {
    return false;
  }

  // Check function reference equality
  // These should be stable references from context
  return (
    prevProps.isDuplicate === nextProps.isDuplicate &&
    prevProps.onEditValueChange === nextProps.onEditValueChange &&
    prevProps.onStartEdit === nextProps.onStartEdit &&
    prevProps.onSaveEdit === nextProps.onSaveEdit &&
    prevProps.onCancelEdit === nextProps.onCancelEdit &&
    prevProps.onDeleteTag === nextProps.onDeleteTag &&
    prevProps.onToggleTag === nextProps.onToggleTag
  );
};

export const SortableTag = memo(SortableTagComponent, sortableTagPropsAreEqual);
