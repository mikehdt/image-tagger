'use client';

import { FolderIcon, StarIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '../components/shared/button';
import { resetAssetsState } from '../store/assets';
import { clearFilters } from '../store/filters';
import { useAppDispatch } from '../store/hooks';
import { resetProjectState, setProjectInfo } from '../store/project';
import { clearSelection } from '../store/selection';
import { getProjectList } from '../utils/project-actions';

type Project = {
  name: string;
  path: string;
  imageCount?: number;
  title?: string;
  color?: 'slate' | 'rose' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'stone';
  thumbnail?: string;
  featured?: boolean;
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
      setProjects(projectData.filter((project) => project?.imageCount));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear all old project data when returning to project selection
    dispatch(resetAssetsState());
    dispatch(resetProjectState());
    dispatch(clearFilters());
    dispatch(clearSelection());
    sessionStorage.removeItem('selectedProject');
    sessionStorage.removeItem('selectedProjectTitle');
    sessionStorage.removeItem('selectedProjectThumbnail');

    // Then load the project list
    loadProjects();
  }, [loadProjects, dispatch]);
  const handleProjectSelect = useCallback(
    (projectPath: string) => {
      // Find the selected project to get its title
      const selectedProject = projects.find(
        (project) => project.path === projectPath,
      );
      const projectName = projectPath.split(/[/\\]/).pop() || 'Unknown Project';
      const projectTitle = selectedProject?.title || projectName;

      // Set project information in Redux (use title for display)
      dispatch(
        setProjectInfo({
          name: projectTitle,
          path: projectPath,
          thumbnail: selectedProject?.thumbnail,
        }),
      );

      // Store the selected project path, title, and thumbnail for session persistence
      sessionStorage.setItem('selectedProject', projectPath);
      sessionStorage.setItem('selectedProjectTitle', projectTitle);
      if (selectedProject?.thumbnail) {
        sessionStorage.setItem(
          'selectedProjectThumbnail',
          selectedProject.thumbnail,
        );
      } else {
        sessionStorage.removeItem('selectedProjectThumbnail');
      }
      router.push('/1');
    },
    [router, dispatch, projects],
  );

  // Separate projects into featured and regular
  const featuredProjects = projects.filter((project) => project.featured);
  const regularProjects = projects.filter((project) => !project.featured);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 text-center">
        <FolderIcon className="w-full max-w-80 text-slate-500" />
        <h1 className="mt-4 w-full text-xl text-slate-500">
          Loading projects&hellip;
        </h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 text-center">
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
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 text-center">
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
    <div className="mx-auto flex w-full max-w-120 min-w-80 flex-col items-center px-4">
      <FolderIcon className="mb-6 h-24 w-24 text-slate-500" />

      <h1 className="mb-8 text-2xl text-slate-700">Select a Project</h1>

      <div className="w-full max-w-md">
        {featuredProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-2 flex items-center border-b border-b-slate-200 pb-1 text-lg font-semibold text-slate-700">
              <span className="mr-2 flex items-center justify-center rounded-full border border-amber-300 bg-amber-200 p-1.5 text-amber-700 inset-shadow-sm inset-shadow-amber-50">
                <StarIcon className="w-4" />
              </span>
              Featured Projects
            </h2>
            <div className="flex flex-wrap gap-3">
              {featuredProjects.map((project) => (
                <Button
                  key={project.path}
                  onClick={() => handleProjectSelect(project.path)}
                  size="large"
                  color={project.color || 'slate'}
                  className="w-full justify-start p-4 text-left"
                >
                  <div className="flex w-full items-center">
                    <span className="mr-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
                      {project.thumbnail ? (
                        <Image
                          src={`/api/images/${encodeURIComponent(project.thumbnail)}?projectPath=${encodeURIComponent(project.path)}&isProjectInfo=true`}
                          alt={project.title || project.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FolderIcon className="h-5 w-5 text-slate-500" />
                      )}
                    </span>

                    <div className="flex min-w-0 flex-1 items-center justify-between">
                      <div className="flex flex-wrap font-medium text-slate-900">
                        <span className="w-full truncate">
                          {project.title || project.name}
                        </span>

                        <span className="w-full text-xs text-black/40">
                          {project.name}
                        </span>
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
        )}

        {regularProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-2 flex items-center border-b border-b-slate-200 pb-1 text-lg font-semibold text-slate-700">
              <span className="mr-2 flex items-center justify-center rounded-full border border-slate-300 bg-slate-200 p-1.5 text-slate-700 inset-shadow-sm inset-shadow-slate-50">
                <FolderIcon className="w-4" />
              </span>
              {featuredProjects.length > 0 ? 'Other Projects' : 'All Projects'}
            </h2>
            <div className="flex flex-wrap gap-3">
              {regularProjects.map((project) => (
                <Button
                  key={project.path}
                  onClick={() => handleProjectSelect(project.path)}
                  size="large"
                  color={project.color || 'slate'}
                  className="w-full justify-start p-4 text-left"
                >
                  <div className="flex w-full items-center">
                    <span className="mr-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
                      {project.thumbnail ? (
                        <Image
                          src={`/api/images/${encodeURIComponent(project.thumbnail)}?projectPath=${encodeURIComponent(project.path)}&isProjectInfo=true`}
                          alt={project.title || project.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FolderIcon className="h-5 w-5 text-slate-500" />
                      )}
                    </span>

                    <div className="flex min-w-0 flex-1 items-center justify-between">
                      <div className="flex flex-wrap font-medium text-slate-900">
                        <span className="w-full truncate">
                          {project.title || project.name}
                        </span>

                        <span className="w-full text-xs text-black/40">
                          {project.name}
                        </span>
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
        )}
      </div>

      <Button onClick={loadProjects} size="mediumWide">
        Refresh Project List
      </Button>

      <p className="mt-4 text-sm text-slate-500">
        Note: project folders with no images are not shown
      </p>
    </div>
  );
};
