import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { Project } from '@/app/components/project-list/types';
import { useToast } from '@/app/components/shared/toast/hooks/use-toast';
import { resetAssetsState } from '@/app/store/assets';
import { clearFilters } from '@/app/store/filters';
import { useAppDispatch } from '@/app/store/hooks';
import { resetProjectState, setProjectInfo } from '@/app/store/project';
import { clearSelection } from '@/app/store/selection';
import { getProjectList } from '@/app/utils/project-actions';
import { ThemeMode, useTheme } from '@/app/utils/use-theme';

import { useEditProject } from './use-edit-project';

// Inline configuration check function to avoid import issues
const checkIfUsingDefaultProject = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) return true; // Default to true if API fails
    const config = await response.json();
    const projectsFolder = config.projectsFolder || 'public/assets';
    return projectsFolder === 'public/assets';
  } catch (error) {
    console.warn('Failed to check project config:', error);
    return true; // Default to true if check fails
  }
};

const themeOrder: ThemeMode[] = ['light', 'dark', 'auto'];

export const useProjectList = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const { theme, setTheme } = useTheme();
  const { showErrorToast } = useToast();

  const editActions = useEditProject(setProjects, { onError: showErrorToast });

  const handleCycleTheme = useCallback(() => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  }, [theme, setTheme]);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we should still be showing the project list
      const isDefault = await checkIfUsingDefaultProject();

      // Check for configuration mode mismatch
      const storedConfigMode = sessionStorage.getItem('configMode');
      const currentConfigMode = isDefault ? 'default' : 'custom';

      if (storedConfigMode && storedConfigMode !== currentConfigMode) {
        // Configuration has changed from custom to default, redirect to default assets
        console.warn(
          `[ProjectList] Config mode mismatch ${storedConfigMode} → ${currentConfigMode}, redirecting to default assets`,
        );
        sessionStorage.removeItem('selectedProject');
        sessionStorage.removeItem('selectedProjectTitle');
        sessionStorage.removeItem('selectedProjectThumbnail');
        sessionStorage.removeItem('configMode');
        router.replace('/1');
        return;
      }

      if (isDefault) {
        // If we're in default mode but somehow on the project list, redirect to default assets
        console.warn(
          '[ProjectList] In default mode but on project list, redirecting to default assets',
        );
        router.replace('/1');
        return;
      }

      // Call server action to get project list (always include hidden, but not private)
      const projectData = await getProjectList();
      setProjects(projectData.filter((project) => project?.imageCount));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Clear all old project data when returning to project selection
    dispatch(resetAssetsState());
    dispatch(resetProjectState());
    dispatch(clearFilters());
    dispatch(clearSelection());
    sessionStorage.removeItem('selectedProject');
    sessionStorage.removeItem('selectedProjectTitle');
    sessionStorage.removeItem('selectedProjectThumbnail');
    sessionStorage.removeItem('selectedProjectThumbnailVersion');

    // Then load the project list
    loadProjects();
  }, [loadProjects, dispatch]);

  const handleProjectSelect = useCallback(
    (projectPath: string) => {
      // Find the selected project to get its title
      const selectedProject = projects.find(
        (project) => project.path === projectPath,
      );
      // Extract folder name from path (e.g., "dev" from "public/assets/dev")
      const folderName = projectPath.split(/[/\\]/).pop() || 'Unknown Project';
      const projectTitle = selectedProject?.title || folderName;

      // Set project information in Redux (use title for display)
      dispatch(
        setProjectInfo({
          name: projectTitle,
          path: projectPath,
          folderName,
          thumbnail: selectedProject?.thumbnail,
        }),
      );

      // Store just the project folder name (not the full path) for session persistence
      sessionStorage.setItem('selectedProject', folderName);
      sessionStorage.setItem('selectedProjectTitle', projectTitle);
      if (selectedProject?.thumbnail) {
        sessionStorage.setItem('selectedProjectThumbnail', selectedProject.thumbnail);
      } else {
        sessionStorage.removeItem('selectedProjectThumbnail');
      }
      if (selectedProject?.thumbnailVersion) {
        sessionStorage.setItem(
          'selectedProjectThumbnailVersion',
          String(selectedProject.thumbnailVersion),
        );
      } else {
        sessionStorage.removeItem('selectedProjectThumbnailVersion');
      }
      router.push('/1');
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
    theme,
    handleCycleTheme,
    handleProjectSelect,
    loadProjects,
    ...editActions,
  };
};
