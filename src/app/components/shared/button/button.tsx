'use client';

import { ReactNode, SyntheticEvent } from 'react';

/**
 * Shared button component that provides consistent styling and behavior
 * across the application. Supports multiple color variants, sizes, and states.
 */

type ButtonColor =
  | 'slate'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'sky'
  | 'indigo'
  | 'stone';
type ButtonSize = 'small' | 'smallWide' | 'medium' | 'mediumWide' | 'large';
type ButtonVariant = 'default' | 'toggle' | 'deep-toggle' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e?: SyntheticEvent) => void;
  onSubmit?: (e?: SyntheticEvent) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  title?: string;

  // Styling props
  color?: ButtonColor;
  size?: ButtonSize;
  variant?: ButtonVariant;

  // Toggle state (only used with toggle variants)
  isPressed?: boolean;

  // Ghost disabled removes all styling when disabled
  ghostDisabled?: boolean;
  neutralDisabled?: boolean;
}

const sizeStyles: Record<ButtonSize, string> = {
  small: 'px-1 py-0.5',
  smallWide: 'px-2 py-0.5',
  medium: 'px-2 py-1',
  mediumWide: 'px-4 py-1',
  large: 'px-3 py-2',
};

const colorStyles: Record<
  ButtonColor,
  {
    normal: string;
    hover: string; // Need to check if this makes sense
    pressed: string;
    togglePressed: string;
    deepPressed: string;
    disabled: string;
    ghost: string;
    ghostDisabled: string;
  }
> = {
  slate: {
    normal: 'border-slate-300 bg-slate-200 text-slate-800',
    hover: 'hover:bg-slate-100',
    pressed:
      'bg-slate-300 border-slate-400 text-slate-800 hover:text-slate-600',
    togglePressed:
      'border-slate-400 bg-slate-100 text-slate-800 shadow-slate-400 hover:bg-slate-200',
    deepPressed: 'inset-shadow-slate-300 hover:bg-slate-300',
    disabled: 'border-slate-200 bg-slate-100 text-slate-400',
    ghost:
      'border-slate-300/0 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500',
    ghostDisabled: 'border-slate-300/0 text-slate-300',
  },
  amber: {
    normal: 'border-amber-300 bg-amber-200 text-amber-800',
    hover: 'hover:bg-amber-100',
    pressed:
      'bg-amber-300 border-amber-400 text-amber-800 hover:text-amber-600',
    togglePressed:
      'border-amber-400 bg-amber-100 text-amber-800 shadow-amber-400 hover:bg-amber-200',
    deepPressed: 'inset-shadow-amber-300 hover:bg-amber-300',
    disabled: 'border-amber-200 bg-amber-100 text-amber-400',
    ghost:
      'border-amber-300/0 text-amber-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-500',
    ghostDisabled: 'border-amber-300/0 text-amber-300',
  },
  rose: {
    normal: 'border-rose-300 bg-rose-200 text-rose-800',
    hover: 'hover:bg-rose-100',
    pressed: 'bg-rose-300 border-rose-400 text-rose-800 hover:text-rose-600',
    togglePressed:
      'border-rose-400 bg-rose-100 text-rose-800 shadow-rose-400 hover:bg-rose-200',
    deepPressed: 'inset-shadow-rose-300 hover:bg-rose-300',
    disabled: 'border-rose-200 bg-rose-100 text-rose-400',
    ghost:
      'border-rose-300/0 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500',
    ghostDisabled: 'border-rose-300/0 text-rose-300',
  },
  emerald: {
    normal: 'border-emerald-300 bg-emerald-200 text-emerald-800',
    hover: 'hover:bg-emerald-100',
    pressed:
      'bg-emerald-300 border-emerald-400 text-emerald-800 hover:text-emerald-600',
    togglePressed:
      'border-emerald-400 bg-emerald-100 text-emerald-800 shadow-emerald-400 hover:bg-emerald-200',
    deepPressed: 'inset-shadow-emerald-300 hover:bg-emerald-300',
    disabled: 'border-emerald-200 bg-emerald-100 text-emerald-400',
    ghost:
      'border-emerald-300/0 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-500',
    ghostDisabled: 'border-emerald-300/0 text-emerald-300',
  },
  sky: {
    normal: 'border-sky-300 bg-sky-200 text-sky-800',
    hover: 'hover:bg-sky-100',
    pressed: 'bg-sky-300 border-sky-400 text-sky-800 hover:text-sky-600',
    togglePressed:
      'border-sky-400 bg-sky-100 text-sky-800 shadow-sky-400 hover:bg-sky-200',
    deepPressed: 'inset-shadow-sky-300 hover:bg-sky-300',
    disabled: 'border-sky-200 bg-sky-100 text-sky-400',
    ghost:
      'border-sky-300/0 text-sky-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-500',
    ghostDisabled: 'border-sky-300/0 text-sky-300',
  },
  indigo: {
    normal: 'border-indigo-300 bg-indigo-200 text-indigo-800',
    hover: 'hover:bg-indigo-100',
    pressed:
      'bg-indigo-300 border-indigo-400 text-indigo-800 hover:text-indigo-600',
    togglePressed:
      'border-indigo-400 bg-indigo-100 text-indigo-800 shadow-indigo-400 hover:bg-indigo-200',
    deepPressed: 'inset-shadow-indigo-300 hover:bg-indigo-300',
    disabled: 'border-indigo-200 bg-indigo-100 text-indigo-400',
    ghost:
      'border-indigo-300/0 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-500',
    ghostDisabled: 'border-indigo-300/0 text-indigo-300',
  },
  stone: {
    normal: 'border-stone-300 bg-stone-200 text-stone-800',
    hover: 'hover:bg-stone-100',
    pressed:
      'bg-stone-300 border-stone-400 text-stone-800 hover:text-stone-600',
    togglePressed:
      'border-stone-400 bg-stone-100 text-stone-800 shadow-stone-400 hover:bg-stone-200',
    deepPressed: 'inset-shadow-stone-300 hover:bg-stone-300',
    disabled: 'border-stone-200 bg-stone-100 text-stone-400',
    ghost:
      'border-stone-300/0 text-stone-700 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-500',
    ghostDisabled: 'border-stone-300/0 text-stone-300',
  },
};

