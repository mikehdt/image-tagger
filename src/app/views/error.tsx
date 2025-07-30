'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

import { Button } from '../components/shared/button';
import { selectIoMessage, selectLoadProgress } from '../store/assets';
import { useAppSelector } from '../store/hooks';
import { selectProjectName } from '../store/project';

type ErrorProps = { onReload: (_args?: { maintainIoState: boolean }) => void };

export const Error = ({ onReload }: ErrorProps) => {
  const router = useRouter();

  const handleRetry = () => {
    onReload({ maintainIoState: true });
  };

  const handleBackToProjects = () => {
    // Just navigate back - project list will handle clearing state
    router.push('/');
  };

  const errorMessage = useAppSelector(selectIoMessage);
  const loadProgress = useAppSelector(selectLoadProgress);
  const projectName = useAppSelector(selectProjectName);

  return (
    <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
      <ExclamationTriangleIcon className="w-full max-w-80 text-slate-500" />

      <h1 className="mt-4 mb-4 w-full text-xl text-slate-500">
        An I/O error occurred{projectName ? ` loading ${projectName}` : ''}
      </h1>

      <div className="mt-4 flex w-full justify-center gap-3">
        <Button onClick={handleRetry} size="mediumWide">
          Retry
        </Button>
        <Button
          onClick={handleBackToProjects}
          size="mediumWide"
          variant="ghost"
        >
          Back to Projects
        </Button>
      </div>

      {errorMessage ? (
        <p className="mt-4 w-full text-rose-500">{String(errorMessage)}</p>
      ) : null}

      {loadProgress ? (
        <p className="mt-4 w-full text-xs text-slate-500 tabular-nums">
          {loadProgress.completed} / {loadProgress.total}
        </p>
      ) : null}
    </div>
  );
};
