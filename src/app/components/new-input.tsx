import { PlusIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent, SyntheticEvent } from 'react';

type NewInputProps = {
  inputValue: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAdd: (e: SyntheticEvent) => void;
  tone?: 'primary' | 'secondary';
};

export const NewInput = ({
  inputValue,
  onInputChange,
  onAdd,
  tone,
}: NewInputProps) => (
  <div className="relative inline-flex">
    <input
      value={inputValue}
      onChange={onInputChange}
      type="text"
      className={`w-36 rounded-full border ${tone !== 'secondary' ? 'border-green-300' : 'border-slate-300'} py-1 ps-4 pe-8`}
    />
    <span
      className="absolute top-0 right-2 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 cursor-pointer rounded-full p-0.5 hover:bg-green-500 hover:text-white"
      onClick={onAdd}
    >
      <PlusIcon />
    </span>
  </div>
);
