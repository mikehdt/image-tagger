'use server';
import { createReadStream } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';

import { imageDimensionsFromStream } from 'image-dimensions';

import {
  type ImageAsset,
  ImageDimensions,
  IoState,
  TagState,
} from '../store/assets';

const dataPath = './public/assets';

// Returns just a list of image files without processing them
export const getImageFileList = async (): Promise<string[]> => {
  const dir = path.resolve(dataPath);

  const filenames = fs.readdirSync(dir);

  return filenames.filter(
    (file) => path.extname(file) === '.png' || path.extname(file) === '.jpg',
  );
};

/**
 * Process multiple image files at once and return their asset data
 * @param files Array of files to process
 * @returns Array of image assets and tracking of failed files
 */
export const getMultipleImageAssetDetails = async (
  files: string[],
): Promise<{ assets: ImageAsset[]; errors: string[] }> => {
  const results = await Promise.allSettled(
    files.map((file) => getImageAssetDetails(file)),
  );

  const assets: ImageAsset[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      assets.push(result.value);
    } else {
      // Store the filename for failed loads
      errors.push(files[index]);
      console.error(`Failed to load asset ${files[index]}:`, result.reason);
    }
  });

  return { assets, errors };
};

// Process a single image file and return its asset data
export const getImageAssetDetails = async (
  file: string,
): Promise<ImageAsset> => {
  const fileId = file.substring(0, file.lastIndexOf('.'));
  const fileExtension = file.substring(file.lastIndexOf('.') + 1);

  // @ts-expect-error ReadableStream.from being weird
  const stream = ReadableStream.from(createReadStream(`${dataPath}/${file}`));

  const dimensions = (await imageDimensionsFromStream(
    stream,
  )) as ImageDimensions;

  let tagStatus: { [key: string]: TagState } = {};
  let tagList: string[] = [];

  try {
    const tagContent = fs
      .readFileSync(`${dataPath}/${fileId}.txt`, 'utf8')
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
  } catch (err) {
    // File doesn't exist or other error - just use empty tags
    console.log(`No tags found for ${fileId}, using empty tags`, err);
  }

  return {
    ioState: IoState.COMPLETE,
    fileId,
    fileExtension,
    dimensions,
    tagStatus,
    tagList,
    savedTagList: [...tagList], // Make a copy of the initial tag list
  };
};

export const saveAssetTags = async (
  fileId: string,
  composedTags: string,
): Promise<boolean> => {
  try {
    fs.writeFileSync(`${dataPath}/${fileId}.txt`, composedTags);
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
 * @returns Result object with success flag, individual results, and list of failed files
 */
export const saveMultipleAssetTags = async (
  operations: AssetTagOperation[],
): Promise<{
  success: boolean;
  results: { fileId: string; success: boolean }[];
  errors: string[]; // Add list of failed files
}> => {
  // Process all operations in parallel
  const results = await Promise.all(
    operations.map(async ({ fileId, composedTags }) => {
      try {
        fs.writeFileSync(`${dataPath}/${fileId}.txt`, composedTags);
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
