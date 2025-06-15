import { hasState, TagState } from '@/app/store/assets';

interface TagStyles {
  tagClass: string;
  tagTextClass: string;
  countClass: string;
}

/**
 * Generates styles for Tag components based on their state and appearance properties
 *
 * @param tagState - The current state of the tag (SAVED, TO_DELETE, TO_ADD, DIRTY)
 * @param highlight - Whether the tag should be highlighted
 * @param fade - Whether the tag should appear faded
 * @param isDraggable - Whether the tag is draggable
 * @returns Object with CSS class strings for different parts of the tag
 */
export function getTagStyles(
  tagState: number,
  highlight: boolean,
  fade: boolean,
  isDraggable: boolean = false,
): TagStyles {
  // Common base classes
  const baseTagClass =
    'mr-2 mb-2 inline-flex cursor-pointer items-center rounded-full border py-1 pr-2 pl-4 transition-all';
  const baseCountClass =
    'relative -ml-2 mr-1 inline-flex tabular-nums px-1 text-xs';

  // State-specific classes
  let tagStateClasses = '';
  let tagCountClasses = '';

  // Apply appropriate classes based on tag state
  if (tagState === TagState.SAVED) {
    // SAVED state (0)
    tagStateClasses = highlight
      ? 'border-teal-500 bg-emerald-300 shadow-sm shadow-emerald-500/50 hover:bg-emerald-100'
      : 'border-teal-500 hover:bg-teal-100';
    tagCountClasses = 'text-emerald-500';
  } else {
    // For combined states, prioritize certain visual styles
    if (hasState(tagState, TagState.TO_DELETE)) {
      // TO_DELETE is most important visual indicator
      tagStateClasses = highlight
        ? 'border-pink-500 bg-pink-300 shadow-sm shadow-pink-500/50 hover:bg-pink-100'
        : 'border-pink-500 hover:bg-pink-100';
      tagCountClasses = 'text-pink-500';
    } else if (hasState(tagState, TagState.TO_ADD)) {
      // TO_ADD is second priority
      tagStateClasses = highlight
        ? 'border-amber-500 bg-amber-300 shadow-sm shadow-amber-500/50 hover:bg-amber-100'
        : 'border-amber-500 hover:bg-amber-100';
      tagCountClasses = 'text-amber-500';
    } else if (hasState(tagState, TagState.DIRTY)) {
      // DIRTY is lowest priority
      tagStateClasses = highlight
        ? 'border-indigo-500 bg-indigo-300 shadow-sm shadow-indigo-500/50 hover:bg-indigo-100'
        : 'border-indigo-500 hover:bg-indigo-100';
      tagCountClasses = 'text-indigo-500';
    }
  }

  return {
    tagClass: `${baseTagClass} ${tagStateClasses} ${fade ? 'opacity-25' : ''} ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`,
    tagTextClass: hasState(tagState, TagState.TO_DELETE) ? 'line-through' : '',
    countClass: `${baseCountClass} ${tagCountClasses}`,
  };
}

// Additional styled elements for the tag component
export const tagButtonStyles = {
  editButton:
    'ml-1 inline-flex w-5 rounded-full p-0.5 text-slate-400 hover:bg-blue-500 hover:text-white',
  deleteButton:
    'ml-1 inline-flex w-5 rounded-full p-0.5 hover:bg-pink-500 hover:text-white',
  saveButton:
    'ml-1 inline-flex w-5 cursor-pointer rounded-full p-0.5 text-green-600 hover:bg-green-500 hover:text-white',
  cancelButton:
    'ml-1 inline-flex w-5 cursor-pointer rounded-full p-0.5 text-gray-600 hover:bg-gray-500 hover:text-white',
  inputField:
    'min-w-24 rounded-md bg-white px-2 py-0.5 text-sm outline-none focus:ring-0',
};
