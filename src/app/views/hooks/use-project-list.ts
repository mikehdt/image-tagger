import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { Project } from '@/app/components/project-list/types';
import { useToast } from '@/app/components/shared/toast/hooks/use-toast';
import { resetAssetsState } from '@/app/store/assets';
import { clearFilters } from '@/app/store/filters';
import { useAppDispatch } from '@/app/store/hooks';
import { resetProjectState, setProjectInfo } from '@/app/store/project';
import { clearSelection, clearSelectorCaches } from '@/app/store/selection';
import { getProjectList } from '@/app/utils/project-actions';

import { useEditProject } from './use-edit-project';

export const useProjectList = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const { showErrorToast } = useToast();

  const editActions = useEditProject(setProjects, { onError: showErrorToast });

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Call server action to get project list (always include hidden, but not private)
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
    clearSelectorCaches();

    // Then load the project list
    loadProjects();
  }, [loadProjects, dispatch]);

  const handleProjectSelect = useCallback(
    (projectPath: string) => {
      const selectedProject = projects.find((p) => p.path === projectPath);
      const folderName = projectPath.split(/[/\\]/).pop() || 'Unknown Project';
      const projectTitle = selectedProject?.title || folderName;

      // Set full project info in Redux before navigating — AppProvider won't
      // overwrite this since the folder name will already match
      dispatch(
        setProjectInfo({
          name: projectTitle,
          path: projectPath,
          folderName,
          thumbnail: selectedProject?.thumbnail,
        }),
      );

      router.push(`/tagging/${encodeURIComponent(folderName)}/1`);
    },
    [router, dispatch, projects],
  );

  // Separate projects into featured and regular, filtering out hidden projects unless showHidden is true
  // Always filter out private projects regardless of showHidden state
  const nonPrivateProjects = projects.filter((project) => !project.private);
  const visibleProjects = showHidden
    ? nonPrivateProjects
    : nonPrivateProjects.filter((project) => !project.hidden);
  const featuredProjects = visibleProjects.filter(
    (project) => project.featured,
  );
  const regularProjects = visibleProjects.filter(
    (project) => !project.featured,
  );

  return {
    loading,
    error,
    projects,
    featuredProjects,
    regularProjects,
    showHidden,
    setShowHidden,
    handleProjectSelect,
    loadProjects,
    ...editActions,
  };
};
