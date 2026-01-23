'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { resetAssetsState } from './store/assets';
import { clearFilters } from './store/filters';
import { useAppDispatch } from './store/hooks';
import { resetProjectState } from './store/project';
import { clearSelection } from './store/selection';
import { ProjectList } from './views/project-list';

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

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [showProjectList, setShowProjectList] = useState(false);

  useEffect(() => {
    const checkProjectConfig = async () => {
      try {
        const isDefault = await checkIfUsingDefaultProject();

        // Check for configuration mode mismatch
        const storedConfigMode = sessionStorage.getItem('configMode');
        const currentConfigMode = isDefault ? 'default' : 'custom';

        if (storedConfigMode && storedConfigMode !== currentConfigMode) {
          // Configuration has changed, clear all session state
          console.warn(
            `[Home] Config mode mismatch ${storedConfigMode} → ${currentConfigMode}, clearing session state`,
          );
          sessionStorage.removeItem('selectedProject');
          sessionStorage.removeItem('selectedProjectTitle');
          sessionStorage.removeItem('selectedProjectThumbnail');
          sessionStorage.removeItem('configMode');

          // Clear Redux state to ensure clean slate
          dispatch(resetAssetsState());
          dispatch(resetProjectState());
          dispatch(clearFilters());
          dispatch(clearSelection());
        }

        if (isDefault) {
          // Using default project folder, go directly to page 1 (no flicker)
          sessionStorage.setItem('configMode', 'default');
          router.replace('/1');
          return; // Don't set loading to false - let page 1 handle it
        } else {
          // Using custom project folder, show project list
          sessionStorage.setItem('configMode', 'custom');
          setShowProjectList(true);
        }
      } catch (error) {
        console.warn(
          'Failed to check project config, showing project list:',
          error,
        );
        setShowProjectList(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkProjectConfig();
  }, [router, dispatch]);

  if (isLoading || !showProjectList) {
    // Show nothing during the config check — avoids a flash before
    // either redirecting to /1 or showing the project list (which has its own loading state)
    return null;
  }

  return <ProjectList />;
}
