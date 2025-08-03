'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const currentPage = parseInt(params.page as string, 10) || 1;
  const [isLoading, setIsLoading] = useState(true);
  const [canShowAssets, setCanShowAssets] = useState(false);

  // Check if a project is selected or if we're using the default project
  useEffect(() => {
    const checkProjectAccess = async () => {
      try {
        const isDefault = await checkIfUsingDefaultProject();

        // Check for configuration mode mismatch
        const storedConfigMode = sessionStorage.getItem('configMode');
        const currentConfigMode = isDefault ? 'default' : 'custom';

        if (storedConfigMode && storedConfigMode !== currentConfigMode) {
          // Configuration has changed, redirect to home for proper handling
          console.warn(
            `Config mode mismatch ${storedConfigMode} → ${currentConfigMode}, redirecting to home`,
          );
          router.push('/');
          return;
        }

        if (isDefault) {
          // Using default project, no need for project selection
          sessionStorage.setItem('configMode', 'default');
          setCanShowAssets(true);
        } else {
          // Using custom project folder, check if a project is selected
          const selectedProject = sessionStorage.getItem('selectedProject');
          if (!selectedProject) {
            // No project selected, redirect to project selector
            router.push('/');
            return;
          }
          sessionStorage.setItem('configMode', 'custom');
          setCanShowAssets(true);
        }
      } catch (error) {
        console.warn('[page]: Failed to check project access:', error);
        // Fall back to checking sessionStorage
        const selectedProject = sessionStorage.getItem('selectedProject');
        if (!selectedProject) {
          router.push('/');
          return;
        }
        setCanShowAssets(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkProjectAccess();
  }, [router]);

  // Scroll to top when page changes
  useEffect(() => {
    if (canShowAssets) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentPage, canShowAssets]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!canShowAssets) {
    return null; // Will redirect via useEffect
  }

  return <AssetList currentPage={currentPage} />;
}
