/**
 * SortableTag Component v2
 *
 * Wraps EditableTag with drag-and-drop capability using useSortable.
 * The editing UI is handled by EditableTag, keeping concerns separated.
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';

import { track } from '@/app/utils/render-tracker';

import { EditableTag } from './editable-tag';

type SortableTagProps = {
  id: string;
  tagName: string;
  tagState: number;
  count: number;
  isHighlighted: boolean;
  fade: boolean;
  isMatchingDuplicate?: boolean;
  isEditing: boolean;
  editValue: string;
  onToggle: (tagName: string) => void;
  onEdit: (tagName: string) => void;
  onDelete: (tagName: string) => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  isDuplicateEdit: boolean;
};

const SortableTagComponent = ({
  id,
  tagName,
  tagState,
  count,
  isHighlighted,
  fade,
  isMatchingDuplicate,
  isEditing,
  editValue,
  onToggle,
  onEdit,
  onDelete,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  isDuplicateEdit,
}: SortableTagProps) => {
  track('SortableTag', 'render');

  // Disable drag while editing, faded, or when shown as matching duplicate
  const isDragDisabled = isEditing || fade || isMatchingDuplicate;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isDragDisabled,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
    touchAction: 'none' as const,
  };

  track('SortableTag', 'render-end');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDragDisabled ? {} : attributes)}
      {...(isDragDisabled ? {} : listeners)}
      className={`mr-2 mb-2 ${isDragDisabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <EditableTag
        tagName={tagName}
        tagState={tagState}
        count={count}
        isHighlighted={isHighlighted}
        fade={fade}
        isMatchingDuplicate={isMatchingDuplicate}
        isEditing={isEditing}
        editValue={editValue}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onEditChange={onEditChange}
        onEditSubmit={onEditSubmit}
        onEditCancel={onEditCancel}
        isDuplicateEdit={isDuplicateEdit}
      />
    </div>
  );
};

// Memo comparison - skip re-render if props unchanged
const sortableTagPropsAreEqual = (
  prevProps: SortableTagProps,
  nextProps: SortableTagProps,
): boolean => {
  track('SortableTag', 'memo-check');

  // If editing state changes, must re-render
  if (prevProps.isEditing !== nextProps.isEditing) {
    return false;
  }

  // During edit mode, check edit-specific props
  if (nextProps.isEditing) {
    if (
      prevProps.editValue !== nextProps.editValue ||
      prevProps.isDuplicateEdit !== nextProps.isDuplicateEdit
    ) {
      return false;
    }
  }

  // Check all visual/interaction props
  const isEqual =
    prevProps.id === nextProps.id &&
    prevProps.tagName === nextProps.tagName &&
    prevProps.tagState === nextProps.tagState &&
    prevProps.count === nextProps.count &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.fade === nextProps.fade &&
    prevProps.isMatchingDuplicate === nextProps.isMatchingDuplicate &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onEditChange === nextProps.onEditChange &&
    prevProps.onEditSubmit === nextProps.onEditSubmit &&
    prevProps.onEditCancel === nextProps.onEditCancel;

  if (isEqual) track('SortableTag', 'memo-hit');
  return isEqual;
};

export const SortableTag = memo(SortableTagComponent, sortableTagPropsAreEqual);
