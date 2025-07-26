import { type ImageAsset, SortDirection, SortType } from '@/app/store/assets';

// Constants for sort category names
export const SCALED_CATEGORIES = {
  EQUAL_SIZE: 'Equal Size',
  SAME_ASPECT: 'Scaled (Same Aspect)',
  DIFFERENT: 'Scaled',
} as const;

export const SELECTED_CATEGORIES = {
  SELECTED: 'Selected',
  NOT_SELECTED: 'Not Selected',
} as const;

// Create arrays of the category values for sorting
const SCALED_ORDER = Object.values(SCALED_CATEGORIES);
const SELECTED_ORDER = Object.values(SELECTED_CATEGORIES);

// Helper functions for type-safe category ordering
export const getScaledCategoryIndex = (category: string): number => {
  return SCALED_ORDER.findIndex((cat) => cat === category);
};

export const getSelectedCategoryIndex = (category: string): number => {
  return SELECTED_ORDER.findIndex((cat) => cat === category);
};

// Function to get sort category for an asset
export const getSortCategory = (
  asset: ImageAsset,
  sortType: SortType,
  selectedAssets: string[],
): string => {
  switch (sortType) {
    case SortType.NAME:
      const firstChar = asset.fileId.charAt(0).toLowerCase();
      if (firstChar >= '0' && firstChar <= '9') {
        return '0-9';
      } else if (firstChar >= 'a' && firstChar <= 'z') {
        return firstChar.toUpperCase();
      } else {
        return 'Other';
      }

    case SortType.IMAGE_SIZE:
      return `${asset.dimensions.width} × ${asset.dimensions.height}`;

    case SortType.BUCKET_SIZE:
      return `${asset.bucket.width} × ${asset.bucket.height}`;

    case SortType.SCALED:
      // Check if dimensions are identical
      if (
        asset.dimensions.width === asset.bucket.width &&
        asset.dimensions.height === asset.bucket.height
      ) {
        return SCALED_CATEGORIES.EQUAL_SIZE;
      }

      // Check if aspect ratios are identical (within tolerance)
      const imageAspectRatio = asset.dimensions.width / asset.dimensions.height;
      const bucketAspectRatio = asset.bucket.width / asset.bucket.height;
      const aspectRatioTolerance = 0.001;

      if (
        Math.abs(imageAspectRatio - bucketAspectRatio) < aspectRatioTolerance
      ) {
        return SCALED_CATEGORIES.SAME_ASPECT;
      }

      return SCALED_CATEGORIES.DIFFERENT;

    case SortType.SELECTED:
      return selectedAssets.includes(asset.fileId)
        ? SELECTED_CATEGORIES.SELECTED
        : SELECTED_CATEGORIES.NOT_SELECTED;

    default:
      return 'All Assets';
  }
};

// Function to sort categories based on sort type and direction
export const sortCategories = (
  categories: string[],
  sortType: SortType,
  sortDirection: SortDirection,
): string[] => {
  const sorted = [...categories].sort((a, b) => {
    let comparison = 0;

    switch (sortType) {
      case SortType.NAME:
        // Numbers first, then letters, then other
        const getOrder = (cat: string) => {
          if (cat === '0-9') return 0;
          if (cat.length === 1 && cat >= 'A' && cat <= 'Z') return 1;
          return 2;
        };

        const orderA = getOrder(a);
        const orderB = getOrder(b);

        if (orderA !== orderB) {
          comparison = orderA - orderB;
        } else {
          // Within same type, sort alphabetically
          comparison = a.localeCompare(b);
        }
        break;

      case SortType.SCALED:
        // Define order for scaled categories using constants
        const aIndex = getScaledCategoryIndex(a);
        const bIndex = getScaledCategoryIndex(b);
        comparison = aIndex - bIndex;
        break;

      case SortType.SELECTED:
        // Selected first, then not selected using constants
        const aSelectedIndex = getSelectedCategoryIndex(a);
        const bSelectedIndex = getSelectedCategoryIndex(b);
        comparison = aSelectedIndex - bSelectedIndex;
        break;

      case SortType.IMAGE_SIZE:
      case SortType.BUCKET_SIZE:
        // For size categories, parse dimensions and sort numerically
        const parseDimensions = (cat: string) => {
          const [width, height] = cat.split(' × ').map(Number);
          return { width: width || 0, height: height || 0 };
        };

        const aDims = parseDimensions(a);
        const bDims = parseDimensions(b);

        // Sort by width first, then height
        if (aDims.width !== bDims.width) {
          comparison = aDims.width - bDims.width;
        } else {
          comparison = aDims.height - bDims.height;
        }
        break;

      default:
        comparison = a.localeCompare(b);
        break;
    }

    return sortDirection === SortDirection.ASC ? comparison : -comparison;
  });

  return sorted;
};

export interface CategoryInfo {
  category: string;
  page: number;
  firstAssetIndex: number;
}

// Function to get all categories with their page information
export const getCategoriesWithPageInfo = (
  filteredAssets: ImageAsset[],
  sortType: SortType,
  sortDirection: SortDirection,
  selectedAssets: string[],
  paginationSize: number,
): CategoryInfo[] => {
  // Group all assets by category
  const categoryGroups: { [key: string]: number[] } = {};

  filteredAssets.forEach((asset, index) => {
    const category = getSortCategory(asset, sortType, selectedAssets);
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(index);
  });

  // Get sorted category names
  const sortedCategories = sortCategories(
    Object.keys(categoryGroups),
    sortType,
    sortDirection,
  );

  // Calculate page information for each category
  const categoriesWithPageInfo: CategoryInfo[] = [];
  let currentIndex = 0;

  for (const category of sortedCategories) {
    const assetIndices = categoryGroups[category];
    const firstAssetIndex = currentIndex;
    const page =
      paginationSize === -1
        ? 1
        : Math.floor(firstAssetIndex / paginationSize) + 1;

    categoriesWithPageInfo.push({
      category,
      page,
      firstAssetIndex,
    });

    currentIndex += assetIndices.length;
  }

  return categoriesWithPageInfo;
};
