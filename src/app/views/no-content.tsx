'use client';

import { BoxSelectIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SyntheticEvent } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '../components/shared/button';
import { useAppSelector } from '../store/hooks';
import { selectProjectName } from '../store/project';

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

type NoContentProps = { onReload: () => void };

export const NoContent = ({ onReload }: NoContentProps) => {
  const router = useRouter();
  const projectName = useAppSelector(selectProjectName);
  const [showBackToProjects, setShowBackToProjects] = useState(false);
  const [isDefaultProject, setIsDefaultProject] = useState(false);

  // Check if we should show "Back to projects" button based on current config
  useEffect(() => {
    const checkProjectConfig = async () => {
      try {
        const isDefault = await checkIfUsingDefaultProject();
        setIsDefaultProject(isDefault);
        // Show "Back to projects" button only if using custom projects folder
        setShowBackToProjects(!isDefault);
      } catch (error) {
        console.warn('Failed to check project config:', error);
        // If check fails, assume we might have projects available
        setIsDefaultProject(false);
        setShowBackToProjects(true);
      }
    };

    checkProjectConfig();
  }, []);

  const doReload = async (e: SyntheticEvent) => {
    e.preventDefault();

    // Check if projects config has changed when refreshing
    try {
      const isDefault = await checkIfUsingDefaultProject();
      setIsDefaultProject(isDefault);
      // Update the back button visibility
      setShowBackToProjects(!isDefault);
    } catch (error) {
      console.warn('Failed to check project config during reload:', error);
    }

    onReload();
  };

  const handleBackToProjects = () => {
    // Just navigate back - root page will handle the logic
    router.push('/');
  };

  return (
    <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
      <BoxSelectIcon className="h-full w-full max-w-80 text-slate-500" />

      <h1 className="mt-4 mb-4 w-full text-xl text-slate-500">
        No assets found
        {isDefaultProject || !projectName || projectName === 'Default Project'
          ? ' in the public assets folder'
          : ` in ${projectName}`}
      </h1>

      <div className="mt-4 flex w-full justify-center gap-3">
        <Button onClick={doReload} size="mediumWide">
          Refresh
        </Button>

        {showBackToProjects && (
          <Button onClick={handleBackToProjects} size="mediumWide">
            Back to Project List
          </Button>
        )}
      </div>
    </div>
  );
};
