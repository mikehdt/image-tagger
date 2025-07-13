'use client';

import { FolderIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '../components/shared/button';
import { resetAssetsState, setProjectInfo } from '../store/assets';
import { clearFilters } from '../store/filters';
import { useAppDispatch } from '../store/hooks';
import { clearSelection } from '../store/selection';
import { getProjectList } from '../utils/project-actions';

type Project = {
  name: string;
  path: string;
  imageCount?: number;
};

export const ProjectList = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Call server action to get project list
      const projectData = await getProjectList();
      setProjects(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear all old project data when returning to project selection
    dispatch(resetAssetsState());
    dispatch(clearFilters());
    dispatch(clearSelection());
    sessionStorage.removeItem('selectedProject');

    // Then load the project list
    loadProjects();
  }, [loadProjects, dispatch]);
  const handleProjectSelect = useCallback(
    (projectPath: string) => {
      // Extract project name from path (last folder in the path)
      const projectName = projectPath.split(/[/\\]/).pop() || 'Unknown Project';

      // Set project information in Redux
      dispatch(setProjectInfo({ name: projectName, path: projectPath }));

      // Store the selected project path and navigate to page 1
      sessionStorage.setItem('selectedProject', projectPath);
      router.push('/1');
    },
    [router, dispatch],
  );

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
        <FolderIcon className="w-full max-w-80 text-slate-500" />
        <h1 className="mt-4 w-full text-xl text-slate-500">
          Loading projects&hellip;
        </h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
        <FolderIcon className="w-full max-w-80 text-slate-500" />
        <h1 className="mt-4 mb-4 w-full text-xl text-slate-500">
          Error loading projects
        </h1>
        <p className="mt-4 w-full text-rose-500">{error}</p>
        <p className="mt-4 flex w-full justify-center">
          <Button onClick={loadProjects} size="mediumWide">
            Retry
          </Button>
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
        <FolderIcon className="w-full max-w-80 text-slate-500" />
        <h1 className="mt-4 mb-4 w-full text-xl text-slate-500">
          No projects found
        </h1>
        <p className="mt-4 w-full text-slate-600">
          No project folders were found in the configured projects directory
        </p>
        <p className="mt-4 flex w-full justify-center">
          <Button onClick={loadProjects} size="mediumWide">
            Refresh
          </Button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-120 min-w-80 flex-col items-center px-4 py-20">
      <FolderIcon className="mb-6 h-24 w-24 text-slate-500" />
      <h1 className="mb-8 text-2xl text-slate-700">Select a Project</h1>

      <div className="w-full max-w-md space-y-3">
        {projects.map((project) => (
          <Button
            key={project.path}
            onClick={() => handleProjectSelect(project.path)}
            size="large"
            className="w-full justify-start p-4 text-left"
          >
            <div className="flex w-full items-center">
              <FolderIcon className="mr-3 h-5 w-5 text-slate-500" />
              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="truncate font-medium text-slate-900">
                  {project.name}
                </div>
                {project.imageCount !== undefined && (
                  <div className="text-sm text-slate-500 tabular-nums">
                    {project.imageCount} images
                  </div>
                )}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
