import { XMarkIcon } from '@heroicons/react/24/outline';
import { memo, type SyntheticEvent, useMemo } from 'react';

import { hasState, TagState } from '@/app/store/assets';

type TagProps = {
  tagName: string;
  tagState: number; // Changed to number to support bitwise flags
  count: number;
  highlight: boolean;
  fade: boolean;
  isDraggable?: boolean;
  onToggleTag: (e: SyntheticEvent, tagName: string) => void;
  onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
};

const Tag = ({
  tagName,
  tagState,
  count,
  highlight,
  fade,
  isDraggable = false,
  onToggleTag,
  onDeleteTag,
}: TagProps) => {
  // Memoize style calculations to prevent recalculating on every render
  const styles = useMemo(() => {
    // Common base classes
    const baseTagClass =
      'mr-2 mb-2 inline-flex cursor-pointer items-center rounded-full border py-1 pr-2 pl-4 transition-all';
    const baseCountClass =
      'ml-2 inline-flex rounded-full border bg-white px-2 py-0.5 text-xs';

    // State-specific classes
    let tagStateClasses = '';
    let tagCountClasses = '';

    // Apply appropriate classes based on tag state
    if (tagState === TagState.SAVED) {
      // SAVED state (0)
      tagStateClasses = highlight
        ? 'border-teal-500 bg-emerald-300 shadow-sm shadow-emerald-500/50 hover:bg-emerald-100'
        : 'border-teal-500 hover:bg-teal-100';
      tagCountClasses = 'border-emerald-300';
    } else {
      // For combined states, prioritize certain visual styles
      if (hasState(tagState, TagState.TO_DELETE)) {
        // TO_DELETE is most important visual indicator
        tagStateClasses = highlight
          ? 'border-pink-500 bg-pink-300 shadow-sm shadow-pink-500/50 hover:bg-pink-100'
          : 'border-pink-500 hover:bg-pink-100';
        tagCountClasses = 'border-pink-300';
      } else if (hasState(tagState, TagState.TO_ADD)) {
        // TO_ADD is second priority
        tagStateClasses = highlight
          ? 'border-amber-500 bg-amber-300 shadow-sm shadow-amber-500/50 hover:bg-amber-100'
          : 'border-amber-500 hover:bg-amber-100';
        tagCountClasses = 'border-amber-300';
      } else if (hasState(tagState, TagState.DIRTY)) {
        // DIRTY is lowest priority
        tagStateClasses = highlight
          ? 'border-indigo-500 bg-indigo-300 shadow-sm shadow-indigo-500/50 hover:bg-indigo-100'
          : 'border-indigo-500 hover:bg-indigo-100';
        tagCountClasses = 'border-indigo-300';
      }
    }

    return {
      tagClass: `${baseTagClass} ${tagStateClasses} ${fade ? 'opacity-25' : ''} ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`,
      tagTextClass: hasState(tagState, TagState.TO_DELETE)
        ? 'line-through'
        : '',
      countClass: `${baseCountClass} ${tagCountClasses}`,
    };
  }, [tagState, highlight, fade, isDraggable]);

  const handleToggleTag = (e: SyntheticEvent) => {
    onToggleTag(e, tagName);
  };

  const handleDeleteTag = (e: SyntheticEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    onDeleteTag(e, tagName);
  };

  return (
    <div className={styles.tagClass} onClick={handleToggleTag}>
      <span className={styles.tagTextClass}>{tagName}</span>
      <span className={styles.countClass}>{count}</span>
      <span
        className="ml-1 inline-flex w-5 rounded-full p-0.5 hover:bg-pink-500 hover:text-white"
        onClick={handleDeleteTag}
      >
        <XMarkIcon />
      </span>
    </div>
  );
};

// Use an equality function that compares props deeply
const areEqual = (prevProps: TagProps, nextProps: TagProps) => {
  return (
    prevProps.tagName === nextProps.tagName &&
    prevProps.tagState === nextProps.tagState &&
    prevProps.count === nextProps.count &&
    prevProps.highlight === nextProps.highlight &&
    prevProps.fade === nextProps.fade &&
    prevProps.isDraggable === nextProps.isDraggable
    // Functions references should be stable from parent with useCallback
  );
};

const MemoizedTag = memo(Tag, areEqual);

export { MemoizedTag as Tag };
