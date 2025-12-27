import {
  type ImageAsset,
  SortDirection,
  SortType,
  TagState,
} from '../store/assets';
import { hasState } from '../store/assets/utils';
import { FilterMode } from '../store/filters';
import { composeDimensions, naturalCompare } from './helpers';

// Define an interface that extends ImageAsset with originalIndex
interface ImageAssetWithIndex extends ImageAsset {
  originalIndex: number;
}

export const applyFilters = ({
  assets,
  filterTags,
  filterSizes,
  filterBuckets,
  filterExtensions,
  filenamePatterns,
  filterMode,
  showModified,
  selectedAssets,
  sortType,
  sortDirection,
}: {
  assets: ImageAsset[];
  filterTags: string[];
  filterSizes: string[];
  filterBuckets: string[];
  filterExtensions: string[];
  filenamePatterns?: string[];
  filterMode: FilterMode;
  showModified?: boolean;
  selectedAssets?: string[];
  sortType?: SortType;
  sortDirection?: SortDirection;
}): ImageAssetWithIndex[] => {
  // First, apply sorting to get the "true" sorted order
  // Add temporary index to preserve original file system order initially
  const assetsWithTempIndex = assets.map((asset, index) => ({
    ...asset,
    originalIndex: index + 1, // Temporary - will be replaced after sorting
  })) as ImageAssetWithIndex[];

  // Apply sorting first to establish the "true" order for the current sort
  const sortedAssets = applySorting(
    assetsWithTempIndex,
    sortType,
    sortDirection,
    selectedAssets,
  );

  // Now assign the originalIndex based on the sorted position (this is the "true" asset number)
  const sortedAssetsWithCorrectIndex = sortedAssets.map((asset, index) => ({
    ...asset,
    originalIndex: index + 1, // 1-based index based on sorted order
  }));

  // Handle the case where no filters are active - show everything
  // BUT not for SELECTED_ASSETS or TAGLESS modes, which have their own logic
  const hasFilenamePatterns = filenamePatterns && filenamePatterns.length > 0;
  if (
    filterMode !== FilterMode.SELECTED_ASSETS &&
    filterMode !== FilterMode.TAGLESS &&
    filterTags.length === 0 &&
    filterSizes.length === 0 &&
    filterBuckets.length === 0 &&
    filterExtensions.length === 0 &&
    !hasFilenamePatterns &&
    !showModified
  ) {
    // Return all sorted assets with correct indices
    return sortedAssetsWithCorrectIndex;
  }

  // Create a Set for faster lookups when checking dimensions, buckets, and extensions
  const filterSizesSet = new Set(filterSizes);
  const filterBucketsSet = new Set(filterBuckets);
  const filterExtensionsSet = new Set(filterExtensions);

  // Helper to check if filename matches any of the patterns (OR'd together, case-insensitive)
  const matchesFilenamePatterns = (filename: string): boolean => {
    if (!hasFilenamePatterns) return true;
    const lowerFilename = filename.toLowerCase();
    // Patterns match if ANY pattern is found in the filename
    return filenamePatterns!.some((pattern) => lowerFilename.includes(pattern));
  };

  const filteredAssets = sortedAssetsWithCorrectIndex.filter(
    (img: ImageAssetWithIndex) => {
      // SELECTED_ASSETS mode - only show assets that are selected
      // Apply filename patterns and modified filters to selected assets if needed
      if (filterMode === FilterMode.SELECTED_ASSETS) {
        if (!selectedAssets || selectedAssets.length === 0) {
          return false; // No assets selected, so show nothing
        }

        // First check if the asset is selected
        if (!selectedAssets.includes(img.fileId)) {
          return false;
        }

        // Apply filename patterns filter if provided
        if (!matchesFilenamePatterns(img.fileId)) {
          return false;
        }

        // Apply modified filter if needed
        if (showModified) {
          const hasModifiedTags = img.tagList.some(
            (tag) => !hasState(img.tagStatus[tag], TagState.SAVED),
          );
          if (!hasModifiedTags) {
            return false;
          }
        }

        return true; // Asset is selected and passes other filters
      }

      // For all other filter modes, apply the standard logic
      // Apply filename patterns filter first (if provided)
      if (!matchesFilenamePatterns(img.fileId)) {
        return false; // Skip this asset if it doesn't match any pattern
      }

      // Check modified status first if needed (applies to all filter modes)
      if (showModified) {
        const hasModifiedTags = img.tagList.some(
          (tag) => !hasState(img.tagStatus[tag], TagState.SAVED),
        );
        if (!hasModifiedTags) {
          return false; // Skip this asset if not modified and we want modified
        }
      }

      // SHOW_ALL mode - show all assets regardless of tag/size/extension filters
      // The only filter that applies in SHOW_ALL mode is the modified filter, which was already applied above
      if (filterMode === FilterMode.SHOW_ALL) {
        return true; // Show everything that passed the modified filter check (if any)
      }

      // For MATCH modes, apply standard dimension, bucket, and extension filters
      const dimensionsComposed = composeDimensions(img.dimensions);
      const bucketComposed = `${img.bucket.width}×${img.bucket.height}`;
      const sizeMatches =
        filterSizes.length === 0 || filterSizesSet.has(dimensionsComposed);
      const bucketMatches =
        filterBuckets.length === 0 || filterBucketsSet.has(bucketComposed);
      const extensionMatches =
        filterExtensions.length === 0 ||
        filterExtensionsSet.has(img.fileExtension);

      // MATCH_ALL mode - asset must have ALL selected tags and meet size/bucket/extension criteria
      if (filterMode === FilterMode.MATCH_ALL) {
        // For MATCH_ALL, everything must match (intersection)
        const allTagsMatch =
          filterTags.length === 0 ||
          filterTags.every((tag) => img.tagList.includes(tag));
        return allTagsMatch && sizeMatches && bucketMatches && extensionMatches;
      }

      // MATCH_ANY mode - asset must match ANY of the selected filters (tags, sizes, buckets, or extensions)
      if (filterMode === FilterMode.MATCH_ANY) {
        // If no filters are selected, show all assets
        if (
          filterTags.length === 0 &&
          filterSizes.length === 0 &&
          filterBuckets.length === 0 &&
          filterExtensions.length === 0
        ) {
          return true;
        }

        // Check if ANY of the filter criteria match
        const anyTagMatches =
          filterTags.length > 0 &&
          filterTags.some((tag) => img.tagList.includes(tag));
        const anySizeMatches =
          filterSizes.length > 0 && filterSizesSet.has(dimensionsComposed);
        const anyBucketMatches =
          filterBuckets.length > 0 && filterBucketsSet.has(bucketComposed);
        const anyExtensionMatches =
          filterExtensions.length > 0 &&
          filterExtensionsSet.has(img.fileExtension);

        // Return true if ANY of the filter types match (union logic)
        return (
          anyTagMatches ||
          anySizeMatches ||
          anyBucketMatches ||
          anyExtensionMatches
        );
      }

      // MATCH_NONE mode - asset must match NONE of the selected filters (exclude any matches)
      if (filterMode === FilterMode.MATCH_NONE) {
        // If no filters are selected, show all assets
        if (
          filterTags.length === 0 &&
          filterSizes.length === 0 &&
          filterBuckets.length === 0 &&
          filterExtensions.length === 0
        ) {
          return true;
        }

        // Check if ANY of the filter criteria match (we want to exclude these)
        const anyTagMatches =
          filterTags.length > 0 &&
          filterTags.some((tag) => img.tagList.includes(tag));
        const anySizeMatches =
          filterSizes.length > 0 && filterSizesSet.has(dimensionsComposed);
        const anyBucketMatches =
          filterBuckets.length > 0 && filterBucketsSet.has(bucketComposed);
        const anyExtensionMatches =
          filterExtensions.length > 0 &&
          filterExtensionsSet.has(img.fileExtension);

        // Return true only if NONE of the filter types match (exclude logic)
        return !(
          anyTagMatches ||
          anySizeMatches ||
          anyBucketMatches ||
          anyExtensionMatches
        );
      }

      // TAGLESS mode - asset must have no persisted tags and meet size/bucket/extension criteria
      if (filterMode === FilterMode.TAGLESS) {
        // Check if the asset has no persisted tags (only TO_ADD or TO_DELETE tags are allowed)
        const persistedTags = img.tagList.filter(
          (tag) =>
            !hasState(img.tagStatus[tag], TagState.TO_DELETE) &&
            !hasState(img.tagStatus[tag], TagState.TO_ADD),
        );
        const hasNoPersistedTags = persistedTags.length === 0;

        // Size, bucket, and extension filters are still combined with AND logic
        return (
          hasNoPersistedTags && sizeMatches && bucketMatches && extensionMatches
        );
      }

      // This should never happen if using enum correctly
      console.error('Unknown filter mode:', filterMode);
      return false;
    },
  );

  // Return filtered results (already sorted with correct indices)
  return filteredAssets;
};

