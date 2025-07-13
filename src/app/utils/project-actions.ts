'use server';

import fs from 'node:fs';
import path from 'node:path';

import { isSupportedImageExtension, PROJECTS_FOLDER } from '@/app/constants';

type Project = {
  name: string;
  path: string;
  imageCount?: number;
};

/**
 * Get a list of project folders from the projects directory
 * Each project folder should contain image files and associated txt files
 */
export const getProjectList = async (): Promise<Project[]> => {
  try {
    // Check if the projects folder exists
    if (!fs.existsSync(PROJECTS_FOLDER)) {
      console.warn(`Projects folder does not exist: ${PROJECTS_FOLDER}`);
      return [];
    }

    // Read the directory contents
    const entries = fs.readdirSync(PROJECTS_FOLDER, { withFileTypes: true });

    // Filter to only include directories (project folders)
    const projectFolders = entries.filter((entry) => entry.isDirectory());

    // Map to project objects and count images
    const projects: Project[] = await Promise.all(
      projectFolders.map(async (folder) => {
        const projectPath = path.join(PROJECTS_FOLDER, folder.name);
        let imageCount = 0;

        try {
          // Count image files in the project folder
          const projectFiles = fs.readdirSync(projectPath);
          imageCount = projectFiles.filter((file) =>
            isSupportedImageExtension(path.extname(file)),
          ).length;
        } catch (error) {
          console.warn(`Error reading project folder ${projectPath}:`, error);
          // Continue with imageCount = 0
        }

        return {
          name: folder.name,
          path: projectPath,
          imageCount,
        };
      }),
    );

    // Sort projects by name
    return projects.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error reading projects folder:', error);
    throw new Error(`Failed to read projects from ${PROJECTS_FOLDER}`);
  }
};
