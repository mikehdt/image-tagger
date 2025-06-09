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
  rectSwappingStrategy,
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

import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addTag,
  deleteTag,
  ImageDimensions,
  IoState,
  reorderTags,
  resetTags,
  saveAssets,
  selectAllTags,
  selectOrderedTagsWithStatus,
} from '../store/slice-assets';
import {
  selectFilterTags,
  toggleSizeFilter,
  toggleTagFilter,
} from '../store/slice-filters';
import { composeDimensions } from '../utils/helpers';
import { AssetActions } from './asset-actions';
import { NewInput } from './new-input';
import { SortableTag } from './sortable-tag';

type AssetProps = {
  assetId: string;
  fileExtension: string;
  dimensions: ImageDimensions;
  dimensionsActive: boolean;
  ioState: IoState;
};

export const Asset = ({
  assetId,
  fileExtension,
  dimensions,
  dimensionsActive,
  ioState,
}: AssetProps) => {
  // Memoize the composed dimensions so it's not recreated on every render
  const dimensionsComposed = useMemo(
    () => composeDimensions(dimensions),
    [dimensions],
  );

  const [imageZoom, setImageZoom] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');
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
    dispatch(saveAssets(assetId));
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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTagInput(e.currentTarget.value.trimStart());
    },
    [],
  );

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

  return (
    <div className="mb-4 flex w-full flex-wrap overflow-hidden rounded-b-lg border border-slate-300">
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
          <div className="flex flex-wrap">
            <SortableContext
              items={localTagList}
              strategy={rectSwappingStrategy}
              id={`taglist-${assetId}`}
            >
              {localTagList.map((tagName: string, index: number) => (
                <SortableTag
                  key={`${assetId}-${tagName}-${index}`}
                  id={tagName}
                  fade={newTagInput !== '' && newTagInput !== tagName}
                  tagName={tagName}
                  tagState={tagsByStatus[tagName]}
                  count={globalTagList[tagName] || 0}
                  onToggleTag={toggleTag}
                  onDeleteTag={toggleDeleteTag}
                  highlight={filterTagsSet.has(tagName)}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>

        <NewInput
          inputValue={newTagInput}
          onInputChange={handleInputChange}
          onAdd={(e) => addNewTag(e, newTagInput)}
        />
      </div>

      <div className="flex w-full items-center border-t border-t-slate-300 bg-slate-100 px-2 py-1 text-sm">
        <span className="inline-flex h-8 min-w-0 items-center tabular-nums">
          <button
            type="button"
            className={`mr-2 cursor-pointer rounded-sm border border-sky-300 ${dimensionsActive ? 'bg-sky-300 hover:bg-sky-400' : 'bg-sky-100 hover:bg-sky-200'} px-2 py-0.5`}
            onClick={() => toggleSize(dimensionsComposed)}
          >
            {dimensions.width}&times;{dimensions.height}
          </button>

          <span className="mr-2 cursor-default rounded-sm border border-stone-300 bg-stone-100 px-2 py-0.5 max-sm:hidden">
            {fileExtension}
          </span>

          <span
            className="cursor-default overflow-hidden overflow-ellipsis text-slate-500 max-sm:hidden"
            style={{ textShadow: 'white 0 1px 0' }}
          >
            {assetId}
          </span>
        </span>
        {showActions ? (
          <AssetActions onSave={saveAction} onCancel={cancelAction} />
        ) : null}
      </div>
    </div>
  );
};
