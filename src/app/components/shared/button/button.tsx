'use client';

import { KeyboardEventHandler, MouseEvent, ReactNode, Ref } from 'react';

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
type ButtonSize =
  | 'minimum'
  | 'small'
  | 'smallSquare'
  | 'smallWide'
  | 'medium'
  | 'mediumWide'
  | 'large';
type ButtonVariant = 'default' | 'toggle' | 'deep-toggle' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent) => void;
  onSubmit?: (e: MouseEvent) => void;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  title?: string;
  ref?: Ref<HTMLButtonElement>;

  // Styling props
  color?: ButtonColor;
  size?: ButtonSize;
  variant?: ButtonVariant;

  // Toggle state (only used with toggle variants)
  isPressed?: boolean;

  // Ghost disabled removes all styling when disabled
  ghostDisabled?: boolean;
  neutralDisabled?: boolean;

  // Inert removes interactive behavior (no click handling, default cursor, no hover)
  inert?: boolean;
}

const sizeStyles: Record<ButtonSize, string> = {
  minimum: '',
  small: 'px-1 py-0.5 [&_svg]:h-4',
  smallSquare: 'px-0.5 [&_svg]:h-4',
  smallWide: 'px-2 py-0.5 [&_svg]:h-4',
  medium: 'px-2 py-1 [&_svg]:h-5',
  mediumWide: 'px-4 py-1 [&_svg]:h-5',
  large: 'px-3 py-2 [&_svg]:h-5',
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
    normal:
      'border-slate-300 bg-slate-200 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300',
    hover:
      'hover:bg-slate-100 dark:hover:bg-slate-600 dark:hover:text-slate-100',
    pressed:
      'bg-slate-300 border-slate-400 text-slate-800 hover:text-slate-600 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-300 dark:hover:text-slate-100',
    togglePressed:
      'bg-slate-100 border-slate-400 text-slate-800 shadow-slate-400 hover:bg-slate-200 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-300 dark:shadow-slate-600 dark:hover:bg-slate-700',
    deepPressed:
      'inset-shadow-slate-300 hover:bg-slate-300 dark:inset-shadow-slate-700 dark:hover:bg-slate-600',
    disabled:
      'border-slate-200 bg-slate-100 text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500',
    ghost:
      'border-slate-300/0 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-600 dark:hover:text-slate-100',
    ghostDisabled: 'border-slate-300/0 text-slate-300 dark:text-slate-500',
  },
  amber: {
    normal:
      'border-amber-300 bg-amber-200 text-amber-800 dark:border-amber-600 dark:bg-amber-700 dark:text-amber-300',
    hover:
      'hover:bg-amber-100 dark:hover:bg-amber-600 dark:hover:text-amber-100',
    pressed:
      'bg-amber-300 border-amber-400 text-amber-800 hover:text-amber-600 dark:bg-amber-600 dark:border-amber-500 dark:text-amber-300 dark:hover:text-amber-100',
    togglePressed:
      'bg-amber-100 border-amber-400 text-amber-800 shadow-amber-400 hover:bg-amber-200 dark:border-amber-500 dark:bg-amber-800 dark:text-amber-300 dark:shadow-amber-600 dark:hover:bg-amber-700',
    deepPressed:
      'inset-shadow-amber-300 hover:bg-amber-300 dark:inset-shadow-amber-700 dark:hover:bg-amber-600',
    disabled:
      'border-amber-200 bg-amber-100 text-amber-300 dark:border-amber-700 dark:bg-amber-800 dark:text-amber-500',
    ghost:
      'border-amber-300/0 text-amber-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-500 dark:text-amber-300 dark:hover:border-amber-500 dark:hover:bg-amber-600 dark:hover:text-amber-100',
    ghostDisabled: 'border-amber-300/0 text-amber-300 dark:text-amber-500',
  },
  rose: {
    normal:
      'border-rose-300 bg-rose-200 text-rose-800 dark:border-rose-600 dark:bg-rose-700 dark:text-rose-300',
    hover:
      'hover:bg-rose-100 dark:hover:bg-rose-600 dark:hover:text-rose-100',
    pressed:
      'bg-rose-300 border-rose-400 text-rose-800 hover:text-rose-600 dark:bg-rose-600 dark:border-rose-500 dark:text-rose-300 dark:hover:text-rose-100',
    togglePressed:
      'bg-rose-100 border-rose-400 text-rose-800 shadow-rose-400 hover:bg-rose-200 dark:border-rose-500 dark:bg-rose-800 dark:text-rose-300 dark:shadow-rose-600 dark:hover:bg-rose-700',
    deepPressed:
      'inset-shadow-rose-300 hover:bg-rose-300 dark:inset-shadow-rose-700 dark:hover:bg-rose-600',
    disabled:
      'border-rose-200 bg-rose-100 text-rose-300 dark:border-rose-700 dark:bg-rose-800 dark:text-rose-500',
    ghost:
      'border-rose-300/0 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:text-rose-300 dark:hover:border-rose-500 dark:hover:bg-rose-600 dark:hover:text-rose-100',
    ghostDisabled: 'border-rose-300/0 text-rose-300 dark:text-rose-500',
  },
  emerald: {
    normal:
      'border-emerald-300 bg-emerald-200 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-700 dark:text-emerald-300',
    hover:
      'hover:bg-emerald-100 dark:hover:bg-emerald-600 dark:hover:text-emerald-100',
    pressed:
      'bg-emerald-300 border-emerald-400 text-emerald-800 hover:text-emerald-600 dark:bg-emerald-600 dark:border-emerald-500 dark:text-emerald-300 dark:hover:text-emerald-100',
    togglePressed:
      'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-emerald-400 hover:bg-emerald-200 dark:border-emerald-500 dark:bg-emerald-800 dark:text-emerald-300 dark:shadow-emerald-600 dark:hover:bg-emerald-700',
    deepPressed:
      'inset-shadow-emerald-300 hover:bg-emerald-300 dark:inset-shadow-emerald-700 dark:hover:bg-emerald-600',
    disabled:
      'border-emerald-200 bg-emerald-100 text-emerald-300 dark:border-emerald-700 dark:bg-emerald-800 dark:text-emerald-500',
    ghost:
      'border-emerald-300/0 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-500 dark:text-emerald-300 dark:hover:border-emerald-500 dark:hover:bg-emerald-600 dark:hover:text-emerald-100',
    ghostDisabled: 'border-emerald-300/0 text-emerald-300 dark:text-emerald-500',
  },
  sky: {
    normal:
      'border-sky-300 bg-sky-200 text-sky-800 dark:border-sky-600 dark:bg-sky-700 dark:text-sky-300',
    hover:
      'hover:bg-sky-100 dark:hover:bg-sky-600 dark:hover:text-sky-100',
    pressed:
      'bg-sky-300 border-sky-400 text-sky-800 hover:text-sky-600 dark:bg-sky-600 dark:border-sky-500 dark:text-sky-300 dark:hover:text-sky-100',
    togglePressed:
      'bg-sky-100 border-sky-400 text-sky-800 shadow-sky-400 hover:bg-sky-200 dark:border-sky-500 dark:bg-sky-800 dark:text-sky-300 dark:shadow-sky-600 dark:hover:bg-sky-700',
    deepPressed:
      'inset-shadow-sky-300 hover:bg-sky-300 dark:inset-shadow-sky-700 dark:hover:bg-sky-600',
    disabled:
      'border-sky-200 bg-sky-100 text-sky-300 dark:border-sky-700 dark:bg-sky-800 dark:text-sky-500',
    ghost:
      'border-sky-300/0 text-sky-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-500 dark:text-sky-300 dark:hover:border-sky-500 dark:hover:bg-sky-600 dark:hover:text-sky-100',
    ghostDisabled: 'border-sky-300/0 text-sky-300 dark:text-sky-500',
  },
  indigo: {
    normal:
      'border-indigo-300 bg-indigo-200 text-indigo-800 dark:border-indigo-600 dark:bg-indigo-700 dark:text-indigo-300',
    hover:
      'hover:bg-indigo-100 dark:hover:bg-indigo-600 dark:hover:text-indigo-100',
    pressed:
      'bg-indigo-300 border-indigo-400 text-indigo-800 hover:text-indigo-600 dark:bg-indigo-600 dark:border-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-100',
    togglePressed:
      'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-indigo-400 hover:bg-indigo-200 dark:border-indigo-500 dark:bg-indigo-800 dark:text-indigo-300 dark:shadow-indigo-600 dark:hover:bg-indigo-700',
    deepPressed:
      'inset-shadow-indigo-300 hover:bg-indigo-300 dark:inset-shadow-indigo-700 dark:hover:bg-indigo-600',
    disabled:
      'border-indigo-200 bg-indigo-100 text-indigo-300 dark:border-indigo-700 dark:bg-indigo-800 dark:text-indigo-500',
    ghost:
      'border-indigo-300/0 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-500 dark:text-indigo-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-600 dark:hover:text-indigo-100',
    ghostDisabled: 'border-indigo-300/0 text-indigo-300 dark:text-indigo-500',
  },
  stone: {
    normal:
      'border-stone-300 bg-stone-200 text-stone-800 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-300',
    hover:
      'hover:bg-stone-100 dark:hover:bg-stone-600 dark:hover:text-stone-100',
    pressed:
      'bg-stone-300 border-stone-400 text-stone-800 hover:text-stone-600 dark:bg-stone-600 dark:border-stone-500 dark:text-stone-300 dark:hover:text-stone-100',
    togglePressed:
      'bg-stone-100 border-stone-400 text-stone-800 shadow-stone-400 hover:bg-stone-200 dark:border-stone-500 dark:bg-stone-800 dark:text-stone-300 dark:shadow-stone-600 dark:hover:bg-stone-700',
    deepPressed:
      'inset-shadow-stone-300 hover:bg-stone-300 dark:inset-shadow-stone-700 dark:hover:bg-stone-600',
    disabled:
      'border-stone-200 bg-stone-100 text-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-500',
    ghost:
      'border-stone-300/0 text-stone-700 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-500 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:bg-stone-600 dark:hover:text-stone-100',
    ghostDisabled: 'border-stone-300/0 text-stone-300 dark:text-stone-500',
  },
};

