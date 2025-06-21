'use client';

import { Loader } from '../components/loader';
import { selectLoadProgress } from '../store/assets';
import { useAppSelector } from '../store/hooks';

export const InitialLoad = () => {
  const loadProgress = useAppSelector(selectLoadProgress);

  return (
    <div className="mx-auto w-1/4 text-center">
      <p>
        <Loader />
      </p>
      <h1 className="mt-4 w-full text-xl">Loading&hellip;</h1>
      {loadProgress ? (
        <p className="mt-2 text-slate-600 tabular-nums">
          {loadProgress.total > 0
            ? `${loadProgress.completed} / ${loadProgress.total}`
            : 'Preparing...'}
        </p>
      ) : (
        <p className="mt-2 text-slate-600">Loading image assets...</p>
      )}
    </div>
  );
};
