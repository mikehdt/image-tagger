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
  filterExtensions,
  filterMode,
  showModified,
}: {
  assets: ImageAsset[];
  filterTags: string[];
  filterSizes: string[];
  filterExtensions: string[];
  filterMode: FilterMode;
  showModified?: boolean;
}): ImageAssetWithIndex[] => {
  // Handle the case where no filters are active - show everything
  if (
    filterTags.length === 0 &&
    filterSizes.length === 0 &&
    filterExtensions.length === 0 &&
    !showModified
  ) {
    // Add originalIndex to each asset (1-based for display)
    return assets.map((asset, index) => ({
      ...asset,
      originalIndex: index + 1,
    })) as ImageAssetWithIndex[];
  }

  // Create a Set for faster lookups when checking dimensions and extensions
  const filterSizesSet = new Set(filterSizes);
  const filterExtensionsSet = new Set(filterExtensions);

  // Map assets to include their original index (1-based for display)
  const assetsWithIndex = assets.map((asset, index) => ({
    ...asset,
    originalIndex: index + 1,
  })) as ImageAssetWithIndex[];

  return assetsWithIndex.filter((img: ImageAssetWithIndex) => {
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

    // For MATCH modes, apply standard dimension and extension filters
    const dimensionsComposed = composeDimensions(img.dimensions);
    const sizeMatches =
      filterSizes.length === 0 || filterSizesSet.has(dimensionsComposed);
    const extensionMatches =
      filterExtensions.length === 0 ||
      filterExtensionsSet.has(img.fileExtension);

    // For all MATCH modes, if there are no tag filters but we have size/extension filters,
    // just apply the size/extension filters
    if (filterTags.length === 0) {
      return sizeMatches && extensionMatches;
    }

    // MATCH_ALL mode - asset must have ALL selected tags and meet size/extension criteria
    if (filterMode === FilterMode.MATCH_ALL) {
      // Every selected tag must be present in the asset's tags
      const allTagsMatch = filterTags.every((tag) => img.tagList.includes(tag));
      return allTagsMatch && sizeMatches && extensionMatches;
    }

    // MATCH_ANY mode - asset must have ANY selected tag and meet size/extension criteria
    if (filterMode === FilterMode.MATCH_ANY) {
      // At least one selected tag must be present in the asset's tags
      const anyTagMatches = filterTags.some((tag) => img.tagList.includes(tag));

      // Size and extension filters are still combined with AND logic
      return anyTagMatches && sizeMatches && extensionMatches;
    }

    // MATCH_NONE mode - asset must have NONE of the selected tags and meet size/extension criteria
    if (filterMode === FilterMode.MATCH_NONE) {
      // None of the selected tags can be present in the asset's tags
      const noTagMatches = !filterTags.some((tag) => img.tagList.includes(tag));

      // Size and extension filters are still combined with AND logic
      return noTagMatches && sizeMatches && extensionMatches;
    }

    // This should never happen if using enum correctly
    console.error('Unknown filter mode:', filterMode);
    return false;
  });
};
