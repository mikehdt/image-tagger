import {
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback } from 'react';

/**
 * Sortable hook that doesn't maintain local state
 * This reduces unnecessary re-renders by letting dnd-kit handle the optimistic updates
 */
export const useSortable = <T extends UniqueIdentifier>(
  items: T[],
  onItemsReordered: (oldIndex: number, newIndex: number) => void,
) => {
  // Set up sensors for drag and drop - these are stable across renders
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

  // Memoized drag end handler to avoid recreation on every render
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.indexOf(active.id as T);
        const newIndex = items.indexOf(over.id as T);

        // Only proceed if both indexes are valid and different
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          // Call the callback to handle the reordering
          // No need to maintain local state - let the parent handle it
          onItemsReordered(oldIndex, newIndex);
        }
      }
    },
    [items, onItemsReordered],
  );

  // Return stable values
  return {
    sensors,
    handleDragEnd,
  };
};
