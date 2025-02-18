import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';

type NewTagProps = {
  tag: string;
  isActive: boolean;
  tagCount: number;
  onCancelNewTag: (e: SyntheticEvent) => void;
};

export const NewTag = ({
  tag,
  isActive,
  tagCount,
  onCancelNewTag,
}: NewTagProps) => (
  <span
    className={`mb-2 mr-2 inline-flex cursor-pointer items-center rounded-full border border-amber-500 py-1 pl-4 pr-2 ${isActive ? 'bg-amber-300' : ''}`}
  >
    {tag}
    <span className="ml-2 inline-flex rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs">
      {tagCount}
    </span>
    <span
      className="ml-1 inline-flex w-5 rounded-full p-0.5 hover:bg-pink-500 hover:text-white"
      onClick={onCancelNewTag}
    >
      <XMarkIcon />
    </span>
  </span>
);
