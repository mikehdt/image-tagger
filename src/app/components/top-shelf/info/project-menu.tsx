import {
  ArrowLeftCircleIcon,
  ArrowPathIcon,
  CalculatorIcon,
  ChevronDownIcon,
  ComputerDesktopIcon,
  CubeIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useId, useRef, useState } from 'react';

import { Popup, usePopup } from '@/app/components/shared/popup-v2';
import { IoState, loadAllAssets, selectIoState } from '@/app/store/assets';
import { openSetupModal } from '@/app/store/auto-tagger';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectProjectName, selectProjectThumbnail } from '@/app/store/project';
import { ThemeMode, useTheme } from '@/app/utils/use-theme';

import { BucketCropModal } from '../asset-controls/bucket-crop-modal';

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
        ? 'cursor-not-allowed text-slate-300'
        : 'text-slate-700 hover:bg-slate-100'
    }`}
  >
    <span className="w-5">{icon}</span>
    {label}
  </button>
);

const themeConfig: Record<ThemeMode, { icon: React.ReactNode; label: string }> =
  {
    light: { icon: <SunIcon className="w-5" />, label: 'Light' },
    dark: { icon: <MoonIcon className="w-5" />, label: 'Dark' },
    auto: { icon: <ComputerDesktopIcon className="w-5" />, label: 'Auto' },
  };

const themeOrder: ThemeMode[] = ['light', 'dark', 'auto'];

const ProjectMenuComponent = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();
  const popupId = useId();

  const projectName = useAppSelector(selectProjectName);
  const projectThumbnail = useAppSelector(selectProjectThumbnail);
  const ioState = useAppSelector(selectIoState);
  const { theme, setTheme } = useTheme();

  const [isBucketModalOpen, setIsBucketModalOpen] = useState(false);

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

  const handleCycleTheme = useCallback(() => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  }, [theme, setTheme]);

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
        {projectThumbnail ? (
          <Image
            src={`/projects/${encodeURIComponent(projectThumbnail)}`}
            alt={`${projectName} thumbnail`}
            width={20}
            height={20}
            priority
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <CubeIcon className="h-6 w-6 rounded-full bg-(--surface) p-1 text-(--unselected-text)" />
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
        className="min-w-48 rounded-md border border-slate-200 bg-white shadow-lg"
      >
        <div className="divide-y divide-slate-100">
          <MenuItem
            icon={<ArrowPathIcon className="w-5" />}
            label="Refresh Assets"
            onClick={handleRefresh}
            disabled={ioInProgress}
          />
          <MenuItem
            icon={<CalculatorIcon className="w-5" />}
            label="Bucket Crop Tool"
            onClick={handleOpenBucketModal}
          />
          <MenuItem
            icon={<SparklesIcon className="w-5" />}
            label="Set Up Auto-Tagger"
            onClick={handleOpenAutoTaggerSetup}
          />
          <MenuItem
            icon={themeConfig[theme].icon}
            label={`Theme: ${themeConfig[theme].label}`}
            onClick={handleCycleTheme}
          />
          <MenuItem
            icon={<ArrowLeftCircleIcon className="w-5" />}
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
