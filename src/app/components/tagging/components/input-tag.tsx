/**
 * InputTag Component v2
 *
 * Phase 1: Basic add mode functionality
 * - Text input with submit/cancel
 * - Placeholder for edit mode (to be added later)
 */
import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  memo,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Calculate dynamic input width based on text length
// Uses discrete Tailwind classes for proper CSS extraction
const useInputWidth = (textLength: number): string => {
  return useMemo(() => {
    const MIN_CHAR_LENGTH = 6;
    const MAX_CHAR_LENGTH = 20;

    // A note on Tailwind classes: They must be whole strings (`w-24` etc.)
    // as otherwise Tailwind's parser won't properly extract the correct CSS
    if (textLength <= MIN_CHAR_LENGTH) {
      return 'w-40';
    } else if (textLength >= MAX_CHAR_LENGTH) {
      return 'w-68';
    } else {
      // Dynamic width between min and max based on character count
      const widthStep =
        (textLength - MIN_CHAR_LENGTH) / (MAX_CHAR_LENGTH - MIN_CHAR_LENGTH);
      const widthClasses = ['w-44', 'w-48', 'w-52', 'w-56', 'w-60', 'w-64'];
      const index = Math.min(
        Math.floor(widthStep * widthClasses.length),
        widthClasses.length - 1,
      );
      return widthClasses[index];
    }
  }, [textLength]);
};

type InputTagProps = {
  mode: 'add' | 'edit';
  value: string;
  onChange: (value: string) => void;
  onSubmit: (prepend?: boolean) => void;
  onCancel: () => void;
  placeholder?: string;
  isDuplicate?: boolean;
  disabled?: boolean;
  onMultipleTagsSubmit?: (tags: string[], prepend?: boolean) => void;
};

const InputTagComponent = ({
  mode,
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = 'Add tag...',
  isDuplicate = false,
  disabled = false,
  onMultipleTagsSubmit,
}: InputTagProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(mode === 'edit');
  const inputWidth = useInputWidth(value.length);

  // Helper function to process comma-separated tags
  const processMultipleTags = useCallback(
    (tagsString: string, prepend?: boolean): boolean => {
      if (mode === 'edit' || !onMultipleTagsSubmit) {
        return false;
      }

      const tags = tagsString
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (tags.length > 0) {
        onMultipleTagsSubmit(tags, prepend);
        return true;
      }

      return false;
    },
    [mode, onMultipleTagsSubmit],
  );

  // Handle paste events to detect comma-separated content
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (mode === 'edit' || disabled) {
        return;
      }

      const pastedText = e.clipboardData.getData('text');
      const fullText = value + pastedText;

      // If the pasted content contains commas, process it as multiple tags
      if (pastedText.includes(',')) {
        e.preventDefault();
        processMultipleTags(fullText);
      }
    },
    [mode, disabled, value, processMultipleTags],
  );

  // Auto-focus input in edit mode, cursor at end
  useEffect(() => {
    if (mode === 'edit' && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end of input (more natural for editing a few characters)
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [mode]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Handle Enter and comma as submission triggers
      // Shift+Enter or Shift+comma prepends to the start of the list
      if (e.key === 'Enter' || (e.key === ',' && mode === 'add')) {
        e.preventDefault();
        const prepend = e.shiftKey;

        // First check if we have comma-separated tags (only in add mode)
        if (mode === 'add' && processMultipleTags(value, prepend)) {
          return;
        }

        // Handle single tag submission
        if (value.trim() && !isDuplicate) {
          onSubmit(prepend);
        }
      } else if (e.key === 'Escape') {
        onCancel();
      }
    },
    [value, isDuplicate, onSubmit, onCancel, mode, processMultipleTags],
  );

  const handleSubmitClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (value.trim() && !isDuplicate) {
        onSubmit(e.shiftKey);
      }
    },
    [value, isDuplicate, onSubmit],
  );

  const handleCancelClick = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      onCancel();
    },
    [onCancel],
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => {
    if (mode === 'add') {
      setTimeout(() => setIsFocused(false), 100);
    }
  }, [mode]);

  // Styling
  const borderColor =
    mode === 'add'
      ? 'border-amber-300 dark:border-amber-600'
      : 'border-blue-300 dark:border-blue-600';
  const shadowColor =
    mode === 'add'
      ? 'inset-shadow-amber-100 dark:inset-shadow-amber-800'
      : 'inset-shadow-blue-100 dark:inset-shadow-blue-800';
  const canSubmit = value.trim() !== '' && !isDuplicate && !disabled;

  return (
    <div className="relative mr-2 inline-flex">
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlur}
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`${inputWidth} rounded-full border py-1 ps-4 pe-14 transition-all ${borderColor} ${disabled ? 'pointer-events-none opacity-50' : ''} ${isFocused ? `inset-shadow-sm ${shadowColor} ring-2 ring-blue-500` : ''}`}
      />

      {/* Submit button */}
      <span
        className={`absolute top-0 right-8 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 rounded-full p-0.5 transition-colors ${
          canSubmit
            ? 'cursor-pointer text-green-600 hover:bg-green-500 hover:text-white dark:text-green-400'
            : 'pointer-events-none text-slate-300 dark:text-slate-600'
        }`}
        onClick={canSubmit ? handleSubmitClick : undefined}
        tabIndex={canSubmit ? 0 : -1}
        title={mode === 'add' ? 'Add tag' : 'Save tag'}
      >
        {mode === 'add' ? <PlusIcon /> : <CheckIcon />}
      </span>

      {/* Cancel button */}
      <span
        className={`absolute top-0 right-2 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 rounded-full p-0.5 transition-colors ${
          value.trim() !== '' && !disabled
            ? 'cursor-pointer text-slate-600 hover:bg-slate-500 hover:text-white dark:text-slate-400'
            : 'pointer-events-none text-slate-300 dark:text-slate-600'
        }`}
        onClick={value.trim() !== '' ? handleCancelClick : undefined}
        tabIndex={value.trim() !== '' && !disabled ? 0 : -1}
        title="Cancel"
      >
        <XMarkIcon />
      </span>
    </div>
  );
};

// Memo comparison
const inputTagPropsAreEqual = (
  prevProps: InputTagProps,
  nextProps: InputTagProps,
): boolean =>
  prevProps.mode === nextProps.mode &&
  prevProps.value === nextProps.value &&
  prevProps.placeholder === nextProps.placeholder &&
  prevProps.isDuplicate === nextProps.isDuplicate &&
  prevProps.disabled === nextProps.disabled &&
  prevProps.onChange === nextProps.onChange &&
  prevProps.onSubmit === nextProps.onSubmit &&
  prevProps.onCancel === nextProps.onCancel &&
  prevProps.onMultipleTagsSubmit === nextProps.onMultipleTagsSubmit;

export const InputTag = memo(InputTagComponent, inputTagPropsAreEqual);
