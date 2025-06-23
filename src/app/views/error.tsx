'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { selectIoMessage, selectLoadProgress } from '../store/assets';
import { useAppSelector } from '../store/hooks';

export const Error = () => {
  const errorMessage = useAppSelector(selectIoMessage);
  const loadProgress = useAppSelector(selectLoadProgress);

  return (
    <div className="mx-auto w-1/4 py-20 text-center">
      <p>
        <ExclamationTriangleIcon />
      </p>
      <h1 className="mt-4 mb-4 w-full text-xl">An I/O error occurred</h1>
      {errorMessage && (
        <p className="mb-2 text-red-600">{String(errorMessage)}</p>
      )}
      {loadProgress && (
        <p className="mb-2 text-slate-600 tabular-nums">
          Progress: {loadProgress.completed} / {loadProgress.total}
        </p>
      )}
    </div>
  );
};
