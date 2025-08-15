'use server';
import { createReadStream } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';

import { imageDimensionsFromStream } from 'image-dimensions';

import { isSupportedImageExtension } from '@/app/constants';

import {
  type ImageAsset,
  ImageDimensions,
  IoState,
  TagState,
} from '../store/assets';
import { calculateKohyaBucket, KOHYA_CONFIGS } from './image-utils';

/**
 * Get the current data path - either from provided project path or default
 */
const getCurrentDataPath = async (projectPath?: string): Promise<string> => {
  if (!projectPath) {
    return 'public/assets';
  }

  // Check if the projectPath is already a full absolute path
  if (path.isAbsolute(projectPath)) {
    return projectPath;
  }

  // If it's not absolute, treat it as a project name and construct the full path
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      const projectsFolder = config.projectsFolder || 'public/assets';
      return path.join(projectsFolder, projectPath);
    }
  } catch (error) {
    console.warn('Failed to read config, using default:', error);
  }

  // Fallback to default if config reading fails
  return path.join('public/assets', projectPath);
};

/**
 * Helper function to detect duplicate fileIds and return filtered results
 * @param files Array of image filenames
 * @returns Object with unique files and any duplicate warnings
 */
const detectDuplicateFileIds = (
  files: string[],
): {
  uniqueFiles: string[];
  duplicateWarnings: string[];
} => {
  const fileIdMap = new Map<string, string[]>();

  // Group files by their fileId (filename without extension)
  files.forEach((file) => {
    const fileId = file.substring(0, file.lastIndexOf('.'));
    if (!fileIdMap.has(fileId)) {
      fileIdMap.set(fileId, []);
    }
    fileIdMap.get(fileId)!.push(file);
  });

  const uniqueFiles: string[] = [];
  const duplicateWarnings: string[] = [];

  // Process each group and identify duplicates
  fileIdMap.forEach((filesGroup, fileId) => {
    if (filesGroup.length > 1) {
      duplicateWarnings.push(
        `Duplicate fileId "${fileId}" found in files: ${filesGroup.join(', ')}. Using: ${filesGroup[0]}`,
      );
      uniqueFiles.push(filesGroup[0]); // Use the first file found
    } else {
      uniqueFiles.push(filesGroup[0]);
    }
  });

  return { uniqueFiles, duplicateWarnings };
};

// Returns just a list of image files without processing them
export const getImageFileList = async (
  projectPath?: string,
): Promise<string[]> => {
  const dataPath = await getCurrentDataPath(projectPath);
  // Use the path directly if it's absolute, otherwise resolve it relative to cwd
  const dir = path.isAbsolute(dataPath) ? dataPath : path.resolve(dataPath);

  const filenames = fs.readdirSync(dir);

  const imageFiles = filenames.filter((file) =>
    isSupportedImageExtension(path.extname(file)),
  );

  // Check for duplicate fileIds (same base name with different extensions)
  const { uniqueFiles, duplicateWarnings } = detectDuplicateFileIds(imageFiles);

  // Log warnings if any duplicates were found
  if (duplicateWarnings.length > 0) {
    console.warn('File naming conflicts detected:');
    duplicateWarnings.forEach((warning) => console.warn(warning));
  }

  return uniqueFiles;
};

/**
 * Process multiple image files at once and return their asset data
 * @param files Array of files to process
 * @param projectPath Optional project path, uses default if not provided
 * @returns Array of image assets and tracking of failed files
 */
export const getMultipleImageAssetDetails = async (
  files: string[],
  projectPath?: string,
): Promise<{ assets: ImageAsset[]; errors: string[] }> => {
  // Check for duplicate fileIds and get filtered files
  const { uniqueFiles, duplicateWarnings } = detectDuplicateFileIds(files);

  // Convert duplicate warnings to error format for return
  const duplicateErrors = duplicateWarnings.map(
    (warning) => `FILE_NAMING_CONFLICT: ${warning}`,
  );

  // Log warnings about duplicates
  if (duplicateWarnings.length > 0) {
    console.warn('File naming conflicts detected in batch processing:');
    duplicateWarnings.forEach((warning) => console.warn(warning));
  }

  const results = await Promise.allSettled(
    uniqueFiles.map((file) => getImageAssetDetails(file, projectPath)),
  );

  const assets: ImageAsset[] = [];
  const errors: string[] = [...duplicateErrors]; // Start with duplicate errors

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      assets.push(result.value);
    } else {
      // Store the filename for failed loads
      errors.push(uniqueFiles[index]);
      console.error(
        `Failed to load asset ${uniqueFiles[index]}:`,
        result.reason,
      );
    }
  });

  return { assets, errors };
};

