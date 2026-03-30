'use client';

import { ArrowLeftCircleIcon, CpuIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '../components/shared/button';
import { useAppSelector } from '../store/hooks';
import { selectProjectName } from '../store/project';

export default function TrainingPage() {
  const router = useRouter();
  const projectName = useAppSelector(selectProjectName);
  const [hasProject, setHasProject] = useState(false);

  useEffect(() => {
    // Check if a project is selected
    const selectedProject = sessionStorage.getItem('selectedProject');
    if (!selectedProject) {
      router.replace('/');
      return;
    }
    setHasProject(true);
  }, [router]);

  if (!hasProject) return null;

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
