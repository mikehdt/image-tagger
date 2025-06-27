import {
  closestCenter,
  DndContext,
  DragEndEvent,
  SensorDescriptor,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  rectSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ReactNode } from 'react';

type SortingStrategy = 'vertical' | 'horizontal' | 'rect';

type SortableProviderProps<T extends UniqueIdentifier> = {
  items: T[];
  onDragEnd: (event: DragEndEvent) => void;
  sensors: SensorDescriptor<object>[]; // Properly typed sensors array
  children: ReactNode;
  strategy?: SortingStrategy;
  id?: string;
};
/**
 * A shared provider for sortable items that encapsulates all drag and drop functionality
 *
 * This component combines DndContext and SortableContext from dnd-kit to provide
 * a reusable drag-and-drop container for any sortable items. It supports different
 * sorting strategies and collision detection algorithms.
 *
 * @template T - The type of unique identifier for the sortable items
 */
export const SortableProvider = <T extends UniqueIdentifier>({
  items,
  onDragEnd,
  sensors,
  children,
  strategy = 'rect',
  id = 'sortable-context',
}: SortableProviderProps<T>) => {
  const getStrategy = () => {
    switch (strategy) {
      case 'vertical':
        return verticalListSortingStrategy;
      case 'horizontal':
        return horizontalListSortingStrategy;
      case 'rect':
      default:
        return rectSortingStrategy;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={getStrategy()} id={id}>
        {children}
      </SortableContext>
    </DndContext>
  );
};
