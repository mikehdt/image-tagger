import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';

import type { TagState } from '@/app/store/slice-assets';

import { deleteTag } from '../store/slice-assets';
import { toggleTagFilter } from '../store/slice-filters';

type TagProps = {
  tagName: string;
  tagState: TagState;
  count: number;
  highlight: boolean;
  fade: boolean;
  onToggleTag: (e: SyntheticEvent) => void;
  onDeleteTag: (e: SyntheticEvent) => void;
};

export const Tag = ({
  tagName,
  tagState,
  count,
  highlight,
  fade,
  onToggleTag,
  onDeleteTag,
}: TagProps) => {
  const toggleTag = (e: SyntheticEvent, tagName: string) => {
    e.preventDefault();
    dispatch(toggleTagFilter(tagName));
  };

  const toggleDeleteTag = (e: SyntheticEvent, tagName: string) => {
    e.stopPropagation();
    dispatch(deleteTag({ assetId, tagName }));
  };

  let tagColor = '',
    tagHighlightColor = '',
    tagCountColor = '';

  if (tagState === 'ToAdd') {
    tagColor = 'border-amber-500';
    tagHighlightColor = highlight
      ? 'bg-amber-300 shadow-sm shadow-amber-500/50 hover:bg-amber-100'
      : 'hover:bg-amber-100';
    tagCountColor = 'border-amber-300';
  } else if (tagState === 'ToDelete') {
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

  return (
    <div
      className={`mr-2 mb-2 inline-flex cursor-pointer items-center rounded-full border py-1 pr-2 pl-4 transition-all ${tagColor} ${tagHighlightColor} ${fade ? 'opacity-25' : ''}`}
      onClick={onToggleTag}
    >
      <span className={tagState === 'ToDelete' ? 'line-through' : ''}>
        {tagName}
      </span>
      <span
        className={`ml-2 inline-flex rounded-full border bg-white px-2 py-0.5 text-xs ${tagCountColor}`}
      >
        {count}
      </span>
      <span
        className="ml-1 inline-flex w-5 rounded-full p-0.5 hover:bg-pink-500 hover:text-white"
        onClick={onDeleteTag}
      >
        <XMarkIcon />
      </span>
    </div>
  );
};
