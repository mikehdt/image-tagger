/**
 * EditableTag Component
 *
 * Wraps Tag and InputTag to provide inline editing capability.
 * This component separates the editing concern from drag-and-drop,
 * allowing editing to work regardless of whether DnD is enabled.
 */
import { memo } from 'react';

import { track } from '@/app/utils/render-tracker';

import { InputTag } from './input-tag';
import { Tag } from './tag';

type EditableTagProps = {
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

const EditableTagComponent = ({
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
}: EditableTagProps) => {
  track('EditableTag', 'render');

  if (isEditing) {
    return (
      <InputTag
        mode="edit"
        value={editValue}
        onChange={onEditChange}
        onSubmit={onEditSubmit}
        onCancel={onEditCancel}
        placeholder="Edit tag..."
        isDuplicate={isDuplicateEdit}
      />
    );
  }

  return (
    <Tag
      tagName={tagName}
      tagState={tagState}
      count={count}
      isHighlighted={isHighlighted}
      fade={fade}
      isMatchingDuplicate={isMatchingDuplicate}
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

// Memo comparison - re-render when editing state or visual props change
const editableTagPropsAreEqual = (
  prevProps: EditableTagProps,
  nextProps: EditableTagProps,
): boolean => {
  track('EditableTag', 'memo-check');

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

  if (isEqual) track('EditableTag', 'memo-hit');
  return isEqual;
};

export const EditableTag = memo(EditableTagComponent, editableTagPropsAreEqual);
