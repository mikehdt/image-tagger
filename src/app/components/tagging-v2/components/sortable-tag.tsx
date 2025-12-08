/**
 * SortableTag Component v2
 *
 * Thin wrapper that adds dnd-kit sortability to a Tag
 * - Uses useSortable for drag/drop capability
 * - Renders Tag component with drag styles applied
 * - No memoization (parent TagsDisplay handles that)
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { track } from '@/app/utils/render-tracker';

import { Tag } from './tag';

type SortableTagProps = {
  id: string;
  tagName: string;
  tagState: number;
  count: number;
  isHighlighted: boolean;
  fade: boolean;
  onToggle: (tagName: string) => void;
  onDelete: (tagName: string) => void;
};

export const SortableTag = ({
  id,
  tagName,
  tagState,
  count,
  isHighlighted,
  fade,
  onToggle,
  onDelete,
}: SortableTagProps) => {
  track('SortableTag', 'render');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
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
      {...attributes}
      {...listeners}
      className="mr-2 mb-2 cursor-grab active:cursor-grabbing"
    >
      <Tag
        tagName={tagName}
        tagState={tagState}
        count={count}
        isHighlighted={isHighlighted}
        fade={fade}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    </div>
  );
};
