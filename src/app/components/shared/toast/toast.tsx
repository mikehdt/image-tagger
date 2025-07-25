'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Toast as ToastType } from '@/app/store/toasts';

type ToastProps = {
  toast: ToastType;
  onRemove: (id: string) => void;
  duration?: number;
};

export const Toast = ({ toast, onRemove, duration = 3000 }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  // Trigger enter animation after mount
  useEffect(() => {
    // Use requestAnimationFrame to ensure the DOM is ready
    requestAnimationFrame(() => {
      setIsEntering(false);
    });
  }, []);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    // Delay the actual removal to allow exit animation to complete
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match this with the exit animation duration
  }, [onRemove, toast.id]);

  useEffect(() => {
    const timer = setTimeout(handleRemove, duration);
    return () => clearTimeout(timer);
  }, [handleRemove, duration]);

  return (
    <div
      className={`pointer-events-auto mb-3 w-full max-w-sm origin-bottom rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-lg transition-all duration-300 ease-out ${
        isExiting
          ? 'opacity-0'
          : isEntering
            ? 'translate-y-4 scale-95 opacity-0'
            : 'translate-y-0 scale-100 opacity-100'
      }`}
      role="alert"
      aria-live="polite"
    >
      {toast.children}
    </div>
  );
};
