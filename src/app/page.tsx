'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [showProjectList, setShowProjectList] = useState(true);

  useEffect(() => {
    const checkProjectConfig = async () => {
      console.log('Home page: checking project config...');
      try {
        const isDefault = await checkIfUsingDefaultProject();
        console.log('Home page: isDefault =', isDefault);

        // Check for configuration mode mismatch
        const storedConfigMode = sessionStorage.getItem('configMode');
        const currentConfigMode = isDefault ? 'default' : 'custom';
        console.log('Home page: config mode check -', {
          storedConfigMode,
          currentConfigMode,
        });

        if (storedConfigMode && storedConfigMode !== currentConfigMode) {
          // Configuration has changed, clear all session state
          console.log(
            `Config mode changed from ${storedConfigMode} to ${currentConfigMode}, clearing state`,
          );
          sessionStorage.removeItem('selectedProject');
          sessionStorage.removeItem('selectedProjectTitle');
          sessionStorage.removeItem('selectedProjectThumbnail');
          sessionStorage.removeItem('configMode');

          // Clear Redux state to ensure clean slate
          // The AppProvider will handle the redirect appropriately
        }

        if (isDefault) {
          // Using default project folder, go directly to page 1
          sessionStorage.setItem('configMode', 'default');
          router.push('/1');
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
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!showProjectList) {
    return null; // Will redirect to /1 via useEffect
  }

  return <ProjectList />;
}