export const Button = ({
  children,
  onClick,
  onSubmit,
  onKeyDown,
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
  inert = false,
  ref,
  ...props
}: ButtonProps) => {
  const handleClick = (e: MouseEvent) => {
    if (disabled || inert) return;
    if (type === 'submit' && onSubmit) {
      onSubmit(e);
    } else if (onClick) {
      onClick(e);
    }
  };

  const baseStyle = {
    common: `flex justify-center items-center rounded-sm transition-colors border ${disabled ? 'cursor-not-allowed' : inert ? 'cursor-default' : 'cursor-pointer'}`,
    normal: 'inset-shadow-xs inset-shadow-white dark:inset-shadow-white/10',
    disabled: 'opacity-60',
    ghost:
      'hover:inset-shadow-xs hover:inset-shadow-white dark:hover:inset-shadow-white/10',
    pressed:
      'inset-shadow-xs inset-shadow-white dark:inset-shadow-white/10 shadow-sm',
    togglePressed:
      'inset-shadow-xs inset-shadow-white dark:inset-shadow-white/10 shadow-sm',
    deepPressed:
      'shadow-md inset-shadow-sm shadow-white dark:shadow-slate-900 border-slate-300 dark:border-slate-600',
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
          ? `${neutralDisabled ? colorStyles.slate.ghostDisabled : colorConfig.ghostDisabled} ${isPressed ? colorConfig.pressed : ''}`
          : `${baseStyle.disabled} ${isPressed ? `${baseStyle.pressed} ${colorConfig.pressed}` : ''} ${neutralDisabled ? colorStyles.slate.disabled : colorConfig.disabled}`;
    }
  } else if (inert) {
    // Inert state: normal styling but no hover effects
    switch (variant) {
      case 'toggle':
        styleClasses = isPressed
          ? `${baseStyle.togglePressed} ${colorConfig.togglePressed}`
          : `${baseStyle.normal} ${colorConfig.normal}`;
        break;

      case 'deep-toggle':
        styleClasses = isPressed
          ? `border-white bg-white ${baseStyle.pressed}`
          : `${baseStyle.deepPressed} ${colorConfig.deepPressed}`;
        break;

      case 'ghost':
        styleClasses = `${colorConfig.ghost
          .split(' ')
          .filter((cls) => !cls.startsWith('hover:'))
          .join(
            ' ',
          )} ${isPressed ? `${baseStyle.pressed} ${colorConfig.pressed}` : ''}`;
        break;

      default:
        styleClasses = `${baseStyle.normal} ${isPressed ? colorConfig.pressed : colorConfig.normal}`;
        break;
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
        styleClasses = `${baseStyle.ghost} ${colorConfig.ghost} ${isPressed ? `${baseStyle.pressed} ${colorConfig.pressed}` : ''}`;
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
      onKeyDown={onKeyDown}
      disabled={disabled}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={allClasses}
      title={title}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
};
