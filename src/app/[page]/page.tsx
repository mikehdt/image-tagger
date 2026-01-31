'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAppDispatch } from '../store/hooks';
import { resetProjectState, setProjectInfo } from '../store/project';
import { AssetList } from '../views/asset-list';

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

// Check sessionStorage synchronously to determine if we already have project context.
// This avoids flashing a loading state on pagination (page changes) when we already
// know the project is set up.
const getInitialProjectContext = () => {
  if (typeof window === 'undefined') return { hasContext: false };
  const configMode = sessionStorage.getItem('configMode');
  if (configMode === 'default') return { hasContext: true };
  if (configMode === 'custom') {
    return { hasContext: !!sessionStorage.getItem('selectedProject') };
  }
  return { hasContext: false };
};

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentPage = parseInt(params.page as string, 10) || 1;

  // Initialize from sessionStorage: if we already have project context,
  // skip the loading state entirely so pagination renders instantly.
  const [canShowAssets, setCanShowAssets] = useState(
    () => getInitialProjectContext().hasContext,
  );
  const [isLoading, setIsLoading] = useState(
    () => !getInitialProjectContext().hasContext,
  );
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if a project is selected or if we're using the default project
  useEffect(() => {
    const checkProjectAccess = async () => {
      // Prevent multiple simultaneous checks
      if (isRedirecting) return;

      try {
        const isDefault = await checkIfUsingDefaultProject();

        // Check for configuration mode mismatch
        const storedConfigMode = sessionStorage.getItem('configMode');
        const currentConfigMode = isDefault ? 'default' : 'custom';

        if (storedConfigMode && storedConfigMode !== currentConfigMode) {
          // Configuration has changed, clear related sessionStorage and redirect to home for proper handling
          console.warn(
            `Config mode mismatch ${storedConfigMode} → ${currentConfigMode}, clearing session and redirecting to home`,
          );
          setIsRedirecting(true);

          // Clear project-related sessionStorage to prevent API calls with stale data
          sessionStorage.removeItem('selectedProject');
          sessionStorage.removeItem('selectedProjectTitle');
          sessionStorage.removeItem('selectedProjectThumbnail');
          sessionStorage.removeItem('selectedProjectThumbnailVersion');
          sessionStorage.removeItem('configMode');

          // Clear the Redux state immediately for both direction changes
          dispatch(resetProjectState());

          router.replace('/');
          return;
        }

        if (isDefault) {
          // Using default project, no need for project selection
          // Clear any stale project-related sessionStorage items
          sessionStorage.removeItem('selectedProject');
          sessionStorage.removeItem('selectedProjectTitle');
          sessionStorage.removeItem('selectedProjectThumbnail');
          sessionStorage.removeItem('selectedProjectThumbnailVersion');

          // Reset project state to clear any stale project info
          dispatch(resetProjectState());
          // Set default project info
          dispatch(
            setProjectInfo({
              name: 'Default Project',
              path: 'public/assets',
              folderName: 'assets',
            }),
          );
          sessionStorage.setItem('configMode', 'default');
          setCanShowAssets(true);
        } else {
          // Using custom project folder, check if a project is selected
          // selectedProject is the folder name (e.g., "dev")
          const selectedProject = sessionStorage.getItem('selectedProject');
          if (!selectedProject) {
            // No project selected, redirect to project selector
            router.replace('/');
            return;
          }

          // Set project info from sessionStorage
          const selectedProjectTitle =
            sessionStorage.getItem('selectedProjectTitle') || selectedProject;
          const selectedProjectThumbnail =
            sessionStorage.getItem('selectedProjectThumbnail') || undefined;
          dispatch(
            setProjectInfo({
              name: selectedProjectTitle,
              path: selectedProject,
              folderName: selectedProject,
              thumbnail: selectedProjectThumbnail,
            }),
          );
          sessionStorage.setItem('configMode', 'custom');
          setCanShowAssets(true);
        }
      } catch (error) {
        console.warn('[page]: Failed to check project access:', error);
        // Fall back to checking sessionStorage
        const selectedProject = sessionStorage.getItem('selectedProject');
        if (!selectedProject) {
          router.replace('/');
          return;
        }

        // Set project info from sessionStorage as fallback
        const selectedProjectTitle =
          sessionStorage.getItem('selectedProjectTitle') || selectedProject;
        const selectedProjectThumbnail =
          sessionStorage.getItem('selectedProjectThumbnail') || undefined;
        dispatch(
          setProjectInfo({
            name: selectedProjectTitle,
            path: selectedProject,
            folderName: selectedProject,
            thumbnail: selectedProjectThumbnail,
          }),
        );
        setCanShowAssets(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkProjectAccess();
  }, [router, dispatch, isRedirecting]);

  // Scroll to top when page changes
  useEffect(() => {
    if (canShowAssets) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentPage, canShowAssets]);

  // If we already have context, render immediately (no loading flash on pagination)
  if (canShowAssets && !isRedirecting) {
    return <AssetList currentPage={currentPage} />;
  }

  // When truly loading (first visit) or redirecting, render nothing.
  // AppProvider's InitialLoad handles the visible loading state.
  return null;
}
