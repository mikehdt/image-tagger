import { type ImageAsset, TagState } from '../store/assets';
import { hasState } from '../store/assets/utils';
import { FilterMode } from '../store/filters';
import { composeDimensions } from './helpers';

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
  filterMode,
  showModified,
  searchQuery,
  selectedAssets,
}: {
  assets: ImageAsset[];
  filterTags: string[];
  filterSizes: string[];
  filterBuckets: string[];
  filterExtensions: string[];
  filterMode: FilterMode;
  showModified?: boolean;
  searchQuery?: string;
  selectedAssets?: string[];
}): ImageAssetWithIndex[] => {
  // Handle the case where no filters are active - show everything
  // BUT not for SELECTED_ASSETS or TAGLESS modes, which have their own logic
  if (
    filterMode !== FilterMode.SELECTED_ASSETS &&
    filterMode !== FilterMode.TAGLESS &&
    filterTags.length === 0 &&
    filterSizes.length === 0 &&
    filterBuckets.length === 0 &&
    filterExtensions.length === 0 &&
    !showModified &&
    (!searchQuery || searchQuery.trim() === '')
  ) {
    // Add originalIndex to each asset (1-based for display)
    return assets.map((asset, index) => ({
      ...asset,
      originalIndex: index + 1,
    })) as ImageAssetWithIndex[];
  }

  // Create a Set for faster lookups when checking dimensions, buckets, and extensions
  const filterSizesSet = new Set(filterSizes);
  const filterBucketsSet = new Set(filterBuckets);
  const filterExtensionsSet = new Set(filterExtensions);

  // Map assets to include their original index (1-based for display)
  const assetsWithIndex = assets.map((asset, index) => ({
    ...asset,
    originalIndex: index + 1,
  })) as ImageAssetWithIndex[];

  return assetsWithIndex.filter((img: ImageAssetWithIndex) => {
    // SELECTED_ASSETS mode - only show assets that are selected
    // Apply search and modified filters to selected assets if needed
    if (filterMode === FilterMode.SELECTED_ASSETS) {
      if (!selectedAssets || selectedAssets.length === 0) {
        return false; // No assets selected, so show nothing
      }

      // First check if the asset is selected
      if (!selectedAssets.includes(img.fileId)) {
        return false;
      }

      // Apply search filter if provided
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase();
        const assetName = img.fileId.toLowerCase();
        if (!assetName.includes(query)) {
          return false;
        }
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
    // Apply search filter first (if provided)
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.trim().toLowerCase();
      const assetName = img.fileId.toLowerCase();
      if (!assetName.includes(query)) {
        return false; // Skip this asset if it doesn't match the search
      }
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

    // For all MATCH modes (except TAGLESS), if there are no tag filters but we have size/bucket/extension filters,
    // just apply the size/bucket/extension filters
    if (filterTags.length === 0 && filterMode !== FilterMode.TAGLESS) {
      return sizeMatches && bucketMatches && extensionMatches;
    }

    // MATCH_ALL mode - asset must have ALL selected tags and meet size/bucket/extension criteria
    if (filterMode === FilterMode.MATCH_ALL) {
      // Every selected tag must be present in the asset's tags
      const allTagsMatch = filterTags.every((tag) => img.tagList.includes(tag));
      return allTagsMatch && sizeMatches && bucketMatches && extensionMatches;
    }

    // MATCH_ANY mode - asset must have ANY selected tag and meet size/bucket/extension criteria
    if (filterMode === FilterMode.MATCH_ANY) {
      // At least one selected tag must be present in the asset's tags
      const anyTagMatches = filterTags.some((tag) => img.tagList.includes(tag));

      // Size, bucket, and extension filters are still combined with AND logic
      return anyTagMatches && sizeMatches && bucketMatches && extensionMatches;
    }

    // MATCH_NONE mode - asset must have NONE of the selected tags and meet size/bucket/extension criteria
    if (filterMode === FilterMode.MATCH_NONE) {
      // None of the selected tags can be present in the asset's tags
      const noTagMatches = !filterTags.some((tag) => img.tagList.includes(tag));

      // Size, bucket, and extension filters are still combined with AND logic
      return noTagMatches && sizeMatches && bucketMatches && extensionMatches;
    }

    // TAGLESS mode - asset must have no tags at all and meet size/bucket/extension criteria
    if (filterMode === FilterMode.TAGLESS) {
      // Check if the asset has no tags (considering only tags not marked for deletion)
      const activeTags = img.tagList.filter(
        (tag) => !hasState(img.tagStatus[tag], TagState.TO_DELETE),
      );
      const hasNoTags = activeTags.length === 0;

      // Size, bucket, and extension filters are still combined with AND logic
      return hasNoTags && sizeMatches && bucketMatches && extensionMatches;
    }

    // This should never happen if using enum correctly
    console.error('Unknown filter mode:', filterMode);
    return false;
  });
};
