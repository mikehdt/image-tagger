import { DEFAULT_BATCH_SIZE } from '../../constants';
import { ImageAsset, SaveAssetResult, TagState } from './types';
import { hasState } from './utils';

/**
 * Get updated tags from an asset, filtering out tags marked for deletion
 * @param asset The image asset to process
 * @returns Array of tags that should be saved
 */
export function getUpdatedTags(asset: ImageAsset): string[] {
  return asset.tagList.filter(
    (tag) => !hasState(asset.tagStatus[tag], TagState.TO_DELETE),
  );
}

/**
 * Creates a flattened string of tags for disk storage
 * @param tags Array of tags to flatten
 * @returns Comma-separated list of tags
 */
export function createFlattenedTags(tags: string[]): string {
  return tags.join(', ');
}

/**
 * Create a clean tag status object with all tags marked as SAVED
 * @param tags Array of tags to mark as saved
 * @returns Object mapping tags to their saved state
 */
export function createCleanTagStatus(tags: string[]): {
  [key: string]: number;
} {
  return tags.reduce(
    (acc, tag) => {
      acc[tag] = TagState.SAVED;
      return acc;
    },
    {} as { [key: string]: number },
  );
}

/**
 * Creates a SaveAssetResult object for storing in Redux
 * @param asset The asset that was saved
 * @param updatedTags The tags after filtering
 * @param newTagStatus The clean tag status object
 * @param images All images in the store (for finding index)
 * @returns SaveAssetResult object ready for the reducer
 */
export function createSaveAssetResult(
  asset: ImageAsset,
  updatedTags: string[],
  newTagStatus: { [key: string]: number },
  images: ImageAsset[],
): SaveAssetResult {
  return {
    assetIndex: images.findIndex((element) => element.fileId === asset.fileId),
    fileId: asset.fileId,
    tagList: updatedTags,
    tagStatus: newTagStatus,
    savedTagList: [...updatedTags], // Store the current order as the saved order
  };
}

/**
 * Finds assets with modified tags (not in SAVED state)
 * @param images Array of assets to check
 * @returns Array of assets with modified tags
 */
export function findModifiedAssets(images: ImageAsset[]): ImageAsset[] {
  return images.filter((asset) =>
    asset.tagList.some(
      (tag) => !hasState(asset.tagStatus[tag], TagState.SAVED),
    ),
  );
}

/**
 * Process a batch of write results and create SaveAssetResults
 * @param writeResults Results of writing tags to disk
 * @param modifiedAssets List of assets that were modified
 * @param images Full list of images
 * @returns Object with results array and success/error counters
 */
export function processSaveResults(
  writeResults: { fileId: string; success: boolean }[],
  modifiedAssets: ImageAsset[],
  images: ImageAsset[],
): {
  results: SaveAssetResult[];
  successCount: number;
  errorCount: number;
} {
  const results: SaveAssetResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const writeResult of writeResults) {
    const asset = modifiedAssets.find((a) => a.fileId === writeResult.fileId);

    if (asset && writeResult.success) {
      // Process successful write
      const updateTags = getUpdatedTags(asset);
      const newTagStatus = createCleanTagStatus(updateTags);

      // Create and add save result to results array
      results.push(
        createSaveAssetResult(asset, updateTags, newTagStatus, images),
      );

      successCount++;
    } else {
      errorCount++;
      console.error(`Failed to save asset ${writeResult.fileId} to disk`);
    }
  }

  return {
    results,
    successCount,
    errorCount,
  };
}

/**
 * Process items in batches with progress tracking
 * @param items Array of items to process
 * @param processBatchFn Function to process a batch of items
 * @param updateProgressFn Function to update progress
 * @param totalItems Total number of items for progress tracking
 * @param fallbackFn Function to handle individual items if batch fails
 * @param batchSize Size of each batch (defaults to constant)
 * @returns Array of processed results
 */
export async function processBatchesWithProgress<T, R, F = unknown>(
  items: T[],
  processBatchFn: (batch: T[]) => Promise<R[]>,
  updateProgressFn: (completed: number, total: number, failed?: number) => void,
  totalItems: number,
  fallbackFn?: (item: T, index: number) => Promise<F | null>,
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<R[]> {
  const results: R[] = [];
  let completedCount = 0;

  // Process files in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    try {
      // Process an entire batch
      const batchResults = await processBatchFn(batch);

      // Add results to collection
      results.push(...batchResults);

      // Update progress
      completedCount += batchResults.length;
      updateProgressFn(completedCount, totalItems);
    } catch (error) {
      console.error(`Error processing batch starting at index ${i}:`, error);

      // If a fallback function is provided, use it for individual processing
      if (fallbackFn) {
        for (let j = 0; j < batch.length; j++) {
          try {
            const result = await fallbackFn(batch[j], i + j);
            if (result) results.push(result as unknown as R);
          } catch (itemError) {
            console.error(`Error processing item ${i + j}:`, itemError);
          } finally {
            completedCount++;
            updateProgressFn(completedCount, totalItems);
          }
        }
      }
    }
  }

  return results;
}
