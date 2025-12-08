/**
 * InputTag Component v2
 *
 * Phase 1: Basic add mode functionality
 * - Text input with submit/cancel
 * - Placeholder for edit mode (to be added later)
 */
import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ChangeEvent, KeyboardEvent, memo, SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';

import { track } from '@/app/utils/render-tracker';

type InputTagProps = {
  mode: 'add' | 'edit';
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
  isDuplicate?: boolean;
  disabled?: boolean;
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
}: InputTagProps) => {
  track('InputTag', 'render');

  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(mode === 'edit');

  // Auto-focus input in edit mode
  useEffect(() => {
    if (mode === 'edit' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
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
      if (e.key === 'Enter' && value.trim() && !isDuplicate) {
        e.preventDefault();
        onSubmit();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    },
    [value, isDuplicate, onSubmit, onCancel],
  );

  const handleSubmitClick = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      if (value.trim() && !isDuplicate) {
        onSubmit();
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
  const borderColour = mode === 'add' ? 'border-amber-300' : 'border-blue-300';
  const shadowColour = mode === 'add' ? 'inset-shadow-amber-100' : 'inset-shadow-blue-100';
  const canSubmit = value.trim() !== '' && !isDuplicate && !disabled;

  track('InputTag', 'render-end');

  return (
    <div className="relative mr-2 inline-flex">
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`w-40 rounded-full border py-1 ps-4 pe-14 transition-all ${borderColour} ${disabled ? 'pointer-events-none opacity-50' : ''} ${isFocused ? `inset-shadow-sm ${shadowColour} ring-2 ring-blue-500` : ''}`}
      />

      {/* Submit button */}
      <span
        className={`absolute top-0 right-8 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 rounded-full p-0.5 transition-colors ${
          canSubmit
            ? 'cursor-pointer text-green-600 hover:bg-green-500 hover:text-white'
            : 'pointer-events-none text-slate-300'
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
            ? 'cursor-pointer text-slate-600 hover:bg-slate-500 hover:text-white'
            : 'pointer-events-none text-slate-300'
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
const inputTagPropsAreEqual = (prevProps: InputTagProps, nextProps: InputTagProps): boolean => {
  track('InputTag', 'memo-check');

  const isEqual =
    prevProps.mode === nextProps.mode &&
    prevProps.value === nextProps.value &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.isDuplicate === nextProps.isDuplicate &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onCancel === nextProps.onCancel;

  if (isEqual) track('InputTag', 'memo-hit');
  return isEqual;
};

export const InputTag = memo(InputTagComponent, inputTagPropsAreEqual);
