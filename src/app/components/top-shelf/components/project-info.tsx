import { CubeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { memo } from 'react';

import {
  selectProjectName,
  selectProjectPath,
  selectProjectThumbnail,
} from '@/app/store/assets';
import { useAppSelector } from '@/app/store/hooks';

const ProjectInfoComponent = () => {
  const projectName = useAppSelector(selectProjectName);
  const projectPath = useAppSelector(selectProjectPath);
  const projectThumbnail = useAppSelector(selectProjectThumbnail);

  if (!projectName || !projectPath) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {projectThumbnail ? (
        <Image
          src={`/api/images/${encodeURIComponent(projectThumbnail)}?projectPath=${encodeURIComponent(projectPath)}&isProjectInfo=true`}
          alt={`${projectName} thumbnail`}
          width={20}
          height={20}
          className="h-6 w-6 rounded-full object-cover"
        />
      ) : (
        <CubeIcon className="h-4 w-4 p-1 text-slate-500" />
      )}
      <span className="font-medium text-slate-700">{projectName}</span>
    </div>
  );
};

export const ProjectInfo = memo(ProjectInfoComponent);
