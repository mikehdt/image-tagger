import {
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useEffect, useState } from 'react';

import { reorderTags } from '../../../store/assets';
import { useAppDispatch } from '../../../store/hooks';

export const useDragDrop = (assetId: string, tagList: string[]) => {
  // Local state for drag handling - synced with Redux but used for rendering during drag operations
  const [localTagList, setLocalTagList] = useState<string[]>(tagList);
  const dispatch = useAppDispatch();

  // Keep local list in sync with Redux
  useEffect(() => {
    if (JSON.stringify(localTagList) !== JSON.stringify(tagList)) {
      setLocalTagList(tagList);
    }
  }, [tagList, localTagList, assetId]);

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

  return {
    localTagList,
    sensors,
    handleDragEnd,
  };
};