// Process a single image file and return its asset data
export const getImageAssetDetails = async (
  file: string,
  projectPath?: string,
): Promise<ImageAsset> => {
  const fileId = file.substring(0, file.lastIndexOf('.'));
  const fileExtension = file.substring(file.lastIndexOf('.') + 1);
  const currentDataPath = await getCurrentDataPath(projectPath);
  const fullFilePath = `${currentDataPath}/${file}`;

  // Get file stats for last modified time
  const stats = fs.statSync(fullFilePath);
  const lastModified = Math.floor(stats.mtime.getTime() / 1000); // Unix timestamp in seconds

  // @ts-expect-error ReadableStream.from being weird
  const stream = ReadableStream.from(createReadStream(fullFilePath));

  const dimensions = (await imageDimensionsFromStream(
    stream,
  )) as ImageDimensions;

  // Calculate Kohya bucket for this image (using SDXL 1024 settings)
  const bucket = calculateKohyaBucket(
    dimensions.width,
    dimensions.height,
    KOHYA_CONFIGS.SDXL_1024,
  );

  let tagStatus: { [key: string]: TagState } = {};
  let tagList: string[] = [];

  try {
    // Check if the tag file exists first before trying to read it
    if (fs.existsSync(`${currentDataPath}/${fileId}.txt`)) {
      const tagContent = fs
        .readFileSync(`${currentDataPath}/${fileId}.txt`, 'utf8')
        .trim();

      // Only process if the file has actual content
      if (tagContent) {
        tagStatus = tagContent
          .split(', ')
          .filter((tag) => tag.trim() !== '') // Filter out empty tags
          .reduce(
            (acc, tag) => ({
              ...acc,
              [tag.trim()]: TagState.SAVED,
            }),
            {} as { [key: string]: TagState },
          );

        tagList = Object.keys(tagStatus);
      }
    } else {
      // File doesn't exist - use empty tags but log this info
      console.log(`No tag file found for ${fileId}, using empty tags`);
    }
  } catch (err) {
    // Other errors during read operation
    console.error(`Error reading tags for ${fileId}:`, err);
  }

  return {
    ioState: IoState.COMPLETE,
    fileId,
    fileExtension,
    dimensions,
    bucket,
    tagStatus,
    tagList,
    savedTagList: [...tagList], // Make a copy of the initial tag list
    lastModified,
  };
};

export const saveAssetTags = async (
  fileId: string,
  composedTags: string,
  projectPath?: string,
): Promise<boolean> => {
  try {
    const currentDataPath = await getCurrentDataPath(projectPath);
    fs.writeFileSync(`${currentDataPath}/${fileId}.txt`, composedTags);
    return true;
  } catch (err) {
    console.error('Disk I/O error:', err);
    return false;
  }
};

// Export interface for tag write operations
export interface AssetTagOperation {
  fileId: string;
  composedTags: string;
}

/**
 * Write multiple tag sets to disk in a single operation
 * @param operations Array of tag write operations to perform
 * @param projectPath Optional project path, uses default if not provided
 * @returns Result object with success flag, individual results, and list of failed files
 */
export const saveMultipleAssetTags = async (
  operations: AssetTagOperation[],
  projectPath?: string,
): Promise<{
  success: boolean;
  results: { fileId: string; success: boolean }[];
  errors: string[]; // Add list of failed files
}> => {
  // Process all operations in parallel
  const currentDataPath = await getCurrentDataPath(projectPath);
  const results = await Promise.all(
    operations.map(async ({ fileId, composedTags }) => {
      try {
        fs.writeFileSync(`${currentDataPath}/${fileId}.txt`, composedTags);
        return { fileId, success: true };
      } catch (err) {
        console.error(`Disk I/O error for ${fileId}:`, err);
        return { fileId, success: false };
      }
    }),
  );

  // Collect errors from results
  const errors = results
    .filter((result) => !result.success)
    .map((result) => result.fileId);

  // Overall operation succeeds if all individual writes succeeded
  const success = results.every((result) => result.success);

  return {
    success,
    results,
    errors,
  };
};
