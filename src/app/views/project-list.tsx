'use client';

import { FolderIcon, StarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '../components/shared/button';
import { Checkbox } from '../components/shared/checkbox';
import { resetAssetsState } from '../store/assets';
import { clearFilters } from '../store/filters';
import { useAppDispatch } from '../store/hooks';
import { resetProjectState, setProjectInfo } from '../store/project';
import { clearSelection } from '../store/selection';
import { getProjectList } from '../utils/project-actions';
import { ProjectContent } from './project-content';
import { ProjectIcon } from './project-icon';

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

type Project = {
  name: string;
  path: string;
  imageCount?: number;
  title?: string;
  color?: 'slate' | 'rose' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'stone';
  thumbnail?: string;
  featured?: boolean;
  hidden?: boolean;
  private?: boolean;
};

export const ProjectList = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState<Project['color']>('slate');
  const [editHidden, setEditHidden] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

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

      // Store just the project folder name (not the full path) for session persistence
      sessionStorage.setItem('selectedProject', projectName);
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

  const handleToggleFeatured = useCallback(
    async (projectName: string, currentFeatured: boolean) => {
      try {
        // Optimistically update the UI
        setProjects((prev) =>
          prev.map((project) =>
            project.name === projectName
              ? { ...project, featured: !currentFeatured }
              : project,
          ),
        );

        // Make API call to toggle featured status using main PATCH endpoint
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectName)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ featured: !currentFeatured }),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to update featured status');
        }
      } catch (error) {
        console.error('Error toggling featured status:', error);
        // Revert the optimistic update on error
        setProjects((prev) =>
          prev.map((project) =>
            project.name === projectName
              ? { ...project, featured: currentFeatured }
              : project,
          ),
        );
      }
    },
    [],
  );

  const handleStartEdit = useCallback((project: Project) => {
    setEditingProject(project.name);
    setEditTitle(project.title || '');
    setEditColor(project.color || 'slate');
    setEditHidden(project.hidden || false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingProject(null);
    setEditTitle('');
    setEditColor('slate');
    setEditHidden(false);
  }, []);

  const handleSaveEdit = useCallback(
    async (projectName: string) => {
      try {
        const updates: {
          title?: string;
          color?: Project['color'];
          hidden?: boolean;
        } = {};

        // Always include title - empty string will be removed by API, which is what we want
        updates.title = editTitle.trim();

        // Only include color if it's not the default
        if (editColor && editColor !== 'slate') {
          updates.color = editColor;
        }

        // Include hidden state
        if (editHidden) {
          updates.hidden = editHidden;
        }

        // Make API call to update the project
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectName)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to update project');
        }

        // Update the project in the state
        setProjects((prev) =>
          prev.map((project) =>
            project.name === projectName
              ? {
                  ...project,
                  title: editTitle.trim() ? editTitle.trim() : undefined,
                  color: editColor !== 'slate' ? editColor : undefined,
                  hidden: editHidden ? editHidden : undefined,
                }
              : project,
          ),
        );

        // Exit edit mode
        handleCancelEdit();
      } catch (error) {
        console.error('Error saving project edit:', error);
        // Could add toast notification here
      }
    },
    [editTitle, editColor, editHidden, handleCancelEdit],
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
            Refresh
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
              {featuredProjects.map((project) => {
                const isEditing = editingProject === project.name;
                return (
                  <Button
                    key={project.path}
                    onClick={
                      isEditing
                        ? (e) => e.preventDefault()
                        : () => handleProjectSelect(project.path)
                    }
                    size="large"
                    color={isEditing ? editColor : project.color || 'slate'}
                    className={`group w-full justify-start p-4 text-left ${
                      isEditing ? 'cursor-default' : 'cursor-pointer'
                    } ${showHidden && project.hidden && !isEditing ? 'opacity-50' : ''}`}
                  >
                    <div className="flex w-full items-center">
                      <ProjectIcon
                        project={project}
                        onToggleFeatured={handleToggleFeatured}
                      />

                      <ProjectContent
                        project={project}
                        isEditing={isEditing}
                        editTitle={editTitle}
                        editColor={editColor}
                        editHidden={editHidden}
                        onStartEdit={() => handleStartEdit(project)}
                        onCancelEdit={handleCancelEdit}
                        onSaveEdit={() => handleSaveEdit(project.name)}
                        onTitleChange={setEditTitle}
                        onColorChange={setEditColor}
                        onHiddenChange={setEditHidden}
                      />
                    </div>
                  </Button>
                );
              })}
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
              {regularProjects.map((project) => {
                const isEditing = editingProject === project.name;
                return (
                  <Button
                    key={project.path}
                    onClick={
                      isEditing
                        ? (e) => e.preventDefault()
                        : () => handleProjectSelect(project.path)
                    }
                    size="large"
                    color={isEditing ? editColor : project.color || 'slate'}
                    className={`group w-full justify-start p-4 text-left ${
                      isEditing ? 'cursor-default' : 'cursor-pointer'
                    } ${showHidden && project.hidden && !isEditing ? 'opacity-50' : ''}`}
                  >
                    <div className="flex w-full items-center">
                      <ProjectIcon
                        project={project}
                        onToggleFeatured={handleToggleFeatured}
                      />

                      <ProjectContent
                        project={project}
                        isEditing={isEditing}
                        editTitle={editTitle}
                        editColor={editColor}
                        editHidden={editHidden}
                        onStartEdit={() => handleStartEdit(project)}
                        onCancelEdit={handleCancelEdit}
                        onSaveEdit={() => handleSaveEdit(project.name)}
                        onTitleChange={setEditTitle}
                        onColorChange={setEditColor}
                        onHiddenChange={setEditHidden}
                      />
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 mb-4">
        <Checkbox
          isSelected={showHidden}
          onChange={() => setShowHidden(!showHidden)}
          label="Show hidden projects"
          size="small"
        />
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
