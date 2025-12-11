/**
 * TagList Component v2
 *
 * Phase 5: DndContext moved inside memo boundary
 * - DndContext and SortableContext are now inside TagsDisplay
 * - Memo blocks re-renders of entire DnD subtree when tags unchanged
 * - Edit state managed here to keep it close to where it's used
 */
import { closestCenter, DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { memo, useCallback, useRef, useState } from 'react';

import { track } from '@/app/utils/render-tracker';

import { InputTag } from './input-tag';
import { SortableTag } from './sortable-tag';
import { Tag } from './tag';

type TagData = {
  name: string;
  state: number;
  count: number;
  isHighlighted: boolean;
};

type TagListProps = {
  tags: TagData[];
  sortable?: boolean;
  assetId: string;
  // DnD props - passed through to TagsDisplay
  sensors: ReturnType<typeof import('@dnd-kit/core').useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  // Handlers
  onAddTag: (tagName: string) => void;
  onToggleTag: (tagName: string) => void;
  onEditTag: (oldName: string, newName: string) => void;
  onDeleteTag: (tagName: string) => void;
};

/**
 * Inner component that renders tags with DnD context inside memo boundary
 * DndContext is inside here so memo can block re-renders of entire DnD subtree
 */
type TagsDisplayProps = {
  tags: TagData[];
  sortable: boolean;
  assetId: string;
  // DnD props
  sensors: ReturnType<typeof import('@dnd-kit/core').useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  // Edit state
  editingTagName: string | null;
  editValue: string;
  isDuplicateEdit: boolean;
  // Handlers
  onToggleTag: (tagName: string) => void;
  onEditTag: (tagName: string) => void;
  onDeleteTag: (tagName: string) => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
};

const TagsDisplayComponent = ({
  tags,
  sortable,
  assetId,
  sensors,
  onDragEnd,
  editingTagName,
  editValue,
  isDuplicateEdit,
  onToggleTag,
  onEditTag,
  onDeleteTag,
  onEditChange,
  onEditSubmit,
  onEditCancel,
}: TagsDisplayProps) => {
  track('TagsDisplay', 'render');

  // Conditional DnD: only render DndContext when hovered or dragging
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    // Don't disable DnD if we're mid-drag
    if (!isDraggingRef.current) {
      setIsHovered(false);
    }
  }, []);

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      isDraggingRef.current = false;
      onDragEnd(event);
    },
    [onDragEnd],
  );

  const tagNames = tags.map((t) => t.name);
  const dndEnabled = sortable && isHovered;

  const tagElements = tags.map((tag) =>
    dndEnabled ? (
      <SortableTag
        key={tag.name}
        id={tag.name}
        tagName={tag.name}
        tagState={tag.state}
        count={tag.count}
        isHighlighted={tag.isHighlighted}
        fade={editingTagName !== null && editingTagName !== tag.name}
        isEditing={editingTagName === tag.name}
        editValue={editValue}
        onToggle={onToggleTag}
        onEdit={onEditTag}
        onDelete={onDeleteTag}
        onEditChange={onEditChange}
        onEditSubmit={onEditSubmit}
        onEditCancel={onEditCancel}
        isDuplicateEdit={isDuplicateEdit}
      />
    ) : (
      <div key={tag.name} className="mr-2 mb-2">
        <Tag
          tagName={tag.name}
          tagState={tag.state}
          count={tag.count}
          isHighlighted={tag.isHighlighted}
          fade={editingTagName !== null && editingTagName !== tag.name}
          onToggle={onToggleTag}
          onEdit={onEditTag}
          onDelete={onDeleteTag}
        />
      </div>
    ),
  );

  track('TagsDisplay', 'render-end');

  // DndContext only rendered when hovered - eliminates dnd-kit overhead when not needed
  return (
    <div className="flex flex-wrap" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {dndEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tagNames} strategy={rectSortingStrategy} id={`taglist-${assetId}`}>
            {tagElements}
          </SortableContext>
        </DndContext>
      ) : (
        tagElements
      )}
    </div>
  );
};

// Memo comparison - skip re-render only when NOT editing
const tagsDisplayPropsAreEqual = (
  prevProps: TagsDisplayProps,
  nextProps: TagsDisplayProps,
): boolean => {
  track('TagsDisplay', 'memo-check');

  // If either state is editing, don't memo (need to update for keystroke/fade changes)
  if (prevProps.editingTagName !== null || nextProps.editingTagName !== null) {
    // But if editing the same tag and only editValue changed, we still need to re-render
    // So just return false to always re-render during edit mode
    return false;
  }

  // Check sortable mode
  if (prevProps.sortable !== nextProps.sortable) {
    return false;
  }

  // Handler references should be stable from useCallback
  if (
    prevProps.onToggleTag !== nextProps.onToggleTag ||
    prevProps.onEditTag !== nextProps.onEditTag ||
    prevProps.onDeleteTag !== nextProps.onDeleteTag
  ) {
    return false;
  }

  // Quick length check
  if (prevProps.tags.length !== nextProps.tags.length) {
    return false;
  }

  // Deep comparison of tag data only
  const isEqual = prevProps.tags.every((prevTag, i) => {
    const nextTag = nextProps.tags[i];
    return (
      prevTag.name === nextTag.name &&
      prevTag.state === nextTag.state &&
      prevTag.count === nextTag.count &&
      prevTag.isHighlighted === nextTag.isHighlighted
    );
  });

  if (isEqual) track('TagsDisplay', 'memo-hit');
  return isEqual;
};

