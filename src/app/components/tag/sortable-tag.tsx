// External imports
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { memo, useRef, useState } from 'react';

import { Tag } from './tag';
import { TagInput } from './tag-input';

type SortableTagProps = {
  id: string;
  tagName: string;
  tagState: number; // Changed to number to support bitwise flags
  count: number;
  highlight: boolean;
  fade: boolean;
  nonInteractive?: boolean; // New prop to control interactivity separately from fading
  onToggleTag: (e: SyntheticEvent, tagName: string) => void;
  onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
  onEditTag?: (oldTagName: string, newTagName: string) => void;
  onEditValueChange?: (tagName: string, value: string) => void;
  onEditStateChange?: (tagName: string, isEditing: boolean) => void;
  isDuplicate?: boolean;
};

const SortableTag = ({
  id,
  tagName,
  tagState,
  count,
  highlight,
  fade,
  nonInteractive = false, // Default to interactive
  onToggleTag,
  onDeleteTag,
  onEditTag,
  onEditValueChange,
  onEditStateChange,
  isDuplicate = false,
}: SortableTagProps) => {
  // Track whether the tag is currently being edited
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tagName);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    // Use custom animation settings optimized for flex-wrap layout
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

  // Handler for when edit state changes
  const handleEditStateChange = (editing: boolean) => {
    setIsEditing(editing);

    // Notify parent component about edit state change
    if (onEditStateChange) {
      onEditStateChange(tagName, editing);
    }

    // When editing ends, reset the edit value
    if (!editing) {
      setEditValue(tagName);
    }

    // When editing starts, set current value
    // When editing ends, reset the edit value
    if (onEditValueChange) {
      if (editing) {
        onEditValueChange(tagName, tagName); // Pass current tag name to start with
      } else {
        onEditValueChange(tagName, ''); // Clear on finish
      }
    }
  };

  // Handler for input value changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    if (onEditValueChange) {
      onEditValueChange(tagName, newValue);
    }
  };

  // Handler for saving edits
  const handleSaveEdit = (e: SyntheticEvent) => {
    e.stopPropagation();
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== tagName && onEditTag) {
      onEditTag(tagName, trimmedValue);
    }
    handleEditStateChange(false);
  };

  // Handler for canceling edits
  const handleCancelEdit = (e: SyntheticEvent) => {
    e.stopPropagation();
    handleEditStateChange(false);
  };

  // Handler for starting edit mode
  const handleStartEdit = (e: SyntheticEvent) => {
    e.stopPropagation();
    handleEditStateChange(true);
  };

  return (
    <div
      ref={setRefs}
      style={style}
      // Don't apply drag attributes or listeners when editing or explicitly non-interactive
      {...(isEditing || nonInteractive ? {} : attributes)}
      {...(isEditing || nonInteractive ? {} : listeners)}
      className={`touch-none ${nonInteractive ? 'pointer-events-none' : ''}`}
      data-tag-name={tagName}
    >
      {isEditing ? (
        <span className="mb-2 flex">
          <TagInput
            inputValue={editValue}
            onInputChange={handleInputChange}
            onSubmit={handleSaveEdit}
            onCancel={handleCancelEdit}
            placeholder="Edit tag..."
            mode="edit"
            isDuplicate={isDuplicate}
            nonInteractive={nonInteractive}
          />
        </span>
      ) : (
        <Tag
          tagName={tagName}
          tagState={tagState}
          count={count}
          highlight={highlight}
          fade={fade}
          nonInteractive={nonInteractive}
          onToggleTag={onToggleTag}
          onDeleteTag={onDeleteTag}
          onStartEdit={handleStartEdit}
          isDraggable={!isEditing}
        />
      )}
    </div>
  );
};

// Custom equality function for SortableTag - ensure we re-render when props change
const areSortableTagsEqual = (
  prevProps: SortableTagProps,
  nextProps: SortableTagProps,
) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.tagName === nextProps.tagName &&
    prevProps.tagState === nextProps.tagState &&
    prevProps.count === nextProps.count &&
    prevProps.highlight === nextProps.highlight &&
    prevProps.fade === nextProps.fade &&
    prevProps.nonInteractive === nextProps.nonInteractive &&
    prevProps.isDuplicate === nextProps.isDuplicate
    // Functions references should be stable from parent with useCallback
  );
};

const MemoizedSortableTag = memo(SortableTag, areSortableTagsEqual);

// For backward compatibility
export { MemoizedSortableTag as SortableTag };
