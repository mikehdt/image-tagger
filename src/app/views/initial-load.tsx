'use client';

import { CubeIcon } from '@heroicons/react/24/outline';

import { selectLoadProgress, selectProjectName } from '../store/assets';
import { useAppSelector } from '../store/hooks';

export const InitialLoad = () => {
  const loadProgress = useAppSelector(selectLoadProgress);
  const projectName = useAppSelector(selectProjectName);

  // Calculate progress percentage safely
  const progressPercentage =
    loadProgress && loadProgress.total > 0
      ? Math.round((loadProgress.completed / loadProgress.total) * 100)
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
      <CubeIcon className="w-full max-w-80 text-slate-500" />

      <h1 className="mt-4 w-full text-xl text-slate-500">
        Loading{projectName ? ` ${projectName}` : ''}&hellip;
      </h1>

      {loadProgress ? (
        <div className="mt-4 w-full">
          <div className="relative h-5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="flex h-5 items-center justify-end rounded-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage >= 10 && (
                <span className="pr-2 text-xs font-medium text-white tabular-nums">
                  {progressPercentage}%
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center text-xs font-medium text-slate-500 tabular-nums">
            {loadProgress.total > 0 ? (
              <p>
                {loadProgress.completed} / {loadProgress.total}
              </p>
            ) : (
              <p>Preparing&hellip;</p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-slate-600">Gathering image assets&hellip;</p>
      )}
    </div>
  );
};
