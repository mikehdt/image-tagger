import {
  ArrowLeftCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import {
  IoState,
  loadAllAssets,
  selectFilteredAssets,
  selectIoState,
  selectLoadProgress,
  selectSaveProgress,
} from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

import { PaginationControls } from '../pagination/controls';
import { Pagination } from '../pagination/pagination';
import { Button } from '../shared/button';
import { useToast } from '../shared/toast';
import { LoadingStatus } from './components';
import { IoActions } from './components/io-actions';

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

type BottomShelfProps = {
  currentPage?: number;
  totalPages?: number;
};

export const BottomShelf = ({ currentPage = 1 }: BottomShelfProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { showToast } = useToast();

  // IO state selectors
  const ioState = useAppSelector(selectIoState);
  const saveProgress = useAppSelector(selectSaveProgress) || null;
  const loadProgress = useAppSelector(selectLoadProgress) || null;

  // Track previous IO state and operation type to detect completion
  const prevIoStateRef = useRef<IoState>(ioState);
  const lastOperationTypeRef = useRef<'loading' | 'saving' | null>(null);

  // Show toast when operations complete
  useEffect(() => {
    const prevIoState = prevIoStateRef.current;

    // Track the type of operation when entering LOADING or SAVING states
    if (ioState === IoState.LOADING) {
      lastOperationTypeRef.current = 'loading';
    } else if (ioState === IoState.SAVING) {
      lastOperationTypeRef.current = 'saving';
    }

    // If we transitioned from COMPLETING to COMPLETE, show completion toast based on operation type
    if (prevIoState === IoState.COMPLETING && ioState === IoState.COMPLETE) {
      const operationType = lastOperationTypeRef.current;

      if (operationType === 'loading') {
        showToast('Asset reload complete');
      } else if (operationType === 'saving') {
        showToast('Asset save complete');
      }

      // Clear the operation type after showing the toast
      lastOperationTypeRef.current = null;
    }

    // Update the ref for next comparison
    prevIoStateRef.current = ioState;
  }, [ioState, showToast]);

  // Action handlers
  const doRefresh = async () => {
    try {
      const isDefault = await checkIfUsingDefaultProject();

      // Check for configuration mode mismatch before proceeding
      const storedConfigMode = sessionStorage.getItem('configMode');
      const currentConfigMode = isDefault ? 'default' : 'custom';

      if (storedConfigMode && storedConfigMode !== currentConfigMode) {
        // Configuration has changed, clear sessionStorage and redirect to home
        console.warn(
          `[BottomShelf] Config mode mismatch ${storedConfigMode} → ${currentConfigMode}, redirecting to home`,
        );
        sessionStorage.removeItem('selectedProject');
        sessionStorage.removeItem('selectedProjectTitle');
        sessionStorage.removeItem('selectedProjectThumbnail');
        sessionStorage.removeItem('configMode');
        router.push('/');
        return;
      }

      if (isDefault) {
        // Using default project, load from default assets folder
        sessionStorage.setItem('configMode', 'default');
        dispatch(
          loadAllAssets({
            maintainIoState: false, // Show loading state when user manually refreshes
            projectPath: undefined, // Use default path
          }),
        );
      } else {
        // Using custom projects folder
        const selectedProject = sessionStorage.getItem('selectedProject');
        if (selectedProject) {
          sessionStorage.setItem('configMode', 'custom');
          dispatch(
            loadAllAssets({
              maintainIoState: false, // Show loading state when user manually refreshes
              projectPath: selectedProject,
            }),
          );
        } else {
          // No project selected, redirect to project list
          router.push('/');
        }
      }
    } catch (error) {
      console.warn('Failed to check project config during refresh:', error);
      // Fall back to previous behavior
      const selectedProject = sessionStorage.getItem('selectedProject');
      if (selectedProject) {
        dispatch(
          loadAllAssets({
            maintainIoState: false, // Show loading state when user manually refreshes
            projectPath: selectedProject,
          }),
        );
      } else {
        // No project selected, redirect to project list
        router.push('/');
      }
    }
  };

  const handleBackToProjects = async () => {
    try {
      const isDefault = await checkIfUsingDefaultProject();

      // Check for configuration mode mismatch before proceeding
      const storedConfigMode = sessionStorage.getItem('configMode');
      const currentConfigMode = isDefault ? 'default' : 'custom';

      if (storedConfigMode && storedConfigMode !== currentConfigMode) {
        // Configuration has changed, clear sessionStorage and redirect to home
        console.warn(
          `[BottomShelf] Config mode mismatch ${storedConfigMode} → ${currentConfigMode}, redirecting to home`,
        );
        sessionStorage.removeItem('selectedProject');
        sessionStorage.removeItem('selectedProjectTitle');
        sessionStorage.removeItem('selectedProjectThumbnail');
        sessionStorage.removeItem('configMode');
        router.push('/');
        return;
      }

      if (isDefault) {
        // If we're using default project folder, stay on current assets view
        // This handles the case where config was removed while viewing assets
        const selectedProject = sessionStorage.getItem('selectedProject');
        if (selectedProject) {
          // Clear the selected project since we're now using default
          sessionStorage.removeItem('selectedProject');
          sessionStorage.removeItem('selectedProjectTitle');
          sessionStorage.removeItem('selectedProjectThumbnail');
          sessionStorage.setItem('configMode', 'default');

          // Refresh the current view to load default assets
          dispatch(
            loadAllAssets({
              maintainIoState: false,
              projectPath: undefined, // Use default path
            }),
          );
        }
        // If no selected project, we're already viewing default assets, so do nothing
      } else {
        // Projects folder is configured, navigate back to project list
        router.push('/');
      }
    } catch (error) {
      console.warn(
        'Failed to check project config, navigating to home:',
        error,
      );
      // Fall back to navigating to home
      router.push('/');
    }
  };

  // Get filtered assets directly from the selector
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const filteredCount = filteredAssets.length;

  const ioInProgress =
    ioState === IoState.LOADING ||
    ioState === IoState.SAVING ||
    ioState === IoState.COMPLETING;

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full border-t border-t-white/50 bg-white/80 inset-shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center px-4">
        <div className="flex w-1/4 items-center gap-2 text-xs whitespace-nowrap text-slate-500">
          <Button
            size="small"
            variant="ghost"
            onClick={handleBackToProjects}
            title="Back to project selection"
            disabled={ioInProgress}
          >
            <ArrowLeftCircleIcon className="w-6" />
          </Button>

          {ioInProgress ? (
            <LoadingStatus
              ioState={ioState}
              saveProgress={saveProgress}
              loadProgress={loadProgress}
            />
          ) : (
            <Button
              type="button"
              onClick={doRefresh}
              size="small"
              variant="ghost"
              title="Reload asset list"
            >
              <ArrowPathIcon className="w-6" />
            </Button>
          )}

          {!ioInProgress ? (
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredCount}
            />
          ) : null}
        </div>

        <div className="flex w-2/4 items-center justify-center">
          <Pagination currentPage={currentPage} totalItems={filteredCount} />
        </div>

        <div className="flex w-1/4 items-center justify-end gap-2 text-sm">
          <IoActions ioInProgress={ioInProgress} />
        </div>
      </div>
    </div>
  );
};
