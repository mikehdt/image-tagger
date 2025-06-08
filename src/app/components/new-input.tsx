import { PlusIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { memo, useCallback, KeyboardEvent, useMemo, useRef, useEffect } from 'react';

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
  // Reference to the input element to maintain focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Allow adding via Enter key
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      onAdd(e);
    }
  }, [inputValue, onAdd]);

  // Calculate the width based on input length (between min and max width)
  const inputWidth = useMemo(() => {
    // Set minimum width for empty or short inputs
    const minWidth = 'w-36'; // Default width (9rem)
    // Maximum width for longer inputs (up to 20 characters)
    const maxWidth = 'w-64'; // 16rem

    const length = inputValue.length;

    if (length <= 10) {
      return minWidth;
    } else if (length >= 20) {
      return maxWidth;
    } else {
      // Dynamic width between min and max based on character count
      // Each character increment between 10-20 will increase width proportionally
      const widthStep = (length - 10) / 10; // 0 to 1 scale for 10-20 characters
      // Maps to tailwind w classes between w-36 and w-64
      const widthClasses = [
        'w-36', 'w-40', 'w-44', 'w-48', 'w-52', 'w-56', 'w-60', 'w-64'
      ];
      const index = Math.min(
        Math.floor(widthStep * (widthClasses.length - 1)),
        widthClasses.length - 1
      );
      return widthClasses[index];
    }
  }, [inputValue]);

  // Effect to maintain focus when the width changes
  useEffect(() => {
    // If input has value and should be focused but isn't, focus it
    if (document.activeElement !== inputRef.current && inputRef.current) {
      // Store cursor position
      const cursorPosition = inputRef.current.selectionStart;

      // Focus the input
      inputRef.current.focus();

      // Restore cursor position after a small delay to ensure it works after state updates
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = cursorPosition;
          inputRef.current.selectionEnd = cursorPosition;
        }
      }, 0);
    }
  }, [inputWidth]); // Re-run when width changes

  return (
    <div className="relative inline-flex mr-2">
      <input
        ref={inputRef}
        value={inputValue}
        onChange={onInputChange}
        onKeyUp={handleKeyPress}
        type="text"
        placeholder="Add tag..."
        className={`${inputWidth} rounded-full border ${tone !== 'secondary' ? 'border-green-300' : 'border-slate-300'} py-1 ps-4 pe-8 transition-all`}
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