/**
 * Apply sorting to an array of assets
 */
const applySorting = (
  assets: ImageAssetWithIndex[],
  sortType?: SortType,
  sortDirection?: SortDirection,
  selectedAssets?: string[],
): ImageAssetWithIndex[] => {
  if (!sortType || !sortDirection) {
    return assets; // Return unsorted if no sort parameters
  }

  const selectedSet = new Set(selectedAssets || []);
  const direction = sortDirection === SortDirection.ASC ? 1 : -1;

  return [...assets].sort((a, b) => {
    let comparison = 0;

    switch (sortType) {
      case SortType.NAME:
        comparison = naturalCompare(a.fileId, b.fileId);
        break;

      case SortType.IMAGE_SIZE:
        // Sort by image dimensions (width first, then height) to match size view logic
        if (a.dimensions.width !== b.dimensions.width) {
          comparison = a.dimensions.width - b.dimensions.width;
        } else {
          comparison = a.dimensions.height - b.dimensions.height;
        }
        break;

      case SortType.BUCKET_SIZE:
        // Sort by bucket dimensions (width first, then height) to match bucket view logic
        if (a.bucket.width !== b.bucket.width) {
          comparison = a.bucket.width - b.bucket.width;
        } else {
          comparison = a.bucket.height - b.bucket.height;
        }
        break;

      case SortType.SCALED:
        // Sort by scaling relationship between image and bucket
        // Priority: 1. Identical size, 2. Same aspect ratio, 3. Different aspect ratio
        // Within each category, sort alphabetically by asset name

        // Calculate scaling categories for both assets
        const getCategoryAndSecondary = (asset: ImageAssetWithIndex) => {
          const imageDims = asset.dimensions;
          const bucketDims = asset.bucket;

          // Check if dimensions are identical
          if (
            imageDims.width === bucketDims.width &&
            imageDims.height === bucketDims.height
          ) {
            return { category: 0, secondary: asset.fileId }; // Identical - highest priority
          }

          // Check if aspect ratios are identical (within small tolerance for floating point)
          const imageAspectRatio = imageDims.width / imageDims.height;
          const bucketAspectRatio = bucketDims.width / bucketDims.height;
          const aspectRatioTolerance = 0.001;

          if (
            Math.abs(imageAspectRatio - bucketAspectRatio) <
            aspectRatioTolerance
          ) {
            return { category: 1, secondary: asset.fileId }; // Same aspect ratio - medium priority
          }

          // Different aspect ratio - lowest priority
          return { category: 2, secondary: asset.fileId };
        };

        const aCategoryData = getCategoryAndSecondary(a);
        const bCategoryData = getCategoryAndSecondary(b);

        // First compare by category
        if (aCategoryData.category !== bCategoryData.category) {
          comparison = aCategoryData.category - bCategoryData.category;
        } else {
          // Within the same category, sort naturally by filename
          comparison = naturalCompare(
            aCategoryData.secondary,
            bCategoryData.secondary,
          );
        }
        break;

      case SortType.SELECTED:
        // Sort selected assets first
        const aSelected = selectedSet.has(a.fileId);
        const bSelected = selectedSet.has(b.fileId);
        if (aSelected && !bSelected) comparison = -1;
        else if (!aSelected && bSelected) comparison = 1;
        else comparison = 0;
        break;

      default:
        comparison = 0;
        break;
    }

    return comparison * direction;
  });
};
