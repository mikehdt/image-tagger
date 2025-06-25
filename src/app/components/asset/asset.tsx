import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import Image from 'next/image';
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  addTag,
  deleteTag,
  editTag,
  ImageDimensions,
  IoState,
  reorderTags,
  resetTags,
  saveAsset,
  selectAllTags,
  selectOrderedTagsWithStatus,
} from '../../store/assets';
import {
  selectFilterTags,
  toggleExtensionFilter,
  toggleSizeFilter,
  toggleTagFilter,
} from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
// import { flexWrapSortingStrategy } from '../../utils/flex-wrap-sorting-strategy';
import { composeDimensions } from '../../utils/helpers';
import { SortableTag } from '../tag/sortable-tag';
import { TagInput } from '../tag/tag-input';
import { AssetActions } from './components/asset-actions';

type AssetProps = {
  assetId: string;
  fileExtension: string;
  assetNumber: number;
  dimensions: ImageDimensions;
  dimensionsActive: boolean;
  extensionActive: boolean;
  ioState: IoState;
};

export const Asset = ({
  assetId,
  fileExtension,
  assetNumber,
  dimensions,
  dimensionsActive,
  extensionActive,
  ioState,
}: AssetProps) => {
  // Memoize the composed dimensions so it's not recreated on every render
  const dimensionsComposed = useMemo(
    () => composeDimensions(dimensions),
    [dimensions],
  );

  const [imageZoom, setImageZoom] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [editTagValue, setEditTagValue] = useState<string>('');
  const [editingTagName, setEditingTagName] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false); // Track if we're in edit mode
  const dispatch = useAppDispatch();
  const globalTagList = useAppSelector(selectAllTags);
  const filterTags = useAppSelector(selectFilterTags);

  // Memoize the selector to avoid unnecessary re-renders
  const orderedTagsWithStatus = useAppSelector((state) =>
    selectOrderedTagsWithStatus(state, assetId),
  );
  // Memoize the tag list and status object derived from orderedTagsWithStatus
  const tagList = useMemo(
    () =>
      orderedTagsWithStatus.map(
        (tag: { name: string; status: number }) => tag.name,
      ),
    [orderedTagsWithStatus],
  );

  // Keep the tagsByStatus object for compatibility with the rest of the code
  const tagsByStatus = useMemo(
    () =>
      orderedTagsWithStatus.reduce(
        (
          acc: Record<string, number>,
          tag: { name: string; status: number },
        ) => {
          acc[tag.name] = tag.status;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [orderedTagsWithStatus],
  );

  // Create a Set from filterTags for efficient lookups
  const filterTagsSet = useMemo(() => new Set(filterTags), [filterTags]);

  // Local state for drag handling - synced with Redux but used for rendering during drag operations
  const [localTagList, setLocalTagList] = useState<string[]>(tagList);

  // Keep local list in sync with Redux
  useEffect(() => {
    if (JSON.stringify(localTagList) !== JSON.stringify(tagList)) {
      setLocalTagList(tagList);
    }
  }, [tagList, localTagList, assetId]);

  // Memoize this calculation to prevent unnecessary re-renders
  const showActions = useMemo(
    () =>
      tagList.length &&
      tagList.some((tagName: string) => tagsByStatus[tagName] !== 0) && // TagState.SAVED is 0
      ioState !== IoState.SAVING,
    [tagList, tagsByStatus, ioState],
  );

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px minimum drag distance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Convert event handlers to useCallback to prevent new function creation on each render
  const toggleImageZoom = useCallback(() => {
    setImageZoom((prev) => !prev);
  }, []);

  const addNewTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.stopPropagation();

      if (tagName.trim() !== '') {
        if (!tagList.includes(tagName)) {
          dispatch(addTag({ assetId, tagName }));
          setNewTagInput('');
        } else {
          console.log("Couldn't add tag, it's already is in the list", tagName);
        }
      } else {
        console.log("Couldn't add tag, it was empty.");
      }
    },
    [dispatch, tagList, assetId],
  );

  const toggleTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.preventDefault();
      dispatch(toggleTagFilter(tagName));
    },
    [dispatch],
  );

  const toggleDeleteTag = useCallback(
    (e: SyntheticEvent, tagName: string) => {
      e.stopPropagation();
      dispatch(deleteTag({ assetId, tagName }));
    },
    [dispatch, assetId],
  );

  const saveAction = useCallback(() => {
    dispatch(saveAsset(assetId));
  }, [dispatch, assetId]);

  const cancelAction = useCallback(() => {
    dispatch(resetTags(assetId));
  }, [dispatch, assetId]);

  const toggleSize = useCallback(
    (composedSize: string) => {
      dispatch(toggleSizeFilter(composedSize));
    },
    [dispatch],
  );

  const toggleExtension = useCallback(
    (extension: string) => {
      dispatch(toggleExtensionFilter(extension));
    },
    [dispatch],
  );

  const handleEditTag = useCallback(
    (oldTagName: string, newTagName: string) => {
      if (newTagName.trim() === '') return;
      if (oldTagName === newTagName) return;

      // Check if the new tag name already exists in the list
      if (tagList.includes(newTagName)) {
        console.log(
          "Couldn't edit tag, the new name already exists in the list",
          newTagName,
        );

        return;
      }

      // Clear the edit state variables
      setEditTagValue('');
      setEditingTagName('');

      // Dispatch the edit action
      dispatch(editTag({ assetId, oldTagName, newTagName }));
    },
    [dispatch, assetId, tagList, setEditTagValue, setEditingTagName],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTagInput(e.currentTarget.value.trimStart());
    },
    [],
  );

  const handleCancelAdd = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
    // Clear the input field and optionally blur the input to remove focus
    setNewTagInput('');
    // Blur the input if we have access to it
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = localTagList.indexOf(String(active.id));
        const newIndex = localTagList.indexOf(String(over.id));

        // Only proceed if both indexes are valid and different
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          // Use arrayMove utility from dnd-kit for consistency
          const newList = arrayMove(localTagList, oldIndex, newIndex);

          // Log what's happening
          console.log(`Starting tag reorder in asset ${assetId}`);

          // Update local state immediately for a smooth UI experience
          setLocalTagList(newList);

          // Dispatch action to update Redux store
          dispatch(
            reorderTags({
              assetId,
              oldIndex,
              newIndex,
            }),
          );
        }
      }
    },
    [dispatch, localTagList, assetId],
  );

  // Track edit state changes and handle start/end of edit mode
  const handleEditStateChange = useCallback(
    (tagName: string, editing: boolean) => {
      setIsEditing(editing);

      if (editing) {
        // Start of edit mode - set the tag being edited
        setEditingTagName(tagName);
      } else {
        // End of edit mode - clear both states
        setEditingTagName('');
        setEditTagValue('');
      }
    },
    [],
  );

  const handleEditValueChange = useCallback(
    (tagName: string, value: string) => {
      // Only update the tag being edited if we're not already tracking it
      if (tagName && editingTagName === '') {
        setEditingTagName(tagName);
      }

      // Always update the edit value
      setEditTagValue(value);
    },
    [editingTagName],
  );

  // Check if the current edit value is a duplicate of another tag
  const isEditingDuplicate = useMemo(() => {
    if (editTagValue && editingTagName) {
      // Check if any tag except the one being edited matches the current edit value
      return tagList.some(
        (tag) =>
          tag !== editingTagName &&
          tag.toLowerCase() === editTagValue.toLowerCase().trim(),
      );
    }
    return false;
  }, [editTagValue, editingTagName, tagList]);

  return (
    <div className="mb-4 flex w-full flex-wrap overflow-hidden rounded-b-lg border border-slate-300">
      <span className="pointer-events-none absolute mt-1 ml-1 rounded-full bg-white/80 px-2 text-sm font-medium text-slate-500 tabular-nums opacity-60 shadow-xs text-shadow-sm text-shadow-white">
        {assetNumber}
      </span>
      <div
        className={`flex w-full items-center justify-center ${!imageZoom ? 'md:w-1/4' : 'md:w-3/4'} cursor-pointer self-stretch bg-slate-300 transition-all`}
        onClick={toggleImageZoom}
      >
        <div className="flex border-r border-r-slate-300 bg-slate-300">
          <Image
            className={`${!imageZoom && 'max-h-64'} h-auto w-auto object-contain`}
            src={`/assets/${assetId}.${fileExtension}`}
            width={dimensions.width}
            height={dimensions.height}
            alt=""
          />
        </div>
      </div>

      <div className={`${imageZoom ? 'md:w-1/4' : 'md:w-3/4'} p-4`}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="relative flex flex-wrap">
            <SortableContext
              items={localTagList}
              strategy={rectSortingStrategy}
              id={`taglist-${assetId}`}
            >
              {localTagList.map((tagName: string, index: number) => (
                <SortableTag
                  key={`${assetId}-${tagName}-${index}`}
                  id={tagName}
                  fade={
                    // For add mode: fade tags except one matching current input
                    (newTagInput !== '' && newTagInput !== tagName) ||
                    // For edit mode: fade tags except the one being edited or one that matches current edit value
                    (isEditing &&
                      tagName !== editingTagName &&
                      tagName !== editTagValue)
                  }
                  nonInteractive={
                    // Always make tags non-interactive when in edit mode, except for the tag being edited
                    (isEditing && tagName !== editingTagName) ||
                    // Always make tags non-interactive in add mode
                    newTagInput !== ''
                  }
                  tagName={tagName}
                  tagState={tagsByStatus[tagName]}
                  count={globalTagList[tagName] || 0}
                  onToggleTag={toggleTag}
                  onDeleteTag={toggleDeleteTag}
                  onEditTag={handleEditTag}
                  highlight={filterTagsSet.has(tagName)}
                  onEditValueChange={handleEditValueChange}
                  onEditStateChange={handleEditStateChange}
                  isDuplicate={editingTagName === tagName && isEditingDuplicate}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>

        <div
          className={`transition-all ${isEditing || editTagValue !== '' ? 'pointer-events-none opacity-25' : ''}`}
        >
          <TagInput
            inputValue={newTagInput}
            onInputChange={handleInputChange}
            onSubmit={(e: SyntheticEvent) => addNewTag(e, newTagInput)}
            onCancel={handleCancelAdd}
            mode="add"
            placeholder="Add tag..."
            nonInteractive={isEditing}
          />
        </div>
      </div>

      <div className="flex w-full items-center border-t border-t-slate-300 bg-slate-100 px-2 py-1 text-sm">
        <span className="inline-flex min-w-0 flex-wrap items-center py-0.5 tabular-nums">
          <button
            type="button"
            className={`mr-2 cursor-pointer rounded-sm border border-sky-300 max-sm:order-2 ${dimensionsActive ? 'bg-sky-300 hover:bg-sky-400' : 'bg-sky-100 hover:bg-sky-200'} px-2 py-0.5`}
            onClick={() => toggleSize(dimensionsComposed)}
          >
            {dimensions.width}&times;{dimensions.height}
          </button>

          <button
            type="button"
            className={`mr-2 cursor-pointer rounded-sm border border-stone-300 max-sm:order-2 ${extensionActive ? 'bg-stone-300 hover:bg-stone-400' : 'bg-stone-100 hover:bg-stone-200'} px-2 py-0.5`}
            onClick={() => toggleExtension(fileExtension)}
          >
            {fileExtension}
          </button>

          <span
            className="cursor-default overflow-hidden overflow-ellipsis text-slate-500 max-sm:order-1 max-sm:w-full max-sm:pb-2"
            style={{ textShadow: 'white 0 1px 0' }}
          >
            {assetId}
          </span>
        </span>
        {showActions ? (
          <AssetActions
            onSave={saveAction}
            onCancel={cancelAction}
            ioState={ioState}
          />
        ) : null}
      </div>
    </div>
  );
};
