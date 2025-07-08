import React, { SyntheticEvent } from 'react';

/**
 * Props for the Checkbox component
 */
interface CheckboxProps {
  isSelected: boolean;
  onChange: (e: SyntheticEvent) => void;
  className?: string;
  tabIndex?: number;
  disabled?: boolean;
  ariaLabel?: string;
  label?: string; // Optional label to display next to the checkbox
}

/**
 * A reusable checkbox component with custom styling and keyboard accessibility
 */
export const Checkbox = ({
  isSelected,
  onChange,
  className = '',
  tabIndex = 0,
  disabled = false,
  ariaLabel,
  label,
}: CheckboxProps) => {
  return (
    <label
      className={`inline-flex items-start gap-2 text-sm select-none ${disabled ? 'cursor-not-allowed text-slate-300' : 'cursor-pointer text-slate-700'}`}
      onClick={(e) => {
        if (!disabled) onChange(e);
      }}
      tabIndex={-1} // prevent double tab stop
    >
      <div
        className={`relative flex h-5 w-5 items-center justify-center overflow-hidden rounded border shadow-sm inset-shadow-xs transition-all ${
          disabled
            ? 'border-slate-300 bg-slate-50 shadow-slate-200'
            : isSelected
              ? 'border-sky-700 bg-sky-500 text-white shadow-slate-500 inset-shadow-sky-300 hover:bg-sky-600'
              : 'border-slate-400 bg-white shadow-white inset-shadow-slate-300 hover:border-sky-500 hover:bg-sky-50'
        } ${className}`}
        role="checkbox"
        aria-checked={isSelected}
        aria-label={ariaLabel}
        tabIndex={disabled ? -1 : tabIndex}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(e);
          }
        }}
      >
        {isSelected && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      {label && <span>{label}</span>}
    </label>
  );
};
