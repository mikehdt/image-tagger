import type { ReactNode } from 'react';

type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';
type ProgressBarColor =
  | 'sky'
  | 'indigo'
  | 'teal'
  | 'green'
  | 'red'
  | 'amber';

type ProgressBarProps = {
  /** Current progress value */
  value: number;
  /** Maximum progress value */
  max: number;
  size?: ProgressBarSize;
  color?: ProgressBarColor;
  /** Pulsing bar for unknown progress (ignores value/max) */
  indeterminate?: boolean;
  /** Step positions to mark on the bar (values between 0 and max) */
  marks?: number[];
  /** Content rendered inside the fill (useful at lg size for percentage text) */
  children?: ReactNode;
  className?: string;
};

const trackClasses: Record<ProgressBarSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-5',
};

const fillColorClasses: Record<ProgressBarColor, string> = {
  sky: 'bg-linear-to-t from-sky-600 to-sky-500 inset-shadow-xs inset-shadow-sky-300',
  indigo:
    'bg-linear-to-t from-indigo-600 to-indigo-500 inset-shadow-xs inset-shadow-indigo-300',
  teal: 'bg-linear-to-t from-teal-600 to-teal-500 inset-shadow-xs inset-shadow-teal-300',
  green:
    'bg-linear-to-t from-green-600 to-green-500 inset-shadow-xs inset-shadow-green-300',
  red: 'bg-linear-to-t from-red-600 to-red-500 inset-shadow-xs inset-shadow-red-300',
  amber:
    'bg-linear-to-t from-amber-600 to-amber-500 inset-shadow-xs inset-shadow-amber-300',
};

export function ProgressBar({
  value,
  max,
  size = 'md',
  color = 'sky',
  indeterminate = false,
  marks,
  children,
  className = '',
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-linear-to-t from-slate-200 to-slate-300 inset-shadow-xs inset-shadow-slate-400 dark:from-slate-700 dark:to-slate-600 dark:inset-shadow-slate-800 ${trackClasses[size]} ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`h-full transition-all duration-300 ease-out ${fillColorClasses[color]} ${
          indeterminate ? 'animate-progress-indeterminate' : ''
        } ${children ? 'flex items-center justify-end' : ''}`}
        style={
          indeterminate ? { width: '40%' } : { width: `${pct}%` }
        }
      >
        {children}
      </div>

      {marks?.map((pos) => (
        <div
          key={pos}
          className="absolute top-0 h-full w-px bg-white/50 dark:bg-white/30"
          style={{ left: `${max > 0 ? (pos / max) * 100 : 0}%` }}
        />
      ))}
    </div>
  );
}
