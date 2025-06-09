import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo, type SyntheticEvent } from 'react';

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
}: SortableTagProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    // Use this to ensure we don't animate layout changes
    animateLayoutChanges: () => false
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0, // Higher z-index while dragging
    touchAction: 'none' as const, // Disable browser handling of touch gestures
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <Tag
        tagName={tagName}
        tagState={tagState}
        count={count}
        highlight={highlight}
        fade={fade}
        onToggleTag={onToggleTag}
        onDeleteTag={onDeleteTag}
        isDraggable={true}
      />
    </div>
  );
};

// Custom equality function for SortableTag - ensure we re-render when props change
const areSortableTagsEqual = (prevProps: SortableTagProps, nextProps: SortableTagProps) => {
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
