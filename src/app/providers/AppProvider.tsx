'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  completeAfterDelay,
  IoState,
  loadAllAssets,
  selectImageCount,
  selectIoState,
} from '../store/assets';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectProjectFolderName } from '../store/project';
import { useTheme } from '../utils/use-theme';
import { Error } from '../views/error';
import { InitialLoad } from '../views/initial-load';
import { NoContent } from '../views/no-content';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Apply theme class to document.documentElement globally
  useTheme();

  const router = useRouter();
  const pathname = usePathname();
  const initialLoad = useRef<boolean>(true);
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);
  const dispatch = useAppDispatch();
  const ioState = useAppSelector(selectIoState);
  const imageCount = useAppSelector(selectImageCount);
  const projectFolderName = useAppSelector(selectProjectFolderName);

  // Only load assets when we're on a tagging page route
  const shouldLoadAssets = pathname.startsWith('/tagging');

  // Load assets when project changes or on initial tagging page visit
  const loadImageAssets = useCallback(
    (_args?: { maintainIoState: boolean }) => {
      if (shouldLoadAssets && projectFolderName) {
        dispatch(
          loadAllAssets({
            maintainIoState: _args?.maintainIoState ?? false,
            projectPath: projectFolderName,
          }),
        );
      }
    },
    [dispatch, shouldLoadAssets, projectFolderName],
  );

  useEffect(() => {
    if (initialLoad.current && shouldLoadAssets && projectFolderName) {
      loadImageAssets();
      initialLoad.current = false;
    }
    // Reset initial load flag when leaving tagging view
    if (!shouldLoadAssets) {
      initialLoad.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional state reset on navigation
      setHasCompletedInitialLoad(false);
    }
  }, [loadImageAssets, shouldLoadAssets, projectFolderName, pathname]);

  // Redirect to root on I/O error
  useEffect(() => {
    if (ioState === IoState.ERROR && shouldLoadAssets) {
      router.push('/');
    }
  }, [ioState, router, shouldLoadAssets]);

  // Auto-trigger completion delay when state becomes COMPLETING
  useEffect(() => {
    if (ioState === IoState.COMPLETING) {
      dispatch(completeAfterDelay());
    }
  }, [ioState, dispatch]);

  // Track initial load completion and reset flag if imageCount becomes 0 (crash recovery)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    // Intentional state sync with Redux store for load tracking
    if (imageCount === 0) {
      setHasCompletedInitialLoad(false); // Reset if we somehow lose all images
    } else if (ioState === IoState.COMPLETE && !hasCompletedInitialLoad) {
      setHasCompletedInitialLoad(true); // Mark initial load as completed
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [imageCount, ioState, hasCompletedInitialLoad]);

  // On non-tagging routes (project list, training), just show children
  if (!shouldLoadAssets) {
    return children;
  }

  // Only show the loading screen if we're loading AND we don't have any assets yet
  if (
    ioState === IoState.INITIAL ||
    (ioState === IoState.LOADING && imageCount === 0) ||
    (ioState === IoState.COMPLETING && !hasCompletedInitialLoad)
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