const TagsDisplay = memo(TagsDisplayComponent, tagsDisplayPropsAreEqual);

/**
 * Main TagList component
 */
const TagListComponent = ({
  tags,
  sortable = false,
  assetId,
  sensors,
  onDragEnd,
  onAddTag,
  onToggleTag,
  onEditTag,
  onDeleteTag,
}: TagListProps) => {
  track('TagList', 'render');

  // Add new tag input state
  const [inputValue, setInputValue] = useState('');

  // Edit tag state
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Check if add input would be a duplicate
  const isDuplicateAdd = tags.some(
    (tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase(),
  );

  // Check if edit input would be a duplicate (excluding the tag being edited)
  const isDuplicateEdit =
    editValue.trim().toLowerCase() !== editingTagName?.toLowerCase() &&
    tags.some((tag) => tag.name.toLowerCase() === editValue.trim().toLowerCase());

  // Add input handlers
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (inputValue.trim() && !isDuplicateAdd) {
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  }, [inputValue, isDuplicateAdd, onAddTag]);

  const handleCancel = useCallback(() => {
    setInputValue('');
  }, []);

  // Edit handlers
  const handleStartEdit = useCallback((tagName: string) => {
    setEditingTagName(tagName);
    setEditValue(tagName);
  }, []);

  const handleEditChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const handleEditSubmit = useCallback(() => {
    if (editingTagName && editValue.trim() && !isDuplicateEdit) {
      if (editValue.trim() !== editingTagName) {
        onEditTag(editingTagName, editValue.trim());
      }
      setEditingTagName(null);
      setEditValue('');
    }
  }, [editingTagName, editValue, isDuplicateEdit, onEditTag]);

  const handleEditCancel = useCallback(() => {
    setEditingTagName(null);
    setEditValue('');
  }, []);

  track('TagList', 'render-end');

  return (
    <div className="flex h-full w-full flex-col">
      <TagsDisplay
        tags={tags}
        sortable={sortable}
        assetId={assetId}
        sensors={sensors}
        onDragEnd={onDragEnd}
        editingTagName={editingTagName}
        editValue={editValue}
        isDuplicateEdit={isDuplicateEdit}
        onToggleTag={onToggleTag}
        onEditTag={handleStartEdit}
        onDeleteTag={onDeleteTag}
        onEditChange={handleEditChange}
        onEditSubmit={handleEditSubmit}
        onEditCancel={handleEditCancel}
      />

      <div className="mt-2">
        <InputTag
          mode="add"
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          placeholder="Add tag..."
          isDuplicate={isDuplicateAdd}
          disabled={editingTagName !== null}
        />
      </div>
    </div>
  );
};

const tagListPropsAreEqual = (prevProps: TagListProps, nextProps: TagListProps): boolean => {
  track('TagList', 'memo-check');

  // Check sortable mode and assetId
  if (prevProps.sortable !== nextProps.sortable || prevProps.assetId !== nextProps.assetId) {
    return false;
  }

  // Check DnD callback references (sensors is stable from useSensors)
  if (prevProps.sensors !== nextProps.sensors || prevProps.onDragEnd !== nextProps.onDragEnd) {
    return false;
  }

  // Check callback references
  if (
    prevProps.onAddTag !== nextProps.onAddTag ||
    prevProps.onToggleTag !== nextProps.onToggleTag ||
    prevProps.onEditTag !== nextProps.onEditTag ||
    prevProps.onDeleteTag !== nextProps.onDeleteTag
  ) {
    return false;
  }

  // Check tags array
  if (prevProps.tags.length !== nextProps.tags.length) {
    return false;
  }

  const isEqual = prevProps.tags.every((prevTag, i) => {
    const nextTag = nextProps.tags[i];
    return (
      prevTag.name === nextTag.name &&
      prevTag.state === nextTag.state &&
      prevTag.count === nextTag.count &&
      prevTag.isHighlighted === nextTag.isHighlighted
    );
  });

  if (isEqual) track('TagList', 'memo-hit');
  return isEqual;
};

export const TagList = memo(TagListComponent, tagListPropsAreEqual);
