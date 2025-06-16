import { type ImageAsset } from '../store/assets';
import { FilterMode } from '../store/filters';
import { composeDimensions } from './helpers';

export const applyFilters = ({
  assets,
  filterTags,
  filterSizes,
  filterExtensions,
  filterMode,
}: {
  assets: ImageAsset[];
  filterTags: string[];
  filterSizes: string[];
  filterExtensions: string[];
  filterMode: FilterMode;
}) => {
  // Quick return if no filters are active or show all mode is selected
  if (
    (filterTags.length === 0 &&
      filterSizes.length === 0 &&
      filterExtensions.length === 0) ||
    filterMode === FilterMode.SHOW_ALL
  ) {
    return assets;
  }

  // Create a Set for faster lookups when checking dimensions and extensions
  const filterSizesSet = new Set(filterSizes);
  const filterExtensionsSet = new Set(filterExtensions);

  return assets.filter((img: ImageAsset) => {
    // Check dimensions and extension
    const dimensionsComposed = composeDimensions(img.dimensions);
    const sizeMatches =
      filterSizes.length === 0 || filterSizesSet.has(dimensionsComposed);
    const extensionMatches =
      filterExtensions.length === 0 ||
      filterExtensionsSet.has(img.fileExtension);

    // If no tag filters, just check size and extension
    if (filterTags.length === 0) {
      // If we have both size and extension filters, both must match
      if (filterSizes.length > 0 && filterExtensions.length > 0) {
        return sizeMatches && extensionMatches;
      }
      // Otherwise just check what we have
      return sizeMatches && extensionMatches;
    }

    // Match based on filter mode
    if (filterMode === FilterMode.MATCH_ALL) {
      const allTagsMatch = filterTags.every((tag) => img.tagList.includes(tag));

      // If we have other filters too, all must match
      return allTagsMatch && sizeMatches && extensionMatches;
    }

    if (filterMode === FilterMode.MATCH_ANY) {
      // For MATCH_ANY, either tags, size, or extension can match
      const anyTagMatches = filterTags.some((tag) => img.tagList.includes(tag));
      return anyTagMatches || sizeMatches || extensionMatches;
    }

    // This should never happen if using enum correctly
    console.error('Unknown filter mode:', filterMode);
    return false;
  });
};
