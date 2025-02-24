import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';

import { ImageTag } from '@/app/store/slice-assets';

type TagProps = {
  tag: ImageTag;
  count: number;
  highlight: boolean;
  onToggleTag: (e: SyntheticEvent) => void;
  onDeleteTag: (e: SyntheticEvent) => void;
};

export const Tag = ({
  tag,
  count,
  highlight,
  onToggleTag,
  onDeleteTag,
}: TagProps) => {
  let tagColor = '',
    tagHighlightColor = '',
    tagCountColor = '';

  if (tag.state === 'ToAdd') {
    tagColor = 'border-amber-500';
    tagHighlightColor = highlight
      ? 'bg-amber-300 hover:bg-amber-100'
      : 'hover:bg-amber-100';
    tagCountColor = 'border-amber-300';
  } else if (tag.state === 'ToDelete') {
    tagColor = 'border-pink-500';
    tagHighlightColor = highlight
      ? 'bg-pink-300 hover:bg-pink-100'
      : 'hover:bg-pink-100';
    tagCountColor = 'border-pink-300';
  } else {
    tagColor = 'border-teal-500';
    tagHighlightColor = highlight
      ? 'bg-emerald-300 hover:bg-emerald-100'
      : 'hover:bg-teal-100';
    tagCountColor = 'border-emerald-300';
  }

  return (
    <>
      <span
        className={`mr-2 mb-2 inline-flex cursor-pointer items-center rounded-full border py-1 pr-2 pl-4 ${tagColor} ${tagHighlightColor}`}
        onClick={onToggleTag}
      >
        <span className={tag.state === 'ToDelete' ? 'line-through' : ''}>
          {tag.name}
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
      </span>
    </>
  );
};
