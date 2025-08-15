import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent, ClipboardEvent, SyntheticEvent } from 'react';
import {
  KeyboardEvent,
  memo,
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
  inputValue: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: SyntheticEvent) => void;
  onCancel: (e: SyntheticEvent) => void;
  placeholder?: string;
  mode: 'add' | 'edit';
  isDuplicate?: boolean;
  nonInteractive?: boolean;
  onMultipleTagsSubmit?: (tags: string[]) => void;
};

const InputTagComponent = ({
  inputValue,
  onInputChange,
  onSubmit,
  onCancel,
  placeholder = 'Add tag...',
  mode = 'add',
  isDuplicate,
  nonInteractive = false,
  onMultipleTagsSubmit,
}: InputTagProps) => {
  // Reference to the input element to maintain focus
  const inputRef = useRef<HTMLInputElement>(null);
  // Track if the input is focused for showing/hiding controls in add mode
  const [isFocused, setIsFocused] = useState(mode === 'edit');

  // Helper function to process comma-separated tags
  const processMultipleTags = useCallback(
    (tagsString: string) => {
      if (mode === 'edit' || !onMultipleTagsSubmit) {
        return false;
      }

      const tags = tagsString
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Process if we have any valid tags (even just one)
      if (tags.length > 0) {
        onMultipleTagsSubmit(tags);
        return true;
      }

      return false;
    },
    [mode, onMultipleTagsSubmit],
  );

  // Handle paste events to detect comma-separated content
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (mode === 'edit' || nonInteractive) {
        return;
      }

      const pastedText = e.clipboardData.getData('text');
      const fullText = inputValue + pastedText;

      // If the pasted content contains commas, process it as multiple tags
      if (pastedText.includes(',')) {
        e.preventDefault();
        processMultipleTags(fullText);
      }
    },
    [mode, nonInteractive, inputValue, processMultipleTags],
  );

  // Helper function to handle tag submission with comma detection
  const handleTagSubmission = useCallback(
    (e: SyntheticEvent, value: string) => {
      // First check if we have comma-separated tags (only in add mode)
      if (mode === 'add' && processMultipleTags(value)) {
        return;
      }

      // Handle single tag submission
      if (value.trim() !== '' && !nonInteractive) {
        if (mode === 'edit') {
          if (!isDuplicate) {
            onSubmit(e);
          }
        } else {
          // Add mode
          if (!isDuplicate) {
            onSubmit(e);
          } else {
            // Clear the field when trying to add a duplicate
            onCancel(e);
          }
        }
      }
    },
    [
      mode,
      processMultipleTags,
      nonInteractive,
      isDuplicate,
      onSubmit,
      onCancel,
    ],
  );

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

  // Allow submitting via Enter/comma and canceling via Escape
  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Handle Enter and comma as submission triggers
      if (e.key === 'Enter' || (e.key === ',' && mode === 'add')) {
        e.preventDefault(); // Prevent default behavior for both keys
        handleTagSubmission(e, inputValue);
      } else if (e.key === 'Escape' && !nonInteractive) {
        if (mode === 'edit') {
          // Always call cancel in edit mode, which will properly un-fade tags
          // This is the ONLY way to exit edit mode
          onCancel(e);
        } else {
          // Add mode
          onCancel(e);
        }
      }
    },
    [inputValue, handleTagSubmission, nonInteractive, mode, onCancel],
  );

  const onCancelAdd = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      if (inputValue.trim() !== '' && !nonInteractive) onCancel(e);
    },
    [inputValue, nonInteractive, onCancel],
  );

  const onSubmitAdd = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      if (inputValue.trim() !== '' && !nonInteractive) {
        handleTagSubmission(e, inputValue);
      }
    },
    [inputValue, nonInteractive, handleTagSubmission],
  );

  const onClickEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      if (inputValue.trim() !== '' && !isDuplicate && !nonInteractive)
        onSubmit(e);
    },
    [inputValue, isDuplicate, nonInteractive, onSubmit],
  );

  const onCancelEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      // Always call onCancel directly in edit mode, regardless of input value
      if (!nonInteractive) onCancel(e);
    },
    [nonInteractive, onCancel],
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
        onKeyDown={handleKeyPress}
        onPaste={handlePaste}
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
              inputValue.trim() !== '' && !nonInteractive
                ? 'cursor-pointer text-green-600 hover:bg-green-500 hover:text-white'
                : 'pointer-events-none text-slate-300 opacity-0'
            }`}
            onClick={
              inputValue.trim() !== '' && !nonInteractive
                ? isDuplicate
                  ? onCancel
                  : onSubmitAdd
                : undefined
            }
            tabIndex={nonInteractive ? -1 : 0}
            title={isDuplicate ? 'Clear duplicate tag' : 'Add tag'}
          >
            <PlusIcon />
          </span>

          <span
            className={`absolute top-0 right-2 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 rounded-full p-0.5 transition-colors ${
              inputValue.trim() !== '' && !nonInteractive
                ? 'cursor-pointer text-slate-600 hover:bg-slate-500 hover:text-white'
                : 'pointer-events-none text-slate-300 opacity-0'
            }`}
            onClick={onCancelAdd}
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
            onClick={onClickEdit}
            tabIndex={isDuplicate || nonInteractive ? -1 : 0}
            title={isDuplicate ? 'Tag name already exists' : 'Save tag'}
          >
            <CheckIcon />
          </span>

          <span
            // In edit mode, the cancel button should always be active regardless of input value
            className={`absolute top-0 right-2 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 rounded-full p-0.5 transition-colors ${!nonInteractive ? 'cursor-pointer text-slate-600 hover:bg-slate-500 hover:text-white' : 'cursor-not-allowed text-slate-400'}`}
            onClick={onCancelEdit}
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
export const InputTag = memo(InputTagComponent);
