import { type ImageAsset } from '../store/slice-assets';
import { FilterMode } from '../store/slice-filters';
import { composeDimensions } from './helpers';

export const applyFilters = ({
  assets,
  filterTags,
  filterSizes,
  filterMode,
}: {
  assets: ImageAsset[];
  filterTags: string[];
  filterSizes: string[];
  filterMode: FilterMode;
}) => {
  // Quick return if no filters are active or show all mode is selected
  if (
    (filterTags.length === 0 && filterSizes.length === 0) ||
    filterMode === FilterMode.SHOW_ALL
  ) {
    return assets;
  }

  // Create a Set for faster lookups when checking dimensions
  const filterSizesSet = new Set(filterSizes);

  return assets.filter((img: ImageAsset) => {
    // Check dimensions first as it's faster than checking tags
    const dimensionsComposed = composeDimensions(img.dimensions);
    const sizeMatches = filterSizesSet.has(dimensionsComposed);

    // If no tag filters, just check size
    if (filterTags.length === 0) {
      return sizeMatches;
    }

    // Match based on filter mode
    if (filterMode === FilterMode.MATCH_ALL) {
      const allTagsMatch = filterTags.every((tag) => img.tagList.includes(tag));

      // If we have both size and tag filters, both must match
      if (filterSizes.length > 0) {
        return allTagsMatch && sizeMatches;
      }

      // Otherwise just check if all tags match
      return allTagsMatch;
    }

    if (filterMode === FilterMode.MATCH_ANY) {
      // For MATCH_ANY, either tags or size can match
      const anyTagMatches = filterTags.some((tag) => img.tagList.includes(tag));
      return anyTagMatches || sizeMatches;
    }

    // This should never happen if using enum correctly
    console.error('Unknown filter mode:', filterMode);
    return false;
  });
};
