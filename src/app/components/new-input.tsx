import { PlusIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { memo, useCallback, KeyboardEvent } from 'react';

type NewInputProps = {
  inputValue: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAdd: (e: SyntheticEvent) => void;
  tone?: 'primary' | 'secondary';
};

const NewInputComponent = ({
  inputValue,
  onInputChange,
  onAdd,
  tone,
}: NewInputProps) => {
  // Allow adding via Enter key
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      onAdd(e);
    }
  }, [inputValue, onAdd]);

  return (
    <div className="relative inline-flex">
      <input
        value={inputValue}
        onChange={onInputChange}
        onKeyUp={handleKeyPress}
        type="text"
        placeholder="Add tag..."
        className={`w-36 rounded-full border ${tone !== 'secondary' ? 'border-green-300' : 'border-slate-300'} py-1 ps-4 pe-8`}
      />
      <span
        className={`absolute top-0 right-2 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 cursor-pointer rounded-full p-0.5 ${
          inputValue.trim() !== ''
            ? 'text-green-600 hover:bg-green-500 hover:text-white'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        onClick={inputValue.trim() !== '' ? onAdd : undefined}
      >
        <PlusIcon />
      </span>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const NewInput = memo(NewInputComponent);
