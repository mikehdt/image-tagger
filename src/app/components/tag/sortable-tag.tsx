// External imports
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SyntheticEvent } from 'react';
import { memo, useRef } from 'react';

import { Tag, TagInput } from './components';
import { useTagContext } from './tag-context';

type SortableTagProps = {
  id: string;
  tagName: string;
  fade?: boolean;
  nonInteractive?: boolean;
  tagState?: number;
  count?: number;
};

const SortableTag = ({
  id,
  tagName,
  fade = false,
  nonInteractive = false,
}: SortableTagProps) => {
  const {
    isTagBeingEdited,
    isDuplicate,
    editTagValue,
    handleEditValueChange,
    startEditingTag,
    saveEditingTag,
    cancelEditingTag,
    handleDeleteTag,
    handleToggleTag,
    isHighlighted,
    tagsByStatus,
    globalTagList,
  } = useTagContext();

  const isEditing = isTagBeingEdited(tagName);

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

  // No handleEditStateChange needed - all handled by context now

  // Handler for input value changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Update via context
    handleEditValueChange(newValue);
  };

  // Handler for saving edits
  const handleSaveEdit = (e: SyntheticEvent) => {
    e.stopPropagation();
    saveEditingTag(e);
  };

  // Handler for canceling edits
  const handleCancelEdit = (e: SyntheticEvent) => {
    e.stopPropagation();
    cancelEditingTag(e);
  };

  // Handler for starting edit mode
  const handleStartEdit = (e: SyntheticEvent) => {
    e.stopPropagation();
    startEditingTag(tagName);
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
            inputValue={editTagValue}
            onInputChange={handleInputChange}
            onSubmit={handleSaveEdit}
            onCancel={handleCancelEdit}
            placeholder="Edit tag..."
            mode="edit"
            isDuplicate={isDuplicate(editTagValue)}
            nonInteractive={nonInteractive}
          />
        </span>
      ) : (
        <Tag
          tagName={tagName}
          tagState={tagsByStatus[tagName] || 0}
          count={globalTagList[tagName] || 0}
          highlight={isHighlighted(tagName)}
          fade={fade}
          nonInteractive={nonInteractive}
          onToggleTag={(e) => handleToggleTag(e, tagName)}
          onDeleteTag={(e) => handleDeleteTag(e, tagName)}
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
    prevProps.fade === nextProps.fade &&
    prevProps.nonInteractive === nextProps.nonInteractive
    // Functions references come from context now
  );
};

const MemoizedSortableTag = memo(SortableTag, areSortableTagsEqual);

// For backward compatibility
export { MemoizedSortableTag as SortableTag };
