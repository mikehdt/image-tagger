'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import {
  loadAllAssets,
  selectIoMessage,
  selectLoadProgress,
} from '../store/assets';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export const Error = () => {
  const dispatch = useAppDispatch();
  const errorMessage = useAppSelector(selectIoMessage);
  const loadProgress = useAppSelector(selectLoadProgress);

  const handleRetry = () => {
    dispatch(loadAllAssets({ maintainIoState: true }));
  };

  return (
    <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
      <ExclamationTriangleIcon className="w-full max-w-80 text-slate-500" />

      <h1 className="mt-4 mb-4 w-full text-xl text-slate-500">
        An I/O error occurred
      </h1>

      <p className="mt-4 w-full">
        <button
          onClick={handleRetry}
          className="min-w-30 cursor-pointer rounded bg-sky-500 px-4 py-2 text-white transition-colors hover:bg-sky-700"
        >
          Retry
        </button>
      </p>

      {errorMessage && (
        <p className="mt-2 w-full text-rose-500">{String(errorMessage)}</p>
      )}

      {loadProgress && (
        <p className="mt-2 w-full text-xs text-slate-500 tabular-nums">
          {loadProgress.completed} / {loadProgress.total}
        </p>
      )}
    </div>
  );
};
