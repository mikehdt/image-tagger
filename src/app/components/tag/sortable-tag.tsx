import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo, type SyntheticEvent, useRef, useState } from 'react';

import { Tag } from './tag';

type SortableTagProps = {
  id: string;
  tagName: string;
  tagState: number; // Changed to number to support bitwise flags
  count: number;
  highlight: boolean;
  fade: boolean;
  onToggleTag: (e: SyntheticEvent, tagName: string) => void;
  onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
  onEditTag?: (oldTagName: string, newTagName: string) => void;
  onEditValueChange?: (tagName: string, value: string) => void;
  isDuplicate?: boolean;
};

const SortableTag = ({
  id,
  tagName,
  tagState,
  count,
  highlight,
  fade,
  onToggleTag,
  onDeleteTag,
  onEditTag,
  onEditValueChange,
  isDuplicate = false,
}: SortableTagProps) => {
  // Track whether the tag is currently being edited
  const [isEditing, setIsEditing] = useState(false);

  // This will be used to disable drag when editing

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
    // When editing starts, set an empty value to trigger fading
    // When editing ends, reset the edit value
    if (onEditValueChange) {
      if (editing) {
        onEditValueChange(tagName, tagName); // Pass current tag name to start with
      } else {
        onEditValueChange(tagName, ''); // Clear on finish
      }
    }
  };

  // Handler for tracking edit input value
  const handleEditValueChange = (value: string) => {
    if (onEditValueChange) {
      onEditValueChange(tagName, value);
    }
  };

  return (
    <div
      ref={setRefs}
      style={style}
      // Don't apply drag attributes or listeners when editing or faded
      {...(isEditing || fade ? {} : attributes)}
      {...(isEditing || fade ? {} : listeners)}
      className={`touch-none ${fade ? 'pointer-events-none' : ''}`}
      data-tag-name={tagName}
    >
      <Tag
        tagName={tagName}
        tagState={tagState}
        count={count}
        highlight={highlight}
        fade={fade}
        onToggleTag={onToggleTag}
        onDeleteTag={onDeleteTag}
        onEditTag={onEditTag}
        isDraggable={!isEditing}
        onEditStateChange={handleEditStateChange}
        onEditValueChange={handleEditValueChange}
        isDuplicate={isDuplicate}
      />
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
    prevProps.fade === nextProps.fade
    // Functions references should be stable from parent with useCallback
  );
};

const MemoizedSortableTag = memo(SortableTag, areSortableTagsEqual);

// For backward compatibility
export { MemoizedSortableTag as SortableTag };
