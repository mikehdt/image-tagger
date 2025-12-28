/**
 * TagList Component v2
 *
 * Phase 5: DndContext moved inside memo boundary
 * - DndContext and SortableContext are now inside TagsDisplay
 * - Memo blocks re-renders of entire DnD subtree when tags unchanged
 * - Edit state managed here to keep it close to where it's used
 */
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Button } from '../../shared/button';
import { useToast } from '../../shared/toast';
import { EditableTag } from './editable-tag';
import { InputTag } from './input-tag';
import { SortableTag } from './sortable-tag';

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
  // Duplicate match state (for fading non-matching tags)
  matchingTagName: string | null;
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
  matchingTagName,
  onToggleTag,
  onEditTag,
  onDeleteTag,
  onEditChange,
  onEditSubmit,
  onEditCancel,
}: TagsDisplayProps) => {
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
  // Keep DnD enabled (which renders SortableTag with InputTag) when editing
  const dndEnabled = sortable && (isHovered || editingTagName !== null);

  // Fade logic: when editing or when add input matches an existing tag,
  // fade all tags except the one being edited and the one that matches
  const isInputActive = editingTagName !== null || matchingTagName !== null;

  const tagElements = tags.map((tag) => {
    const isBeingEdited = editingTagName === tag.name;
    const isMatchingTag = matchingTagName === tag.name;
    const fade = isInputActive && !isBeingEdited && !isMatchingTag;

    return dndEnabled ? (
      <SortableTag
        key={tag.name}
        id={tag.name}
        tagName={tag.name}
        tagState={tag.state}
        count={tag.count}
        isHighlighted={tag.isHighlighted}
        fade={fade}
        isMatchingDuplicate={isMatchingTag}
        isEditing={isBeingEdited}
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
        <EditableTag
          tagName={tag.name}
          tagState={tag.state}
          count={tag.count}
          isHighlighted={tag.isHighlighted}
          fade={fade}
          isMatchingDuplicate={isMatchingTag}
          isEditing={isBeingEdited}
          editValue={editValue}
          onToggle={onToggleTag}
          onEdit={onEditTag}
          onDelete={onDeleteTag}
          onEditChange={onEditChange}
          onEditSubmit={onEditSubmit}
          onEditCancel={onEditCancel}
          isDuplicateEdit={isDuplicateEdit}
        />
      </div>
    );
  });

  // DndContext only rendered when hovered - eliminates dnd-kit overhead when not needed
  return (
    <div
      className="flex flex-wrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {dndEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tagNames}
            strategy={rectSortingStrategy}
            id={`taglist-${assetId}`}
          >
            {tagElements}
          </SortableContext>
        </DndContext>
      ) : (
        tagElements
      )}
    </div>
  );
};

