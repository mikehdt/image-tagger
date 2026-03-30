'use client';

import { ArrowLeftCircleIcon, CpuIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '../../components/shared/button';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectProjectFolderName,
  selectProjectName,
  setProjectInfo,
} from '../../store/project';

export default function TrainingPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const project = decodeURIComponent(params.project as string);
  const projectName = useAppSelector(selectProjectName);
  const loadedProject = useAppSelector(selectProjectFolderName);

  useEffect(() => {
    if (!project) {
      router.replace('/');
      return;
    }

    if (loadedProject !== project) {
      dispatch(
        setProjectInfo({
          name: project,
          path: project,
          folderName: project,
        }),
      );
    }
  }, [project, loadedProject, dispatch, router]);

  if (!project) return null;

  return (
    <div className="mx-auto flex w-full max-w-160 min-w-80 flex-col items-center px-4 py-20 text-center">
      <CpuIcon className="h-24 w-24 text-slate-400 dark:text-slate-500" />

      <h1 className="mt-6 text-2xl font-semibold text-(--foreground)">
        Training
      </h1>

      {projectName && (
        <p className="mt-2 text-sm text-slate-500">{projectName}</p>
      )}

      <p className="mt-4 max-w-md text-sm text-slate-400 dark:text-slate-500">
        Training configuration will go here. This feature is under development.
      </p>

      <div className="mt-8">
        <Button onClick={() => router.push('/')} size="mediumWide">
          <ArrowLeftCircleIcon className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    </div>
  );
}
