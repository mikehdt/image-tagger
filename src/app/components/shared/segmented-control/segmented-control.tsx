import { ReactNode } from 'react';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type SegmentedControlSize = 'sm' | 'md' | 'xl';

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  size?: SegmentedControlSize;
  className?: string;
};

const sizeClasses: Record<
  SegmentedControlSize,
  { container: string; button: string }
> = {
  sm: {
    container: 'text-xs',
    button: 'px-2 [&_svg]:w-4',
  },
  md: {
    container: 'w-full text-sm',
    button: 'px-2 py-1 [&_svg]:w-4',
  },
  xl: {
    container: 'w-full text-sm font-medium',
    button: 'px-3 py-1.5 [&_svg]:w-4',
  },
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={`flex items-center rounded-sm bg-slate-100 shadow-md inset-shadow-xs shadow-white inset-shadow-slate-300 dark:border dark:border-slate-600 dark:bg-slate-700 dark:shadow-slate-600/50 dark:inset-shadow-slate-800 ${sizes.container} ${disabled ? 'pointer-events-none opacity-40' : ''} ${className}`}
    >
      {options.map((option, index) => {
        const isSelected = value === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        const roundedClasses = isFirst
          ? 'rounded-l-sm'
          : isLast
            ? 'rounded-r-sm'
            : '';

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            title={option.label}
            className={`flex flex-auto cursor-pointer items-center justify-center gap-1 transition-colors ${sizes.button} ${roundedClasses} ${
              isSelected
                ? 'z-10 bg-white shadow-sm shadow-slate-300 dark:bg-slate-500 dark:inset-shadow-xs dark:shadow-slate-800 dark:inset-shadow-slate-400'
                : 'text-slate-600 hover:bg-slate-300 hover:text-slate-500 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
