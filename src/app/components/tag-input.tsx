import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent, SyntheticEvent } from 'react';
import {
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

// Configuration constants
const MIN_TAG_LENGTH = 6;
const MAX_TAG_LENGTH = 20;

type TagInputProps = {
  inputValue: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: SyntheticEvent) => void;
  onCancel?: (e: SyntheticEvent) => void;
  placeholder?: string;
  mode: 'add' | 'edit';
  isDuplicate?: boolean;
};

const TagInputComponent = ({
  inputValue,
  onInputChange,
  onSubmit,
  onCancel,
  placeholder = 'Add tag...',
  mode = 'add',
  isDuplicate,
}: TagInputProps) => {
  // Reference to the input element to maintain focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Allow submitting via Enter key
  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim() !== '' && !isDuplicate) {
        onSubmit(e);
      } else if (e.key === 'Escape' && mode === 'edit' && onCancel) {
        onCancel(e);
      }
    },
    [inputValue, onSubmit, onCancel, mode, isDuplicate],
  );

  // Calculate the width based on input length (between min and max width)
  const inputWidth = useMemo(() => {
    // Set minimum width for empty or short inputs
    const minWidth = 'w-36'; // Default width (9rem)
    // Maximum width for longer inputs (up to MAX_TAG_LENGTH characters)
    const maxWidth = 'w-64'; // 16rem

    const length = inputValue.length;

    if (length <= MIN_TAG_LENGTH) {
      return minWidth;
    } else if (length >= MAX_TAG_LENGTH) {
      return maxWidth;
    } else {
      // Dynamic width between min and max based on character count
      // Each character increment between MIN-MAX will increase width proportionally
      const widthStep =
        (length - MIN_TAG_LENGTH) / (MAX_TAG_LENGTH - MIN_TAG_LENGTH); // 0 to 1 scale
      // Maps to tailwind w classes between w-36 and w-64
      const widthClasses = [
        'w-36',
        'w-40',
        'w-44',
        'w-48',
        'w-52',
        'w-56',
        'w-60',
        'w-64',
      ];
      const index = Math.min(
        Math.floor(widthStep * (widthClasses.length - 1)),
        widthClasses.length - 1,
      );
      return widthClasses[index];
    }
  }, [inputValue]);

  // Border colors based on mode
  const borderColor = mode === 'add' ? 'border-amber-300' : 'border-blue-300';

  // Auto-focus when in edit mode on component mount
  useEffect(() => {
    if (mode === 'edit' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  return (
    <div
      className={`relative inline-flex ${mode === 'edit' ? 'z-10' : ''} mr-2`}
    >
      <input
        ref={inputRef}
        value={inputValue}
        onChange={onInputChange}
        onKeyUp={handleKeyPress}
        type="text"
        placeholder={placeholder}
        className={`${inputWidth} rounded-full border ${borderColor} py-1 ps-4 ${mode === 'edit' && onCancel ? 'pe-12' : 'pe-8'} transition-all`}
      />

      {/* Render action buttons based on mode */}
      {mode === 'add' ? (
        <span
          className={`absolute top-0 right-2 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 cursor-pointer rounded-full p-0.5 ${
            inputValue.trim() !== ''
              ? 'text-green-600 hover:bg-green-500 hover:text-white'
              : 'cursor-not-allowed text-gray-300'
          }`}
          onClick={inputValue.trim() !== '' ? onSubmit : undefined}
        >
          <PlusIcon />
        </span>
      ) : (
        <>
          <span
            className={`absolute top-0 right-8 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 ${
              !isDuplicate && inputValue.trim() !== ''
                ? 'cursor-pointer text-green-600 hover:bg-green-500 hover:text-white'
                : 'cursor-not-allowed text-gray-300'
            } rounded-full p-0.5`}
            onClick={(e) => {
              e.stopPropagation();
              if (inputValue.trim() !== '' && !isDuplicate) onSubmit(e);
            }}
            title={isDuplicate ? 'Tag name already exists' : 'Save tag'}
          >
            <CheckIcon />
          </span>
          {onCancel && (
            <span
              className="absolute top-0 right-2 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 cursor-pointer rounded-full p-0.5 text-gray-600 hover:bg-gray-500 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(e);
              }}
              title="Cancel"
            >
              <XMarkIcon />
            </span>
          )}
        </>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const TagInput = memo(TagInputComponent);