export const Button = ({
  children,
  onClick,
  onSubmit,
  type = 'button',
  disabled = false,
  className = '',
  title,
  color = 'slate',
  size = 'medium',
  variant = 'default',
  isPressed = false,
  ghostDisabled = false,
  neutralDisabled = false,
  ...props
}: ButtonProps) => {
  const handleClick = () => {
    if (disabled) return;
    if (type === 'submit' && onSubmit) {
      onSubmit();
    } else if (onClick) {
      onClick();
    }
  };

  const baseStyle = {
    common: `flex items-center rounded-sm transition-colors border ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`,
    normal: 'inset-shadow-xs inset-shadow-white',
    disabled: 'opacity-60',
    ghost: 'hover:inset-shadow-xs hover:inset-shadow-white',
    pressed: 'inset-shadow-xs inset-shadow-white shadow-sm',
    togglePressed: 'inset-shadow-xs inset-shadow-white shadow-sm',
    deepPressed: 'shadow-md inset-shadow-sm shadow-white border-slate-300',
  };

  // Size-specific styles
  const sizeClasses = sizeStyles[size];

  // Color and state-specific styles
  const colorConfig = colorStyles[color];
  let styleClasses = '';

  if (disabled) {
    if (variant === 'deep-toggle') {
      styleClasses =
        isPressed && !ghostDisabled
          ? `bg-white ${baseStyle.disabled} ${neutralDisabled ? colorStyles.slate.disabled : colorConfig.disabled}`
          : colorConfig.ghostDisabled;
    } else if (variant === 'toggle') {
      styleClasses = ghostDisabled
        ? `${neutralDisabled ? colorStyles.slate.ghostDisabled : colorConfig.ghostDisabled}`
        : `${isPressed ? `${baseStyle.togglePressed}` : ''} ${neutralDisabled ? colorStyles.slate.disabled : colorConfig.disabled}`;
    } else {
      styleClasses =
        ghostDisabled || variant === 'ghost'
          ? `${neutralDisabled ? colorStyles.slate.ghostDisabled : colorConfig.ghostDisabled}`
          : `${baseStyle.disabled} ${isPressed ? `${baseStyle.pressed} ${colorConfig.pressed}` : ''} ${neutralDisabled ? colorStyles.slate.disabled : colorConfig.disabled}`;
    }
  } else {
    // Determine styling based on variant and state
    switch (variant) {
      case 'toggle':
        styleClasses = isPressed
          ? `${baseStyle.togglePressed} ${colorConfig.togglePressed}`
          : `${baseStyle.normal} ${colorConfig.normal} ${colorConfig.hover}`;
        break;

      case 'deep-toggle':
        styleClasses = isPressed
          ? `border-white bg-white ${baseStyle.pressed}`
          : `${baseStyle.deepPressed} ${colorConfig.deepPressed}`;
        break;

      case 'ghost':
        styleClasses = `${baseStyle.ghost} ${colorConfig.ghost}`;
        break;

      default:
        styleClasses = `${baseStyle.normal} ${isPressed ? colorConfig.pressed : colorConfig.normal} ${colorConfig.hover}`;
        break;
    }
  }

  // Combine all classes
  const allClasses = [baseStyle.common, sizeClasses, styleClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={allClasses}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
};
