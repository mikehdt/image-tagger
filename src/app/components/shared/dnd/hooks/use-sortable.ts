import {
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useEffect, useState } from 'react';

/**
 * A generic hook for sortable items that can be used with any list of items
 *
 * This hook provides:
 * 1. Local state tracking for items during drag operations
 * 2. Sensor configuration for mouse, touch and keyboard interactions
 * 3. Drag end handling that reports index changes back to the caller
 *
 * @template T - The type of unique identifier for the sortable items
 * @param items - The array of items to be made sortable
 * @param onItemsReordered - Callback function called when items are reordered
 * @returns Sensors and handlers needed for drag and drop functionality
 */
export const useSortable = <T extends UniqueIdentifier>(
  items: T[],
  onItemsReordered: (oldIndex: number, newIndex: number) => void,
) => {
  // Local state for drag handling - used for rendering during drag operations
  const [localItems, setLocalItems] = useState<T[]>(items);

  // Keep local list in sync with provided items
  useEffect(() => {
    if (JSON.stringify(localItems) !== JSON.stringify(items)) {
      setLocalItems(items);
    }
  }, [items, localItems]);

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
        const oldIndex = localItems.indexOf(active.id as T);
        const newIndex = localItems.indexOf(over.id as T);

        // Only proceed if both indexes are valid and different
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          // Use arrayMove utility from dnd-kit for consistency
          const newList = arrayMove(localItems, oldIndex, newIndex);

          // Update local state immediately for a smooth UI experience
          setLocalItems(newList);

          // Call the callback to handle the reordering
          onItemsReordered(oldIndex, newIndex);
        }
      }
    },
    [localItems, onItemsReordered],
  );

  return {
    localItems,
    sensors,
    handleDragEnd,
  };
};
