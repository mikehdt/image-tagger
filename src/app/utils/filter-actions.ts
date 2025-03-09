import { type ImageAsset } from '../store/slice-assets';
import { FilterMode } from '../store/slice-filters';
import { composeDimensions } from './helpers';

export const applyFilters = ({
  assets,
  filterTags,
  filterSizes,
  filterMode,
}: {
  // Revisit this typing
  assets: ImageAsset[];
  filterTags: string[];
  filterSizes: string[];
  filterMode: FilterMode;
}) => {
  if (
    (filterTags.length === 0 && filterSizes.length === 0) ||
    filterMode === FilterMode.SHOW_ALL
  ) {
    return assets;
  }

  return assets.filter((img: ImageAsset) => {
    const { tagList, dimensions } = img;
    const dimensionsComposed = composeDimensions(dimensions);
    const filteredSizes = filterSizes.includes(dimensionsComposed);

    switch (filterMode) {
      case FilterMode.MATCH_ALL: {
        const filteredTags = filterTags.every((r) => tagList.includes(r));

        if (filterTags.length && filterSizes.length) {
          return filteredTags && filteredSizes;
        } else if (filterTags.length) {
          return filteredTags;
        } else if (filterSizes.length) {
          return filteredSizes;
        }

        return false;
      }

      case FilterMode.MATCH_ANY: {
        return filterTags.some((r) => tagList.includes(r)) || filteredSizes;
      }

      default: {
        console.error('Unknown filter mode');
      }
    }
  });
};
