import {
  ArrowLeftCircleIcon,
  BoxIcon,
  CalculatorIcon,
  ChevronDownIcon,
  RefreshCwIcon,
  SparklesIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useId, useRef, useState } from 'react';

import { Popup, usePopup } from '@/app/components/shared/popup';
import { IoState, loadAllAssets, selectIoState } from '@/app/store/assets';
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
import { selectProjectName, selectProjectThumbnail } from '@/app/store/project';

import { BucketCropModal } from '../asset-controls/bucket-crop-modal';
import { MenuEditModeSwitcher } from './menu-edit-mode-switcher';
import { MenuThemeSwitcher } from './menu-theme-switcher';

// Inline configuration check function to avoid import issues
const checkIfUsingDefaultProject = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) return true;
    const config = await response.json();
    const projectsFolder = config.projectsFolder || 'public/assets';
    return projectsFolder === 'public/assets';
  } catch (error) {
    console.warn('Failed to check project config:', error);
    return true;
  }
};

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

const MenuItem = ({ icon, label, onClick, disabled }: MenuItemProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
      disabled
        ? 'cursor-not-allowed text-slate-300 dark:text-slate-500'
        : 'cursor-pointer text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
    }`}
  >
    <span className="h-5 w-5">{icon}</span>
    {label}
  </button>
);

const ProjectMenuComponent = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();
  const popupId = useId();

  const projectName = useAppSelector(selectProjectName);
  const projectThumbnail = useAppSelector(selectProjectThumbnail);
  const ioState = useAppSelector(selectIoState);

  // Get thumbnail version from session storage for cache-busting
  const thumbnailVersion =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('selectedProjectThumbnailVersion')
      : null;
  const theme = useAppSelector(selectTheme);
  const tagEditMode = useAppSelector(selectTagEditMode);

  // Show auto-tagger in project menu only in single-project (default) mode,
  // since multi-project mode has it on the project list settings instead
  const isSingleProjectMode =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('configMode') === 'default';

  const [isBucketModalOpen, setIsBucketModalOpen] = useState(false);

  // Build thumbnail src with cache-busting version
  const thumbnailSrc = projectThumbnail
    ? `/projects/${encodeURIComponent(projectThumbnail)}${thumbnailVersion ? `?v=${thumbnailVersion}` : ''}`
    : null;

  const isOpen = getPopupState(popupId).isOpen;
  const ioInProgress =
    ioState === IoState.LOADING ||
    ioState === IoState.SAVING ||
    ioState === IoState.COMPLETING;

  const handleToggle = useCallback(() => {
    if (isOpen) {
      closePopup(popupId);
    } else {
      openPopup(popupId, {
        position: 'bottom-left',
        triggerRef: buttonRef,
      });
    }
  }, [isOpen, closePopup, openPopup, popupId]);

  const handleBackToProjects = useCallback(async () => {
    closePopup(popupId);

    try {
      const isDefault = await checkIfUsingDefaultProject();
      const storedConfigMode = sessionStorage.getItem('configMode');
      const currentConfigMode = isDefault ? 'default' : 'custom';

      if (storedConfigMode && storedConfigMode !== currentConfigMode) {
        sessionStorage.removeItem('selectedProject');
        sessionStorage.removeItem('selectedProjectTitle');
        sessionStorage.removeItem('selectedProjectThumbnail');
        sessionStorage.removeItem('selectedProjectThumbnailVersion');
        sessionStorage.removeItem('configMode');
        router.push('/');
        return;
      }

      if (isDefault) {
        const selectedProject = sessionStorage.getItem('selectedProject');
        if (selectedProject) {
          sessionStorage.removeItem('selectedProject');
          sessionStorage.removeItem('selectedProjectTitle');
          sessionStorage.removeItem('selectedProjectThumbnail');
          sessionStorage.setItem('configMode', 'default');

          dispatch(
            loadAllAssets({
              maintainIoState: false,
              projectPath: undefined,
            }),
          );
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.warn(
        'Failed to check project config, navigating to home:',
        error,
      );
      router.push('/');
    }
  }, [closePopup, popupId, dispatch, router]);

  const handleRefresh = useCallback(async () => {
    closePopup(popupId);

    try {
      const isDefault = await checkIfUsingDefaultProject();
      const storedConfigMode = sessionStorage.getItem('configMode');
      const currentConfigMode = isDefault ? 'default' : 'custom';

      if (storedConfigMode && storedConfigMode !== currentConfigMode) {
        sessionStorage.removeItem('selectedProject');
        sessionStorage.removeItem('selectedProjectTitle');
        sessionStorage.removeItem('selectedProjectThumbnail');
        sessionStorage.removeItem('selectedProjectThumbnailVersion');
        sessionStorage.removeItem('configMode');
        router.push('/');
        return;
      }

      if (isDefault) {
        sessionStorage.setItem('configMode', 'default');
        dispatch(
          loadAllAssets({
            maintainIoState: false,
            projectPath: undefined,
          }),
        );
      } else {
        const selectedProject = sessionStorage.getItem('selectedProject');
        if (selectedProject) {
          sessionStorage.setItem('configMode', 'custom');
          dispatch(
            loadAllAssets({
              maintainIoState: false,
              projectPath: selectedProject,
            }),
          );
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      console.warn('Failed to check project config during refresh:', error);
      const selectedProject = sessionStorage.getItem('selectedProject');
      if (selectedProject) {
        dispatch(
          loadAllAssets({
            maintainIoState: false,
            projectPath: selectedProject,
          }),
        );
      } else {
        router.push('/');
      }
    }
  }, [closePopup, popupId, dispatch, router]);

  const handleOpenBucketModal = useCallback(() => {
    closePopup(popupId);
    setIsBucketModalOpen(true);
  }, [closePopup, popupId]);

  const handleCloseBucketModal = useCallback(() => {
    setIsBucketModalOpen(false);
  }, []);

  const handleOpenAutoTaggerSetup = useCallback(() => {
    closePopup(popupId);
    dispatch(openSetupModal());
  }, [closePopup, popupId, dispatch]);

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

  if (!projectName) {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`flex cursor-pointer items-center gap-2 rounded-sm px-1 py-0.5 transition-colors ${
          isOpen ? 'bg-(--surface)' : 'hover:bg-(--surface)/50'
        }`}
      >
        {thumbnailSrc ? (
          <Image
            src={thumbnailSrc}
            alt={`${projectName} thumbnail`}
            width={20}
            height={20}
            priority
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <BoxIcon className="h-6 w-6 rounded-full bg-(--surface) p-1 text-(--unselected-text)" />
        )}
        <span className="font-medium text-(--foreground)">{projectName}</span>
        <ChevronDownIcon
          className={`h-3 w-3 text-(--unselected-text) transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <Popup
        id={popupId}
        position="bottom-left"
        triggerRef={buttonRef}
        className="min-w-48 rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-600/50 dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-950/50"
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          <MenuItem
            icon={<RefreshCwIcon className="h-5 w-5" />}
            label="Refresh Assets"
            onClick={handleRefresh}
            disabled={ioInProgress}
          />
          <MenuItem
            icon={<CalculatorIcon className="h-5 w-5" />}
            label="Bucket Crop Tool"
            onClick={handleOpenBucketModal}
          />
          {isSingleProjectMode && (
            <MenuItem
              icon={<SparklesIcon className="h-5 w-5" />}
              label="Auto-Tagger Models"
              onClick={handleOpenAutoTaggerSetup}
            />
          )}
          <MenuThemeSwitcher theme={theme} setTheme={handleSetTheme} />
          <MenuEditModeSwitcher
            editMode={tagEditMode}
            setEditMode={handleSetTagEditMode}
          />
          <MenuItem
            icon={<ArrowLeftCircleIcon className="h-5 w-5" />}
            label="Back to Projects"
            onClick={handleBackToProjects}
            disabled={ioInProgress}
          />
        </div>
      </Popup>

      <BucketCropModal
        isOpen={isBucketModalOpen}
        onClose={handleCloseBucketModal}
      />
    </div>
  );
};

export const ProjectMenu = memo(ProjectMenuComponent);
