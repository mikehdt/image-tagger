'use server';

import fs from 'node:fs';
import path from 'node:path';

import { isSupportedImageExtension } from '@/app/constants';

// Server-side config reading function
const getServerConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      return {
        projectsFolder: config.projectsFolder || 'public/assets',
      };
    }
  } catch (error) {
    console.warn('Failed to read server config:', error);
  }

  // Return defaults if config reading fails
  return {
    projectsFolder: 'public/assets',
  };
};

type CentralizedProjectInfo = {
  title?: string;
  color?: 'slate' | 'rose' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'stone';
  thumbnail?: boolean;
  hidden?: boolean;
  featured?: boolean;
};

type LocalProjectInfo = {
  private?: boolean;
};

type Project = {
  name: string;
  path: string;
  imageCount?: number;
  title?: string;
  color?: 'slate' | 'rose' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'stone';
  thumbnail?: string;
  hidden?: boolean;
  private?: boolean;
  featured?: boolean;
};

/**
 * Find thumbnail file for a project based on project name
 * Looks for [project-name].[ext] in /public/projects/ folder
 */
const findThumbnailFile = (projectName: string): string | undefined => {
  try {
    const projectsDir = path.join(process.cwd(), 'public', 'projects');
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    for (const ext of supportedExtensions) {
      const thumbnailPath = path.join(projectsDir, `${projectName}${ext}`);
      if (fs.existsSync(thumbnailPath)) {
        return `${projectName}${ext}`;
      }
    }

    return undefined;
  } catch (error) {
    console.warn(`Error finding thumbnail for ${projectName}:`, error);
    return undefined;
  }
};

/**
 * Read centralized project info from /public/projects/[project-name].json
 */
const readCentralizedProjectInfo = (
  projectName: string,
): CentralizedProjectInfo | null => {
  try {
    const centralConfigPath = path.join(
      process.cwd(),
      'public',
      'projects',
      `${projectName}.json`,
    );

    if (!fs.existsSync(centralConfigPath)) {
      return null;
    }

    const configContent = fs.readFileSync(centralConfigPath, 'utf-8');
    const config = JSON.parse(configContent) as CentralizedProjectInfo;

    return config;
  } catch (error) {
    console.warn(
      `Error reading centralized project info for ${projectName}:`,
      error,
    );
    return null;
  }
};

/**
 * Read local project info from [project-folder]/_project.json
 * Only supports private flag
 */
const readLocalProjectInfo = (projectPath: string): LocalProjectInfo | null => {
  try {
    const localConfigPath = path.join(projectPath, '_project.json');

    if (!fs.existsSync(localConfigPath)) {
      return null;
    }

    const configContent = fs.readFileSync(localConfigPath, 'utf-8');
    const config = JSON.parse(configContent) as LocalProjectInfo;

    // Only return private flag - ignore any other properties
    return {
      private: config.private || false,
    };
  } catch (error) {
    console.warn(`Error reading local project info for ${projectPath}:`, error);
    return null;
  }
};

/**
 * Get a list of project folders from the projects directory
 * Each project folder should contain image files and associated txt files
 * Private projects are never included, hidden projects are included but filtered client-side
 */
export const getProjectList = async (): Promise<Project[]> => {
  try {
    // Get the current configuration to determine projects folder
    const config = getServerConfig();
    const projectsFolder = config.projectsFolder;

    // Check if the projects folder exists
    if (!fs.existsSync(projectsFolder)) {
      console.warn(`Projects folder does not exist: ${projectsFolder}`);
      return [];
    }

    // Read the directory contents
    const entries = fs.readdirSync(projectsFolder, { withFileTypes: true });

    // Filter to only include directories (project folders)
    const projectFolders = entries.filter((entry) => entry.isDirectory());

    // Map to project objects and count images
    const projects: Project[] = await Promise.all(
      projectFolders.map(async (folder) => {
        const projectPath = path.join(projectsFolder, folder.name);
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

        // Read centralized project info first (takes precedence)
        const centralizedInfo = readCentralizedProjectInfo(folder.name);

        // Read local project info for privacy setting
        const localInfo = readLocalProjectInfo(projectPath);

        // Combine configuration with centralized taking precedence
        const isPrivate = localInfo?.private || false;
        const isHidden = centralizedInfo?.hidden || isPrivate;

        // Find thumbnail file if thumbnail is enabled
        const thumbnailFile = centralizedInfo?.thumbnail
          ? findThumbnailFile(folder.name)
          : undefined;

        return {
          name: folder.name,
          path: projectPath,
          imageCount,
          title: centralizedInfo?.title,
          color: centralizedInfo?.color,
          thumbnail: thumbnailFile,
          hidden: isHidden,
          private: isPrivate,
          featured: centralizedInfo?.featured || false,
        };
      }),
    );

    // Always filter out private projects, but include hidden ones when includeHidden is true
    const visibleProjects = projects.filter((project) => !project.private);

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
    throw new Error(`Failed to read projects from configured folder`);
  }
};
