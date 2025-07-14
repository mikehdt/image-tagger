'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import {
  completeAfterDelay,
  IoState,
  loadAllAssets,
  selectImageCount,
  selectIoState,
  setProjectInfo,
} from '../store/assets';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Error } from '../views/error';
import { InitialLoad } from '../views/initial-load';
import { NoContent } from '../views/no-content';

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
      } else {
        // No project selected but we're on a page route - redirect to project selector
        router.push('/');
        return;
      }
    }
  }, [shouldLoadAssets, dispatch, router]);

  // Load assets only once on initial mount and only if we're on a page route
  const loadImageAssets = useCallback(
    async (_args?: { maintainIoState: boolean }) => {
      // Only load if we should load assets (i.e., on a page route)
      if (shouldLoadAssets) {
        // Get the selected project path from sessionStorage
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
  }, [loadImageAssets, shouldLoadAssets]);

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
