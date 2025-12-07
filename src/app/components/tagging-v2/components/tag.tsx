/**
 * Tag Component v2 - Static display only
 *
 * Phase 1: Pure display, no interactivity
 * - Renders tag name with count
 * - Supports visual states (saved, to_delete, to_add, dirty)
 * - Supports highlight and fade
 * - No click handlers, no buttons
 */
import { memo } from 'react';

import { hasState, TagState } from '@/app/store/assets';
import { track } from '@/app/utils/render-tracker';

type TagProps = {
  tagName: string;
  tagState: number;
  count: number;
  isHighlighted: boolean;
  fade: boolean;
};

const TagComponent = ({
  tagName,
  tagState,
  count,
  isHighlighted,
  fade,
}: TagProps) => {
  track('Tag', 'render');

  // Determine visual styling based on state
  const getStateStyles = () => {
    if (hasState(tagState, TagState.TO_DELETE)) {
      return isHighlighted
        ? 'border-pink-500 bg-pink-300 shadow-sm shadow-pink-500/50'
        : 'border-pink-500';
    }
    if (hasState(tagState, TagState.TO_ADD)) {
      return isHighlighted
        ? 'border-amber-500 bg-amber-300 shadow-sm shadow-amber-500/50'
        : 'border-amber-500';
    }
    if (hasState(tagState, TagState.DIRTY)) {
      return isHighlighted
        ? 'border-indigo-500 bg-indigo-300 shadow-sm shadow-indigo-500/50'
        : 'border-indigo-500';
    }
    // SAVED (default)
    return isHighlighted
      ? 'border-teal-500 bg-emerald-300 shadow-sm shadow-emerald-500/50'
      : 'border-teal-500';
  };

  const getCountColour = () => {
    if (hasState(tagState, TagState.TO_DELETE)) return 'text-pink-500';
    if (hasState(tagState, TagState.TO_ADD)) return 'text-amber-500';
    if (hasState(tagState, TagState.DIRTY)) return 'text-indigo-500';
    return 'text-emerald-500';
  };

  track('Tag', 'render-end');

  return (
    <div
      className={`inline-flex items-center rounded-2xl border py-1 pr-2 pl-4 transition-all ${getStateStyles()} ${fade ? 'opacity-25' : ''}`}
    >
      <span
        className={`relative -ml-2 mr-1 inline-flex px-1 text-xs tabular-nums text-shadow-xs/100 text-shadow-white ${getCountColour()}`}
      >
        {count}
      </span>
      <span className={hasState(tagState, TagState.TO_DELETE) ? 'line-through' : ''}>
        {tagName}
      </span>
    </div>
  );
};

// Custom memo comparison - only re-render if display-relevant props change
const tagPropsAreEqual = (prevProps: TagProps, nextProps: TagProps): boolean => {
  track('Tag', 'memo-check');

  const isEqual =
    prevProps.tagName === nextProps.tagName &&
    prevProps.tagState === nextProps.tagState &&
    prevProps.count === nextProps.count &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.fade === nextProps.fade;

  if (isEqual) track('Tag', 'memo-hit');
  return isEqual;
};

export const Tag = memo(TagComponent, tagPropsAreEqual);
