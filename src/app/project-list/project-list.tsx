'use client';

import {
  FolderClosedIcon,
  FolderXIcon,
  SettingsIcon,
  SparklesIcon,
  StarIcon,
} from 'lucide-react';
import { useCallback, useId, useMemo, useRef } from 'react';

import {
  ProjectItem,
  type ProjectItemActions,
} from '@/app/components/project-list/project-item';
import { Button } from '@/app/components/shared/button';
import { Checkbox } from '@/app/components/shared/checkbox';
import { Popup, usePopup } from '@/app/components/shared/popup';
import { MenuEditModeSwitcher } from '@/app/components/shared/menu-edit-mode-switcher';
import { MenuThemeSwitcher } from '@/app/components/shared/menu-theme-switcher';
import { openSetupModal } from '@/app/store/auto-tagger';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectTagEditMode,
  selectTheme,
  setTagEditMode,
  setTheme,
  TagEditMode,
  type ThemeMode,
} from '@/app/store/preferences';

import { useProjectList } from './hooks/use-project-list';

export const ProjectList = () => {
  const dispatch = useAppDispatch();
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();
  const settingsPopupId = useId();

  const {
    loading,
    error,
    projects,
    featuredProjects,
    regularProjects,
    showHidden,
    setShowHidden,
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

  const theme = useAppSelector(selectTheme);
  const tagEditMode = useAppSelector(selectTagEditMode);
  const isSettingsOpen = getPopupState(settingsPopupId).isOpen;

  const handleSetTheme = useCallback(
    (mode: ThemeMode) => {
      dispatch(setTheme(mode));
    },
    [dispatch],
  );

  const handleSetTagEditMode = useCallback(
    (mode: TagEditMode) => {
      dispatch(setTagEditMode(mode));
    },
    [dispatch],
  );

  const handleOpenAutoTaggerSetup = useCallback(() => {
    closePopup(settingsPopupId);
    dispatch(openSetupModal());
  }, [dispatch, closePopup, settingsPopupId]);

  const handleToggleSettings = useCallback(() => {
    if (isSettingsOpen) {
      closePopup(settingsPopupId);
    } else {
      openPopup(settingsPopupId, {
        position: 'top-right',
        triggerRef: settingsButtonRef,
      });
    }
  }, [isSettingsOpen, closePopup, openPopup, settingsPopupId]);

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
        <FolderClosedIcon
          size={320}
          className="max-w-80 text-slate-500 dark:text-slate-400"
        />
        <h1 className="mt-4 w-full text-xl text-slate-500 dark:text-slate-400">
          Loading projects&hellip;
        </h1>
      </div>
    );
  } else if (error) {
    return (
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 text-center">
        <FolderClosedIcon
          size={320}
          className="max-w-80 text-slate-500 dark:text-slate-400"
        />
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
  } else if (projects.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 text-center">
        <FolderXIcon
          size={320}
          className="max-w-80 text-slate-500 dark:text-slate-400"
        />
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
      <FolderClosedIcon className="mb-6 h-24 w-24 text-slate-500 dark:text-slate-400" />

      <h1 className="mb-8 text-2xl text-slate-700 dark:text-slate-200">
        Select a Project
      </h1>

      <div className="w-full max-w-md">
        {featuredProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-2 flex items-center border-b border-b-slate-200 pb-1 text-lg font-semibold text-slate-700 dark:border-b-slate-600 dark:text-slate-200">
              <span className="mr-2 flex items-center justify-center rounded-full border border-amber-300 bg-amber-200 p-2.5 text-amber-700 inset-shadow-sm inset-shadow-amber-50 dark:border-amber-500 dark:bg-amber-700 dark:text-amber-200 dark:inset-shadow-amber-900">
                <StarIcon className="h-5 w-5" />
              </span>
              Favourite Projects
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
              <span className="mr-2 flex items-center justify-center rounded-full border border-slate-300 bg-slate-200 p-2.5 text-slate-700 inset-shadow-sm inset-shadow-slate-50 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-200 dark:inset-shadow-slate-800">
                <FolderClosedIcon className="h-5 w-5" />
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

        <div className="relative">
          <button
            ref={settingsButtonRef}
            type="button"
            onClick={handleToggleSettings}
            className={`flex cursor-pointer items-center gap-1.5 text-xs transition-colors ${
              isSettingsOpen
                ? 'text-slate-700 dark:text-slate-200'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Settings</span>
          </button>

          <Popup
            id={settingsPopupId}
            position="top-right"
            triggerRef={settingsButtonRef}
            className="min-w-48 rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-600/50 dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-950/50"
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <MenuThemeSwitcher theme={theme} setTheme={handleSetTheme} />
              <MenuEditModeSwitcher
                editMode={tagEditMode}
                setEditMode={handleSetTagEditMode}
              />
              <button
                type="button"
                onClick={handleOpenAutoTaggerSetup}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <span className="h-5 w-5">
                  <SparklesIcon className="h-5 w-5" />
                </span>
                Auto-Tagger Models
              </button>
            </div>
          </Popup>
        </div>
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
