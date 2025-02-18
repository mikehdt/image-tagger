import { PlusIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent, SyntheticEvent } from 'react';

type NewTagInputProps = {
  inputValue: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddTag: (e: SyntheticEvent) => void;
};

export const NewTagInput = ({
  inputValue,
  onInputChange,
  onAddTag,
}: NewTagInputProps) => (
  <div className="relative inline-flex">
    <input
      value={inputValue}
      onChange={onInputChange}
      type="text"
      className="w-36 rounded-full border border-green-300 py-1 pe-8 ps-4"
    />
    <span
      className="absolute bottom-0 right-2 top-0 mb-auto ml-2 mt-auto h-5 w-5 cursor-pointer rounded-full p-0.5 hover:bg-green-500 hover:text-white"
      onClick={onAddTag}
    >
      <PlusIcon />
    </span>
  </div>
);
