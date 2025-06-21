'use server';
import { createReadStream } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';

import { imageDimensionsFromStream } from 'image-dimensions';

const dataPath = './public/assets';
// Default batch size for tag writing operations - not exported to comply with 'use server' rules
const DEFAULT_TAG_BATCH_SIZE = 20;

import {
  type ImageAsset,
  ImageDimensions,
  IoState,
  TagState,
} from '../store/assets';

// Returns just a list of image files without processing them
export const getImageFileList = async (): Promise<string[]> => {
  const dir = path.resolve(dataPath);

  const filenames = fs.readdirSync(dir);

  return filenames.filter(
    (file) => path.extname(file) === '.png' || path.extname(file) === '.jpg',
  );
};

// Process multiple image files at once and return their asset data
// This reduces the number of round-trips between client and server
export const getMultipleImageAssetDetails = async (
  files: string[],
): Promise<ImageAsset[]> => {
  // Process all files in parallel on the server side
  const promises = files.map((file) => getImageAssetDetails(file));
  return Promise.all(promises);
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

// Legacy function for backward compatibility
export const getImageFiles = async (): Promise<ImageAsset[]> => {
  const imageFiles = await getImageFileList();
  const imageAssets: ImageAsset[] = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const asset = await getImageAssetDetails(file);
    imageAssets.push(asset);
  }

  return imageAssets;
};

// Batch-oriented version of getImageFiles
export const getImageFilesBatched = async (
  batchSize = 50,
): Promise<ImageAsset[]> => {
  const imageFiles = await getImageFileList();
  const imageAssets: ImageAsset[] = [];

  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < imageFiles.length; i += batchSize) {
    const batch = imageFiles.slice(i, i + batchSize);
    const batchResults = await getMultipleImageAssetDetails(batch);
    imageAssets.push(...batchResults);
  }

  return imageAssets;
};

export const writeTagsToDisk = async (
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

// Tag write operation interface (not exported directly due to 'use server' constraints)
interface TagWriteOperation {
  fileId: string;
  composedTags: string;
}

/**
 * Write multiple tag sets to disk in a single operation
 * @param operations Array of tag write operations to perform
 * @param maxBatchSize Maximum number of operations to process in a single batch (optional)
 * @returns Result object with success flag and individual results
 */
export const writeMultipleTagsToDisk = async (
  operations: TagWriteOperation[],
  maxBatchSize = DEFAULT_TAG_BATCH_SIZE,
): Promise<{
  success: boolean;
  results: { fileId: string; success: boolean }[];
}> => {
  // If operations exceed max batch size, split into smaller batches
  if (maxBatchSize > 0 && operations.length > maxBatchSize) {
    const allResults: { fileId: string; success: boolean }[] = [];
    let allSuccess = true;

    // Process in batches of maxBatchSize
    for (let i = 0; i < operations.length; i += maxBatchSize) {
      const batchOperations = operations.slice(i, i + maxBatchSize);
      // Process this batch (recursively calls this function with a smaller batch)
      const batchResult = await writeMultipleTagsToDisk(batchOperations, 0); // 0 disables further splitting

      allResults.push(...batchResult.results);
      allSuccess = allSuccess && batchResult.success;
    }

    return {
      success: allSuccess,
      results: allResults,
    };
  }

  // Process the batch (or individual operations if under max size)
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

  // Overall operation succeeds if all individual writes succeeded
  const success = results.every((result) => result.success);

  return {
    success,
    results,
  };
};
