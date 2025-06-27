import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent, SyntheticEvent } from 'react';
import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Props for the InputTag component
 * @interface InputTagProps
 */
type InputTagProps = {
  /** Current input value */
  inputValue: string;
  /** Handler for input change events */
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Handler for form submission */
  onSubmit: (e: SyntheticEvent) => void;
  /** Handler for cancellation */
  onCancel: (e: SyntheticEvent) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Mode of operation - 'add' for new tags, 'edit' for existing tags */
  mode: 'add' | 'edit';
  /** Whether the current input value would create a duplicate tag */
  isDuplicate?: boolean;
  /** Whether the component should be non-interactive */
  nonInteractive?: boolean;
};

export const InputTag = ({
  inputValue,
  onInputChange,
  onSubmit,
  onCancel,
  placeholder = 'Add tag...',
  mode = 'add',
  isDuplicate,
  nonInteractive = false,
}: InputTagProps) => {
  // Reference to the input element to maintain focus
  const inputRef = useRef<HTMLInputElement>(null);
  // Track if the input is focused for showing/hiding controls in add mode
  const [isFocused, setIsFocused] = useState(mode === 'edit');

  // Handle focus and blur events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Only hide buttons in add mode, edit mode always shows buttons
    if (mode === 'add') {
      // Small delay to allow button clicks to register before hiding
      setTimeout(() => {
        setIsFocused(false);
      }, 100);
    }
  }, [mode]);

  // Allow submitting via Enter key and canceling via Escape
  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // For edit mode, we need different handling
      if (mode === 'edit') {
        if (
          e.key === 'Enter' &&
          inputValue.trim() !== '' &&
          !isDuplicate &&
          !nonInteractive
        ) {
          // Only allow submission of non-empty, non-duplicate values in edit mode
          onSubmit(e);
        } else if (e.key === 'Escape' && !nonInteractive) {
          // Always call cancel in edit mode, which will properly un-fade tags
          // This is the ONLY way to exit edit mode
          onCancel(e);
        } else if (e.key === 'Enter') {
          // Prevent default form submission behavior for empty/duplicate values
          e.preventDefault();
        }
      } else {
        // Add mode behavior
        if (
          e.key === 'Enter' &&
          inputValue.trim() !== '' &&
          !isDuplicate &&
          !nonInteractive
        ) {
          onSubmit(e);
        } else if (e.key === 'Escape' && !nonInteractive) {
          onCancel(e);
        } else if (e.key === 'Enter') {
          // Prevent form submission on empty/duplicate in add mode
          e.preventDefault();
        }
      }
    },
    [inputValue, onSubmit, onCancel, isDuplicate, nonInteractive, mode],
  );

  // Calculate the width based on input length (between min and max width)
  const inputWidth = useMemo(() => {
    // min/max range of string length to match to Tailwind class steps
    const MIN_CHAR_LENGTH = 6;
    const MAX_CHAR_LENGTH = 20;

    const length = inputValue.length;

    // A note on Tailwind classes: They must be whole strings (`w-24` etc.) as otherwise Tailwind's parser won't properly extract the correct CSS for them
    if (length <= MIN_CHAR_LENGTH) {
      return `w-40`;
    } else if (length >= MAX_CHAR_LENGTH) {
      return `w-68`;
    } else {
      // Dynamic width between min and max based on character count
      // Each character increment between MIN-MAX will increase width proportionally
      const widthStep =
        (length - MIN_CHAR_LENGTH) / (MAX_CHAR_LENGTH - MIN_CHAR_LENGTH); // 0 to 1 scale

      const widthClasses = ['w-44', 'w-48', 'w-52', 'w-56', 'w-60', 'w-64'];

      const index = Math.min(
        Math.floor(widthStep * widthClasses.length),
        widthClasses.length - 1,
      );
      return widthClasses[index];
    }
  }, [inputValue]);

  // Border colors based on mode
  const border =
    mode === 'add' ? 'border border-amber-300' : 'border border-blue-300';
  const insetShadow =
    mode === 'add'
      ? 'inset-shadow-sm inset-shadow-amber-100'
      : 'inset-shadow-sm inset-shadow-blue-100';

  // Auto-focus when in edit mode on component mount
  useEffect(() => {
    if (mode === 'edit' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  return (
    <div className="relative mr-2 inline-flex">
      <input
        ref={inputRef}
        value={inputValue}
        onChange={onInputChange}
        onKeyUp={handleKeyPress}
        type="text"
        placeholder={placeholder}
        tabIndex={nonInteractive ? -1 : 0}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`${inputWidth} rounded-full py-1 ps-4 pe-14 transition-all ${border} ${nonInteractive ? 'pointer-events-none' : ''} ${isFocused ? `${insetShadow} ring-2 ring-blue-500` : ''}`}
      />

      {/* Render action buttons based on mode */}
      {mode === 'add' ? (
        <>
          <span
            className={`absolute top-0 right-8 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 rounded-full p-0.5 transition-colors ${
              inputValue.trim() !== '' && !isDuplicate && !nonInteractive
                ? 'cursor-pointer text-green-600 hover:bg-green-500 hover:text-white'
                : 'pointer-events-none text-slate-300 opacity-0'
            }`}
            onClick={
              inputValue.trim() !== '' && !isDuplicate && !nonInteractive
                ? onSubmit
                : undefined
            }
            tabIndex={nonInteractive || isDuplicate ? -1 : 0}
            title={isDuplicate ? 'Tag already exists' : 'Add tag'}
          >
            <PlusIcon />
          </span>

          <span
            className={`absolute top-0 right-2 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 rounded-full p-0.5 transition-colors ${
              inputValue.trim() !== '' && !nonInteractive
                ? 'cursor-pointer text-slate-600 hover:bg-slate-500 hover:text-white'
                : 'pointer-events-none text-slate-300 opacity-0'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (inputValue.trim() !== '' && !nonInteractive) onCancel(e);
            }}
            tabIndex={nonInteractive || inputValue.trim() === '' ? -1 : 0}
            title="Cancel"
          >
            <XMarkIcon />
          </span>
        </>
      ) : (
        <>
          <span
            className={`absolute top-0 right-8 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 transition-colors ${
              !isDuplicate && inputValue.trim() !== '' && !nonInteractive
                ? 'cursor-pointer text-green-600 hover:bg-green-500 hover:text-white'
                : 'cursor-not-allowed text-slate-300'
            } rounded-full p-0.5`}
            onClick={(e) => {
              e.stopPropagation();
              if (inputValue.trim() !== '' && !isDuplicate && !nonInteractive)
                onSubmit(e);
            }}
            tabIndex={isDuplicate || nonInteractive ? -1 : 0}
            title={isDuplicate ? 'Tag name already exists' : 'Save tag'}
          >
            <CheckIcon />
          </span>

          <span
            // In edit mode, the cancel button should always be active regardless of input value
            className={`absolute top-0 right-2 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 rounded-full p-0.5 transition-colors ${!nonInteractive ? 'cursor-pointer text-slate-600 hover:bg-slate-500 hover:text-white' : 'cursor-not-allowed text-slate-400'}`}
            onClick={(e) => {
              e.stopPropagation();
              // Always call onCancel directly in edit mode, regardless of input value
              if (!nonInteractive) onCancel(e);
            }}
            tabIndex={nonInteractive ? -1 : 0}
            title={isDuplicate ? 'Cancel (duplicate tag)' : 'Cancel'}
          >
            <XMarkIcon />
          </span>
        </>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
// export const InputTag = memo(InputTagComponent);
