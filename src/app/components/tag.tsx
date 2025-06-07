import { XMarkIcon } from '@heroicons/react/24/outline';
import { memo, type SyntheticEvent, useMemo } from 'react';

import { TagState } from '@/app/store/slice-assets';

type TagProps = {
  tagName: string;
  tagState: TagState;
  count: number;
  highlight: boolean;
  fade: boolean;
  onToggleTag: (e: SyntheticEvent, tagName: string) => void;
  onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
};

const Tag = ({
  tagName,
  tagState,
  count,
  highlight,
  fade,
  onToggleTag,
  onDeleteTag,
}: TagProps) => {
  // Memoize style calculations to prevent recalculating on every render
  const styles = useMemo(() => {
    let tagColor = '';
    let tagHighlightColor = '';
    let tagCountColor = '';

    if (tagState === TagState.TO_ADD) {
      tagColor = 'border-amber-500';
      tagHighlightColor = highlight
        ? 'bg-amber-300 shadow-sm shadow-amber-500/50 hover:bg-amber-100'
        : 'hover:bg-amber-100';
      tagCountColor = 'border-amber-300';
    } else if (tagState === TagState.TO_DELETE) {
      tagColor = 'border-pink-500';
      tagHighlightColor = highlight
        ? 'bg-pink-300 shadow-sm shadow-pink-500/50 hover:bg-pink-100'
        : 'hover:bg-pink-100';
      tagCountColor = 'border-pink-300';
    } else {
      tagColor = 'border-teal-500';
      tagHighlightColor = highlight
        ? 'bg-emerald-300 shadow-sm shadow-emerald-500/50 hover:bg-emerald-100'
        : 'hover:bg-teal-100';
      tagCountColor = 'border-emerald-300';
    }

    return {
      tagClass: `mr-2 mb-2 inline-flex cursor-pointer items-center rounded-full border py-1 pr-2 pl-4 transition-all ${tagColor} ${tagHighlightColor} ${fade ? 'opacity-25' : ''}`,
      tagTextClass: tagState === TagState.TO_DELETE ? 'line-through' : '',
      countClass: `ml-2 inline-flex rounded-full border bg-white px-2 py-0.5 text-xs ${tagCountColor}`,
    };
  }, [tagState, highlight, fade]);

  const handleToggleTag = (e: SyntheticEvent) => {
    onToggleTag(e, tagName);
  };

  const handleDeleteTag = (e: SyntheticEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    onDeleteTag(e, tagName);
  };

  return (
    <div
      className={styles.tagClass}
      onClick={handleToggleTag}
    >
      <span className={styles.tagTextClass}>
        {tagName}
      </span>
      <span
        className={styles.countClass}
      >
        {count}
      </span>
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
    // Functions references should be stable from parent with useCallback
    prevProps.onToggleTag === nextProps.onToggleTag &&
    prevProps.onDeleteTag === nextProps.onDeleteTag
  );
};

// Use memo with the custom comparison function
const CachedTag = memo(Tag, areEqual);

export { CachedTag as Tag };
