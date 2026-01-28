'use client';

import {
  ComputerDesktopIcon,
  FolderIcon,
  MoonIcon,
  StarIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { useMemo } from 'react';

import {
  ProjectItem,
  type ProjectItemActions,
} from '@/app/components/project-list/project-item';
import { Button } from '@/app/components/shared/button';
import { Checkbox } from '@/app/components/shared/checkbox';
import { ThemeMode } from '@/app/utils/use-theme';

import { useProjectList } from './hooks/use-project-list';

const themeConfig: Record<ThemeMode, { icon: React.ReactNode; label: string }> =
  {
    light: { icon: <SunIcon className="w-4" />, label: 'Light' },
    dark: { icon: <MoonIcon className="w-4" />, label: 'Dark' },
    auto: { icon: <ComputerDesktopIcon className="w-4" />, label: 'Auto' },
  };

export const ProjectList = () => {
  const {
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
    editingProject,
    editTitle,
    editColor,
    editHidden,
    setEditTitle,
    setEditColor,
    setEditHidden,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleToggleFeatured,
    handleThumbnailSelect,
    handleThumbnailRemove,
  } = useProjectList();

  const isAnyEditing = editingProject !== null;

  const itemActions: ProjectItemActions = useMemo(
    () => ({
      editColor,
      editTitle,
      editHidden,
      showHidden,
      onSelect: handleProjectSelect,
      onStartEdit: handleStartEdit,
      onCancelEdit: handleCancelEdit,
      onSaveEdit: handleSaveEdit,
      onTitleChange: setEditTitle,
      onColorChange: setEditColor,
      onHiddenChange: setEditHidden,
      onToggleFeatured: handleToggleFeatured,
      onThumbnailSelect: handleThumbnailSelect,
      onThumbnailRemove: handleThumbnailRemove,
    }),
    [
      editColor,
      editTitle,
      editHidden,
      showHidden,
      handleProjectSelect,
      handleStartEdit,
      handleCancelEdit,
      handleSaveEdit,
      setEditTitle,
      setEditColor,
      setEditHidden,
      handleToggleFeatured,
      handleThumbnailSelect,
      handleThumbnailRemove,
    ],
  );

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 text-center">
        <FolderIcon className="w-full max-w-80 text-slate-500 dark:text-slate-400" />
        <h1 className="mt-4 w-full text-xl text-slate-500 dark:text-slate-400">
          Loading projects&hellip;
        </h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 text-center">
        <FolderIcon className="w-full max-w-80 text-slate-500 dark:text-slate-400" />
        <h1 className="mt-4 mb-4 w-full text-xl text-slate-500 dark:text-slate-400">
          Error loading projects
        </h1>
        <p className="mt-4 w-full text-rose-500 dark:text-rose-400">{error}</p>
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
        <FolderIcon className="w-full max-w-80 text-slate-500 dark:text-slate-400" />
        <h1 className="mt-4 mb-4 w-full text-xl text-slate-500 dark:text-slate-400">
          No projects found
        </h1>
        <p className="mt-4 w-full text-slate-600 dark:text-slate-400">
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
      <FolderIcon className="mb-6 h-24 w-24 text-slate-500 dark:text-slate-400" />

      <h1 className="mb-8 text-2xl text-slate-700 dark:text-slate-200">
        Select a Project
      </h1>

      <div className="w-full max-w-md">
        {featuredProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-2 flex items-center border-b border-b-slate-200 pb-1 text-lg font-semibold text-slate-700 dark:border-b-slate-600 dark:text-slate-200">
              <span className="mr-2 flex items-center justify-center rounded-full border border-amber-300 bg-amber-200 p-1.5 text-amber-700 inset-shadow-sm inset-shadow-amber-50 dark:border-amber-500 dark:bg-amber-700 dark:text-amber-200 dark:inset-shadow-amber-900">
                <StarIcon className="w-4" />
              </span>
              Featured Projects
            </h2>
            <div className="flex flex-wrap gap-3">
              {featuredProjects.map((project) => (
                <ProjectItem
                  key={project.path}
                  project={project}
                  isEditing={editingProject === project.name}
                  isDisabled={isAnyEditing && editingProject !== project.name}
                  actions={itemActions}
                />
              ))}
            </div>
          </div>
        )}

        {regularProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-2 flex items-center border-b border-b-slate-200 pb-1 text-lg font-semibold text-slate-700 dark:border-b-slate-600 dark:text-slate-200">
              <span className="mr-2 flex items-center justify-center rounded-full border border-slate-300 bg-slate-200 p-1.5 text-slate-700 inset-shadow-sm inset-shadow-slate-50 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-200 dark:inset-shadow-slate-800">
                <FolderIcon className="w-4" />
              </span>
              {featuredProjects.length > 0 ? 'Other Projects' : 'All Projects'}
            </h2>
            <div className="flex flex-wrap gap-3">
              {regularProjects.map((project) => (
                <ProjectItem
                  key={project.path}
                  project={project}
                  isEditing={editingProject === project.name}
                  isDisabled={isAnyEditing && editingProject !== project.name}
                  actions={itemActions}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 mb-4 flex items-center gap-6">
        <Checkbox
          isSelected={showHidden}
          onChange={() => setShowHidden(!showHidden)}
          label="Show hidden projects"
          size="small"
        />

        <button
          type="button"
          onClick={handleCycleTheme}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          title={`Theme: ${themeConfig[theme].label}`}
        >
          {themeConfig[theme].icon}
          <span>{themeConfig[theme].label} Theme</span>
        </button>
      </div>

      <Button onClick={loadProjects} size="mediumWide">
        Refresh Project List
      </Button>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Note: project folders with no images are not shown
      </p>
    </div>
  );
};
