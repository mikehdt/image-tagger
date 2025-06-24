'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

import { selectIoMessage, selectLoadProgress } from '../store/assets';
import { useAppSelector } from '../store/hooks';

export const Error = () => {
  const router = useRouter();
  const errorMessage = useAppSelector(selectIoMessage);
  const loadProgress = useAppSelector(selectLoadProgress);

  const handleRetry = () => {
    router.push('/');
  };

  return (
    <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
      <ExclamationTriangleIcon className="w-full max-w-80 text-slate-500" />

      <h1 className="mt-4 mb-4 w-full text-xl">An I/O error occurred</h1>
      {errorMessage && (
        <p className="mb-2 text-red-600">{String(errorMessage)}</p>
      )}
      {loadProgress && (
        <p className="mb-2 text-slate-600 tabular-nums">
          Progress: {loadProgress.completed} / {loadProgress.total}
        </p>
      )}
      <p className="mt-4">
        <button
          onClick={handleRetry}
          className="min-w-30 cursor-pointer rounded bg-sky-500 px-4 py-2 text-white transition-colors hover:bg-sky-700"
        >
          Retry
        </button>
      </p>
    </div>
  );
};
