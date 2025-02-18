import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';

type TagProps = {
  tag: string;
  deleteTags: string[];
  isActive: boolean;
  isDeletable: boolean;
  onToggleDelete: (e: SyntheticEvent) => void;
  onClick: () => void;
  tagCount: number;
};

export const Tag = ({
  tag,
  isDeletable,
  isActive,
  onToggleDelete,
  onClick,
  tagCount,
}: TagProps) => (
  <span
    className={`mb-2 mr-2 inline-flex cursor-pointer items-center rounded-full border py-1 pl-4 pr-2 ${isDeletable ? 'border-pink-500' : 'border-teal-500'} ${
      isActive ? 'bg-emerald-300 hover:bg-emerald-100' : 'hover:bg-teal-100'
    }`}
    onClick={onClick}
  >
    <span className={isDeletable ? 'line-through' : ''}>{tag}</span>
    <span className="ml-2 inline-flex rounded-full border border-teal-300 bg-white px-2 py-0.5 text-xs">
      {tagCount}
    </span>
    <span
      className="ml-1 inline-flex w-5 rounded-full p-0.5 hover:bg-pink-500 hover:text-white"
      onClick={onToggleDelete}
    >
      <XMarkIcon />
    </span>
  </span>
);
