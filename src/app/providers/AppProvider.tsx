'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import {
  completeAfterDelay,
  IoState,
  loadAllAssets,
  resetAssetsState,
  selectImageCount,
  selectIoState,
} from '../store/assets';
import { clearFilters } from '../store/filters';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetProjectState, setProjectInfo } from '../store/project';
import { clearSelection } from '../store/selection';
import { Error } from '../views/error';
import { InitialLoad } from '../views/initial-load';
import { NoContent } from '../views/no-content';

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

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const initialLoad = useRef<boolean>(true);
  const hasCompletedInitialLoad = useRef<boolean>(false); // Track if we've ever completed initial load
  const dispatch = useAppDispatch();
  const ioState = useAppSelector(selectIoState);
  const imageCount = useAppSelector(selectImageCount);

  // Only load assets when we're on a page route (not root)
  const shouldLoadAssets = pathname !== '/';

  // Initialize project info from session storage on mount
  useEffect(() => {
    if (shouldLoadAssets && typeof window !== 'undefined') {
      const initializeProject = async () => {
        try {
          const isDefault = await checkIfUsingDefaultProject();

          // Check for configuration mode mismatch
          const storedConfigMode = sessionStorage.getItem('configMode');
          const currentConfigMode = isDefault ? 'default' : 'custom';

          if (storedConfigMode && storedConfigMode !== currentConfigMode) {
            // Configuration has changed, clear all session state and redirect appropriately
            sessionStorage.removeItem('selectedProject');
            sessionStorage.removeItem('selectedProjectTitle');
            sessionStorage.removeItem('selectedProjectThumbnail');
            sessionStorage.removeItem('configMode');

            // Clear Redux state
            dispatch(resetAssetsState());
            dispatch(resetProjectState());
            dispatch(clearFilters());
            dispatch(clearSelection());

            // Redirect to home to determine the correct navigation flow
            router.push('/');
            return;
          }

          if (isDefault) {
            // Using default project folder, set up a default project info
            dispatch(
              setProjectInfo({
                name: 'Default Project',
                path: 'public/assets',
                thumbnail: undefined,
              }),
            );
            // Store the current config mode
            sessionStorage.setItem('configMode', 'default');

            // Immediately trigger asset loading for default project
            dispatch(
              loadAllAssets({
                maintainIoState: false,
                projectPath: undefined, // Will use default path
              }),
            );
          } else {
            // Using custom project folder, check sessionStorage
            const selectedProject = sessionStorage.getItem('selectedProject');
            if (selectedProject) {
              // Get stored project title or fallback to extracted name from path
              const storedProjectTitle = sessionStorage.getItem(
                'selectedProjectTitle',
              );
              const storedProjectThumbnail = sessionStorage.getItem(
                'selectedProjectThumbnail',
              );
              const projectName =
                selectedProject.split(/[/\\]/).pop() || 'Unknown Project';
              const projectTitle = storedProjectTitle || projectName;

              dispatch(
                setProjectInfo({
                  name: projectTitle,
                  path: selectedProject,
                  thumbnail: storedProjectThumbnail || undefined,
                }),
              );
              // Store the current config mode
              sessionStorage.setItem('configMode', 'custom');
            } else {
              // No project selected but we're on a page route - redirect to project selector
              router.push('/');
              return;
            }
          }
        } catch (error) {
          console.warn('AppProvider: Failed to initialize project:', error);
          // If there's an error determining project type, fall back to checking sessionStorage
          const selectedProject = sessionStorage.getItem('selectedProject');
          if (selectedProject) {
            // We have a custom project in sessionStorage
            const storedProjectTitle = sessionStorage.getItem(
              'selectedProjectTitle',
            );
            const storedProjectThumbnail = sessionStorage.getItem(
              'selectedProjectThumbnail',
            );
            const projectName =
              selectedProject.split(/[/\\]/).pop() || 'Unknown Project';
            const projectTitle = storedProjectTitle || projectName;

            dispatch(
              setProjectInfo({
                name: projectTitle,
                path: selectedProject,
                thumbnail: storedProjectThumbnail || undefined,
              }),
            );
          } else {
            // No selected project in sessionStorage - assume default project
            // This handles the case where config API fails but we're using default
            dispatch(
              setProjectInfo({
                name: 'Default Project',
                path: 'public/assets',
                thumbnail: undefined,
              }),
            );
            sessionStorage.setItem('configMode', 'default');

            // Trigger asset loading for default project
            dispatch(
              loadAllAssets({
                maintainIoState: false,
                projectPath: undefined, // Will use default path
              }),
            );
          }
        }
      };

      initializeProject();
    }
  }, [shouldLoadAssets, dispatch, router]);

  // Load assets only once on initial mount and only if we're on a page route
  const loadImageAssets = useCallback(
    async (_args?: { maintainIoState: boolean }) => {
      // Only load if we should load assets (i.e., on a page route)
      if (shouldLoadAssets) {
        try {
          const isDefault = await checkIfUsingDefaultProject();

          if (isDefault) {
            // For default project, use undefined projectPath (will use default)
            dispatch(
              loadAllAssets({
                maintainIoState: _args?.maintainIoState ?? false,
                projectPath: undefined, // This will use the default path
              }),
            );
          } else {
            // For custom projects, get the selected project path from sessionStorage
            const selectedProject = sessionStorage.getItem('selectedProject');

            // Only proceed if there's actually a project selected
            if (selectedProject) {
              dispatch(
                loadAllAssets({
                  maintainIoState: _args?.maintainIoState ?? false,
                  projectPath: selectedProject,
                }),
              );
            }
            // If no project is selected, the [page] route will handle redirecting to project list
          }
        } catch (error) {
          console.warn(
            'Failed to determine project type for asset loading:',
            error,
          );
          // Fall back to checking sessionStorage
          const selectedProject = sessionStorage.getItem('selectedProject');
          if (selectedProject) {
            dispatch(
              loadAllAssets({
                maintainIoState: _args?.maintainIoState ?? false,
                projectPath: selectedProject,
              }),
            );
          }
        }
      }
    },
    [dispatch, shouldLoadAssets],
  );

  useEffect(() => {
    if (initialLoad.current && shouldLoadAssets) {
      loadImageAssets();
      initialLoad.current = false;
    }
    // Reset initial load flag when switching back to project selector
    if (!shouldLoadAssets) {
      initialLoad.current = true;
      hasCompletedInitialLoad.current = false;
    }
  }, [loadImageAssets, shouldLoadAssets, pathname]);

  // Redirect to root on I/O error
  useEffect(() => {
    if (ioState === IoState.ERROR) {
      router.push('/');
    }
  }, [ioState, router]);

  // Auto-trigger completion delay when state becomes COMPLETING
  useEffect(() => {
    if (ioState === IoState.COMPLETING) {
      dispatch(completeAfterDelay());
    }
  }, [ioState, dispatch]);

  // Track initial load completion and reset flag if imageCount becomes 0 (crash recovery)
  useEffect(() => {
    if (imageCount === 0) {
      hasCompletedInitialLoad.current = false; // Reset if we somehow lose all images
    } else if (
      ioState === IoState.COMPLETE &&
      !hasCompletedInitialLoad.current
    ) {
      hasCompletedInitialLoad.current = true; // Mark initial load as completed
    }
  }, [imageCount, ioState]);

  // Only show the loading/error/no-content screens when we're on a page route
  // On the root route, just show the children (project selector)
  if (!shouldLoadAssets) {
    return children;
  }

  // Only show the loading screen if we're loading AND we don't have any assets yet
  // This differentiates between initial load and refresh operations
  // For COMPLETING state: only show InitialLoad if we haven't completed initial load yet
  if (
    ioState === IoState.INITIAL ||
    (ioState === IoState.LOADING && imageCount === 0) ||
    (ioState === IoState.COMPLETING && !hasCompletedInitialLoad.current)
  ) {
    return <InitialLoad />;
  }

  if (ioState === IoState.ERROR) {
    return <Error onReload={loadImageAssets} />;
  }

  // Handle empty state at the provider level instead of in page components
  if (ioState !== IoState.LOADING && imageCount === 0) {
    return <NoContent onReload={loadImageAssets} />;
  }

  return children;
};
