import type { ReactNode } from 'react';

type InputTraySize = 'sm' | 'md';

type InputTrayProps = {
  children: ReactNode;
  size?: InputTraySize;
  className?: string;
};

const sizeClasses: Record<InputTraySize, string> = {
  sm: '',
  md: 'p-0.5',
};

export function InputTray({
  children,
  size = 'sm',
  className = '',
}: InputTrayProps) {
  return (
    <div
      className={`flex items-center rounded-sm bg-slate-200 inset-shadow-xs inset-shadow-slate-300 dark:bg-slate-800/30 dark:inset-shadow-slate-900 ${sizeClasses[size]} ${className}`}
    >
      {children}
    </div>
  );
}
