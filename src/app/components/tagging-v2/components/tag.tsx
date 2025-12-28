/**
 * Tag Component v2
 *
 * Phase 4: Full interactivity with edit button
 * - Click to toggle tag state (filter)
 * - Edit button (pencil icon) to start editing
 * - Delete button (minus/plus icon based on state)
 * - Visual states (saved, to_delete, to_add, dirty)
 * - Highlight and fade support
 * - When faded, all interactions are disabled
 */
import { MinusIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { SyntheticEvent, useCallback } from 'react';

import { hasState, TagState } from '@/app/store/assets';

type TagProps = {
  tagName: string;
  tagState: number;
  count: number;
  isHighlighted: boolean;
  fade: boolean;
  isMatchingDuplicate?: boolean;
  onToggle: (tagName: string) => void;
  onEdit: (tagName: string) => void;
  onDelete: (tagName: string) => void;
};

export const Tag = ({
  tagName,
  tagState,
  count,
  isHighlighted,
  fade,
  isMatchingDuplicate = false,
  onToggle,
  onEdit,
  onDelete,
}: TagProps) => {
  // Non-interactive when faded OR when shown as matching duplicate
  const isNonInteractive = fade || isMatchingDuplicate;

  const handleClick = useCallback(() => {
    if (!isNonInteractive) {
      onToggle(tagName);
    }
  }, [onToggle, tagName, isNonInteractive]);

  const handleEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      // Don't allow editing if non-interactive or marked for deletion
      if (!isNonInteractive && !hasState(tagState, TagState.TO_DELETE)) {
        onEdit(tagName);
      }
    },
    [onEdit, tagName, tagState, isNonInteractive],
  );

  const handleDelete = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      if (!isNonInteractive) {
        onDelete(tagName);
      }
    },
    [onDelete, tagName, isNonInteractive],
  );

  const isMarkedForDeletion = hasState(tagState, TagState.TO_DELETE);

  // Determine visual styling based on state
  const getStateStyles = () => {
    if (isMarkedForDeletion) {
      return isHighlighted
        ? 'border-pink-500 bg-pink-300 shadow-sm shadow-pink-500/50 hover:bg-pink-100'
        : 'border-pink-500 hover:bg-pink-100';
    }
    if (hasState(tagState, TagState.TO_ADD)) {
      return isHighlighted
        ? 'border-amber-500 bg-amber-300 shadow-sm shadow-amber-500/50 hover:bg-amber-100'
        : 'border-amber-500 hover:bg-amber-100';
    }
    if (hasState(tagState, TagState.DIRTY)) {
      return isHighlighted
        ? 'border-indigo-500 bg-indigo-300 shadow-sm shadow-indigo-500/50 hover:bg-indigo-100'
        : 'border-indigo-500 hover:bg-indigo-100';
    }
    // SAVED (default)
    return isHighlighted
      ? 'border-teal-500 bg-emerald-300 shadow-sm shadow-emerald-500/50 hover:bg-emerald-100'
      : 'border-teal-500 hover:bg-teal-100';
  };

  const getCountColour = () => {
    if (isMarkedForDeletion) return 'text-pink-500';
    if (hasState(tagState, TagState.TO_ADD)) return 'text-amber-500';
    if (hasState(tagState, TagState.DIRTY)) return 'text-indigo-500';
    return 'text-emerald-500';
  };

  // Matching duplicate: visible but non-interactive (pointer-events-none, no opacity change)
  // Faded: non-interactive AND faded (pointer-events-none, opacity-25)
  const getInteractionStyles = () => {
    if (fade) return 'pointer-events-none opacity-25';
    if (isMatchingDuplicate) return 'pointer-events-none';
    return 'cursor-pointer';
  };

  return (
    <div
      className={`inline-flex items-center rounded-2xl border py-1 pr-2 pl-4 transition-all ${getStateStyles()} ${getInteractionStyles()}`}
      onClick={handleClick}
    >
      <span
        className={`relative mr-1 -ml-2 inline-flex px-1 text-xs tabular-nums text-shadow-xs/100 text-shadow-white ${getCountColour()}`}
      >
        {count}
      </span>
      <span className={isMarkedForDeletion ? 'line-through' : ''}>
        {tagName}
      </span>

      {/* Edit button */}
      <span
        className={`ml-1 inline-flex w-5 rounded-full p-0.5 transition-colors ${
          isMarkedForDeletion || isNonInteractive
            ? 'cursor-not-allowed opacity-20'
            : 'text-slate-500 hover:bg-blue-500 hover:text-white'
        }`}
        onClick={handleEdit}
        title={
          isMarkedForDeletion
            ? "Can't edit a tag marked for deletion"
            : 'Edit tag'
        }
        tabIndex={isMarkedForDeletion || isNonInteractive ? -1 : 0}
      >
        <PencilIcon />
      </span>

      {/* Delete button */}
      <span
        className={`ml-1 inline-flex w-5 rounded-full p-0.5 transition-colors ${
          isNonInteractive
            ? 'opacity-20'
            : `hover:bg-pink-500 hover:text-white ${isMarkedForDeletion ? 'text-pink-500' : ''}`
        }`}
        onClick={handleDelete}
        title={
          isMarkedForDeletion
            ? 'Unmark tag for deletion'
            : 'Mark tag for deletion'
        }
        tabIndex={isNonInteractive ? -1 : 0}
      >
        {isMarkedForDeletion ? <PlusIcon /> : <MinusIcon />}
      </span>
    </div>
  );
};