// Memo comparison - skip re-render only when NOT editing and no matching tag
const tagsDisplayPropsAreEqual = (
  prevProps: TagsDisplayProps,
  nextProps: TagsDisplayProps,
): boolean => {
  // If either state is editing, don't memo (need to update for keystroke/fade changes)
  if (prevProps.editingTagName !== null || nextProps.editingTagName !== null) {
    // But if editing the same tag and only editValue changed, we still need to re-render
    // So just return false to always re-render during edit mode
    return false;
  }

  // If matchingTagName changes, need to re-render for fade effect
  if (prevProps.matchingTagName !== nextProps.matchingTagName) {
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
  const { showToast } = useToast();

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
    tags.some(
      (tag) => tag.name.toLowerCase() === editValue.trim().toLowerCase(),
    );

  // Find the matching tag name for fading other tags
  // When adding: show which tag already exists with that name
  // When editing: show which tag conflicts with the new name
  const matchingTagName = (() => {
    const addInputTrimmed = inputValue.trim().toLowerCase();
    const editInputTrimmed = editValue.trim().toLowerCase();

    // Check add input first (if there's content and it matches)
    if (addInputTrimmed) {
      const matchingTag = tags.find(
        (tag) => tag.name.toLowerCase() === addInputTrimmed,
      );
      if (matchingTag) return matchingTag.name;
    }

    // Check edit input (if editing and the new value conflicts with another tag)
    if (editingTagName && editInputTrimmed !== editingTagName.toLowerCase()) {
      const matchingTag = tags.find(
        (tag) => tag.name.toLowerCase() === editInputTrimmed,
      );
      if (matchingTag) return matchingTag.name;
    }

    return null;
  })();

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

  // Handle multiple tags from paste or comma-separated input
  const handleMultipleTagsSubmit = useCallback(
    (newTags: string[]) => {
      // Get existing tag names for duplicate checking
      const existingTagNames = new Set(tags.map((t) => t.name.toLowerCase()));

      // Filter out duplicates and add each unique tag
      const uniqueTags = newTags.filter(
        (tag) => !existingTagNames.has(tag.toLowerCase()),
      );

      uniqueTags.forEach((tag) => {
        onAddTag(tag);
      });

      setInputValue('');
    },
    [tags, onAddTag],
  );

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

  // Determine which tags to copy and whether it's a partial copy
  const copyInfo = useMemo(() => {
    // Get highlighted tags (those matching filter) that are in this asset
    const highlightedTagsInAsset = tags
      .filter((tag) => tag.isHighlighted)
      .map((tag) => tag.name);

    // If we have highlighted tags, copy only those; otherwise copy all
    const shouldCopySelection = highlightedTagsInAsset.length > 0;
    const tagsToCopy = shouldCopySelection
      ? highlightedTagsInAsset
      : tags.map((tag) => tag.name);

    return {
      tagsToCopy,
      isPartialCopy: shouldCopySelection,
      selectedCount: highlightedTagsInAsset.length,
    };
  }, [tags]);

  const handleCopyTags = useCallback(async () => {
    const tagsText = copyInfo.tagsToCopy.join(', ');

    try {
      await navigator.clipboard.writeText(tagsText);

      if (copyInfo.isPartialCopy) {
        showToast(
          `Copied ${copyInfo.selectedCount} selected ${copyInfo.selectedCount === 1 ? 'tag' : 'tags'}`,
        );
      } else {
        showToast('Tags copied to clipboard');
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      showToast('Failed to copy tags');
    }
  }, [copyInfo, showToast]);

  return (
    <div className="flex h-full w-full">
      <div className="flex flex-1 flex-col">
        <TagsDisplay
          tags={tags}
          sortable={sortable}
          assetId={assetId}
          sensors={sensors}
          onDragEnd={onDragEnd}
          editingTagName={editingTagName}
          editValue={editValue}
          isDuplicateEdit={isDuplicateEdit}
          matchingTagName={matchingTagName}
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
            onMultipleTagsSubmit={handleMultipleTagsSubmit}
          />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="self-end">
          <Button
            onClick={handleCopyTags}
            variant="ghost"
            size="smallSquare"
            color={copyInfo.isPartialCopy ? 'emerald' : 'slate'}
            title={
              copyInfo.isPartialCopy
                ? `Copy ${copyInfo.selectedCount} selected ${copyInfo.selectedCount === 1 ? 'tag' : 'tags'} as comma-separated list`
                : 'Copy all tags as comma-separated list'
            }
          >
            <ClipboardDocumentIcon className="w-4 opacity-50" />
          </Button>
        </div>
      )}
    </div>
  );
};

const tagListPropsAreEqual = (
  prevProps: TagListProps,
  nextProps: TagListProps,
): boolean => {
  // Check sortable mode and assetId
  if (
    prevProps.sortable !== nextProps.sortable ||
    prevProps.assetId !== nextProps.assetId
  ) {
    return false;
  }

  // Check DnD callback references (sensors is stable from useSensors)
  if (
    prevProps.sensors !== nextProps.sensors ||
    prevProps.onDragEnd !== nextProps.onDragEnd
  ) {
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

  return prevProps.tags.every((prevTag, i) => {
    const nextTag = nextProps.tags[i];
    return (
      prevTag.name === nextTag.name &&
      prevTag.state === nextTag.state &&
      prevTag.count === nextTag.count &&
      prevTag.isHighlighted === nextTag.isHighlighted
    );
  });
};

export const TagList = memo(TagListComponent, tagListPropsAreEqual);
