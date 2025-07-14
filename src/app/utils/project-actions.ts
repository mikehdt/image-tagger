'use server';

import fs from 'node:fs';
import path from 'node:path';

import {
  isSupportedImageExtension,
  PROJECT_INFO_FOLDER,
  PROJECTS_FOLDER,
} from '@/app/constants';

type ProjectInfo = {
  title?: string;
  color?: 'slate' | 'rose' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'stone';
  thumbnail?: string;
  hidden?: boolean;
  featured?: boolean;
};

type Project = {
  name: string;
  path: string;
  imageCount?: number;
  title?: string;
  color?: 'slate' | 'rose' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'stone';
  thumbnail?: string;
  hidden?: boolean;
  featured?: boolean;
};

/**
 * Read project info from _info/project.json if it exists
 */
const readProjectInfo = (projectPath: string): ProjectInfo | null => {
  try {
    const infoFolderPath = path.join(projectPath, PROJECT_INFO_FOLDER);
    const projectInfoPath = path.join(infoFolderPath, 'project.json');

    if (!fs.existsSync(projectInfoPath)) {
      return null;
    }

    const infoContent = fs.readFileSync(projectInfoPath, 'utf-8');
    const info = JSON.parse(infoContent) as ProjectInfo;

    // Validate thumbnail file exists if specified
    if (info.thumbnail) {
      const thumbnailPath = path.join(infoFolderPath, info.thumbnail);
      if (!fs.existsSync(thumbnailPath)) {
        console.warn(`Thumbnail file not found: ${thumbnailPath}`);
        info.thumbnail = undefined;
      }
    }

    return info;
  } catch (error) {
    console.warn(`Error reading project info for ${projectPath}:`, error);
    return null;
  }
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

        // Read project info if available
        const projectInfo = readProjectInfo(projectPath);

        return {
          name: folder.name,
          path: projectPath,
          imageCount,
          title: projectInfo?.title,
          color: projectInfo?.color,
          thumbnail: projectInfo?.thumbnail,
          hidden: projectInfo?.hidden || false,
          featured: projectInfo?.featured || false,
        };
      }),
    );

    // Filter out hidden projects
    const visibleProjects = projects.filter((project) => !project.hidden);

    // Separate featured and regular projects
    const featuredProjects = visibleProjects
      .filter((project) => project.featured)
      .sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));

    const regularProjects = visibleProjects
      .filter((project) => !project.featured)
      .sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));

    // Return featured projects first, then regular projects
    return [...featuredProjects, ...regularProjects];
  } catch (error) {
    console.error('Error reading projects folder:', error);
    throw new Error(`Failed to read projects from ${PROJECTS_FOLDER}`);
  }
};
