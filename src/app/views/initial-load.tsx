'use client';

import { CubeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

import { selectLoadProgress } from '../store/assets';
import { useAppSelector } from '../store/hooks';
import {
  selectProjectName,
  selectProjectPath,
  selectProjectThumbnail,
} from '../store/project';

export const InitialLoad = () => {
  const loadProgress = useAppSelector(selectLoadProgress);
  const projectName = useAppSelector(selectProjectName);
  const projectPath = useAppSelector(selectProjectPath);
  const projectThumbnail = useAppSelector(selectProjectThumbnail);

  // Calculate progress percentage safely
  const progressPercentage =
    loadProgress && loadProgress.total > 0
      ? Math.round((loadProgress.completed / loadProgress.total) * 100)
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
      <div className="relative">
        {projectThumbnail && projectPath ? (
          <span className="absolute top-0 right-0 bottom-0 left-0 m-auto flex h-21 w-21 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white">
            <Image
              src={`/api/images/${encodeURIComponent(projectThumbnail)}?projectPath=${encodeURIComponent(projectPath)}&isProjectInfo=true`}
              alt={projectName || 'Project'}
              width={80}
              height={80}
              priority
              className="h-full w-full object-cover"
            />
          </span>
        ) : null}

        <CubeIcon className="w-full max-w-80 text-slate-500" />
      </div>

      <h1 className="mt-4 w-full text-xl text-slate-500">
        Loading{projectName ? ` ${projectName}` : ''}&hellip;
      </h1>

      {loadProgress ? (
        <div className="mt-4 w-full">
          <div className="relative h-5 w-full overflow-hidden rounded-full bg-linear-to-t from-slate-200 to-slate-300 inset-shadow-xs inset-shadow-slate-400">
            <div
              className="flex h-5 items-center justify-end rounded-full bg-linear-to-t from-emerald-600 to-emerald-500 inset-shadow-xs inset-shadow-emerald-300 transition-all duration-300 ease-out"
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
