/**
 * SortableTag Component v2
 *
 * Phase 4: Supports inline editing
 * - Uses useSortable for drag/drop capability
 * - Renders InputTag when editing, Tag otherwise
 * - Disables drag during edit mode
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';

import { track } from '@/app/utils/render-tracker';

import { InputTag } from './input-tag';
import { Tag } from './tag';

type SortableTagProps = {
  id: string;
  tagName: string;
  tagState: number;
  count: number;
  isHighlighted: boolean;
  fade: boolean;
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isEditing || fade, // Disable drag while editing or when faded
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
      {...(isEditing ? {} : attributes)}
      {...(isEditing ? {} : listeners)}
      className={`mr-2 mb-2 ${isEditing || fade ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {isEditing ? (
        <InputTag
          mode="edit"
          value={editValue}
          onChange={onEditChange}
          onSubmit={onEditSubmit}
          onCancel={onEditCancel}
          placeholder="Edit tag..."
          isDuplicate={isDuplicateEdit}
        />
      ) : (
        <Tag
          tagName={tagName}
          tagState={tagState}
          count={count}
          isHighlighted={isHighlighted}
          fade={fade}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
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
