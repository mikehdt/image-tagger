import { useCallback, useEffect, useMemo } from 'react';

import { selectImageSizes } from '@/app/store/assets';
import { selectFilterSizes, toggleSizeFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { decomposeDimensions, getAspectRatio } from '@/app/utils/helpers';

import { useFilterContext } from '../filter-context';
import { SortDirection, SortType } from '../types';

// Format aspect ratio as a simplified string
const formatAspectRatio = (
  width: number,
  height: number,
): { ratio: string; type: string } => {
  const [ratioWidth, ratioHeight] = getAspectRatio(width, height);

  // Common aspect ratios
  if (ratioWidth === 16 && ratioHeight === 9) {
    return { ratio: '16:9', type: 'Widescreen' };
  }
  if (ratioWidth === 4 && ratioHeight === 3) {
    return { ratio: '4:3', type: 'Standard' };
  }
  if (ratioWidth === 21 && ratioHeight === 9) {
    return { ratio: '21:9', type: 'Ultrawide' };
  }
  if (ratioWidth === 1 && ratioHeight === 1) {
    return { ratio: '1:1', type: 'Square' };
  }
  if (ratioWidth === 3 && ratioHeight === 2) {
    return { ratio: '3:2', type: 'Photo' };
  }
  if (
    (ratioWidth === 9 && ratioHeight === 16) ||
    (ratioWidth === 2 && ratioHeight === 3) ||
    (ratioWidth === 3 && ratioHeight === 4)
  ) {
    return { ratio: `${ratioWidth}:${ratioHeight}`, type: 'Portrait' };
  }

  // If ratio numbers are large, simplify by dividing both by the smaller one
  if (ratioWidth > 30 || ratioHeight > 30) {
    const smaller = Math.min(ratioWidth, ratioHeight);
    const simplifiedWidth = Math.round((ratioWidth / smaller) * 10) / 10;
    const simplifiedHeight = Math.round((ratioHeight / smaller) * 10) / 10;
    return {
      ratio: `${simplifiedWidth}:${simplifiedHeight}`,
      type: width > height ? 'Landscape' : 'Portrait',
    };
  }

  return {
    ratio: `${ratioWidth}:${ratioHeight}`,
    type: width > height ? 'Landscape' : 'Portrait',
  };
};

// Get sort options for the sizes view
export const getSizeSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  let typeLabel: string, directionLabel: string;

  switch (sortType) {
    case 'count':
      typeLabel = 'Count';
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
      break;
    case 'dimensions':
      typeLabel = 'Size';
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
      break;
    case 'active':
      typeLabel = 'Active';
      directionLabel = sortDirection === 'desc' ? '↑ Active' : '↓ Active';
      break;
    case 'aspectRatio':
      typeLabel = 'Ratio';
      directionLabel = sortDirection === 'asc' ? '↑ Tall-Wide' : '↓ Wide-Tall';
      break;
    case 'megapixels':
      typeLabel = 'Megapixel';
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
      break;
    default:
      typeLabel = 'Size';
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
  }

  // Calculate next sort type based on current sort type
  // Define a safe mapping for sort type transitions
  let nextType: SortType = 'count';
  if (sortType === 'count') {
    nextType = 'active';
  } else if (sortType === 'active') {
    nextType = 'dimensions';
  } else if (sortType === 'dimensions') {
    nextType = 'aspectRatio';
  } else if (sortType === 'aspectRatio') {
    nextType = 'megapixels';
  } else if (sortType === 'megapixels') {
    nextType = 'count';
  }

  return {
    typeLabel,
    directionLabel,
    nextType,
  };
};

export const useSizesView = () => {
  const dispatch = useAppDispatch();
  const allSizes = useAppSelector(selectImageSizes);
  const activeSizes = useAppSelector(selectFilterSizes);

  const {
    sortType,
    sortDirection,
    searchTerm,
    setSearchTerm,
    updateListLength,
    selectedIndex,
    inputRef,
    handleKeyDown,
  } = useFilterContext();

  // Filter and sort sizes based on search term and sort settings
  const filteredSizes = useMemo(() => {
    // Convert map to array and filter by search term (if present)
    const filter = searchTerm.toLowerCase().replace('×', 'x');
    const list = Object.entries(allSizes)
      .map(([dimensions, count]) => {
        const { width, height } = decomposeDimensions(dimensions);
        const { ratio, type } = formatAspectRatio(width, height);
        const pixelCount = width * height;
        const mp = pixelCount / 1000000;
        const formattedMP = mp.toFixed(1) + ' MP';
        return {
          dimensions,
          count,
          width,
          height,
          ratio,
          type,
          pixelCount,
          formattedMP,
          isActive: activeSizes.includes(dimensions),
        };
      })
      .filter((item) => {
        if (!filter) return true;

        // Filter based on the sort type
        if (sortType === 'aspectRatio') {
          // When in aspectRatio mode, search in the ratio field
          return item.ratio.toLowerCase().includes(filter);
        } else if (sortType === 'megapixels') {
          // When in megapixels mode, search in the megapixel value
          return item.formattedMP.toLowerCase().includes(filter);
        } else {
          // Default behavior: filter by dimensions
          // Normalize the dimensions format for searching (× to x)
          const normalizedDimensions = item.dimensions
            .toLowerCase()
            .replace('×', 'x');
          return normalizedDimensions.includes(filter);
        }
      });

    // Sort the sizes
    return list.sort((a, b) => {
      if (sortType === 'active') {
        // First compare by active state
        if (a.isActive !== b.isActive) {
          // Default (desc) puts active items first, asc puts them last
          return sortDirection === 'desc'
            ? a.isActive
              ? -1
              : 1 // active items first when descending (default)
            : a.isActive
              ? 1
              : -1; // active items last when ascending
        }
        // If both have same active state, sort by count descending (9-0) as secondary criteria
        return b.count - a.count; // always descending count (9-0) as tie-breaker
      } else if (sortType === 'count') {
        return sortDirection === 'asc'
          ? a.count - b.count // ascending
          : b.count - a.count; // descending
      } else if (sortType === 'dimensions') {
        // Sort by width first, then by height
        if (a.width !== b.width) {
          return sortDirection === 'asc'
            ? a.width - b.width // ascending by width
            : b.width - a.width; // descending by width
        }
        // If widths are equal, sort by height
        return sortDirection === 'asc'
          ? a.height - b.height // ascending by height
          : b.height - a.height; // descending by height
      } else if (sortType === 'aspectRatio') {
        // Calculate aspect ratio as width/height (normalized)
        const aRatio = a.width / a.height;
        const bRatio = b.width / b.height;
        return sortDirection === 'asc'
          ? aRatio - bRatio // ascending: square to wide
          : bRatio - aRatio; // descending: wide to square
      } else if (sortType === 'megapixels') {
        // Sort by megapixels directly
        return sortDirection === 'asc'
          ? a.pixelCount - b.pixelCount // ascending (0-9)
          : b.pixelCount - a.pixelCount; // descending (9-0)
      } else {
        // Default to dimensions
        return sortDirection === 'asc'
          ? a.pixelCount - b.pixelCount // ascending
          : b.pixelCount - a.pixelCount; // descending
      }
    });
  }, [allSizes, activeSizes, searchTerm, sortType, sortDirection]);

  // Update list length for keyboard navigation
  useEffect(() => {
    updateListLength(filteredSizes.length);
  }, [filteredSizes.length, updateListLength]);

  // Create a memoized toggle handler
  const handleToggle = useCallback(
    (size: string) => {
      dispatch(toggleSizeFilter(size));

      // Focus back on input after selection
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [dispatch, inputRef],
  );

  // Handle size selection via keyboard
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredSizes.length) {
      const selectedSize = filteredSizes[selectedIndex].dimensions;
      // Update UI to show focus on the selected size
      const sizeEl = document.getElementById(`size-${selectedSize}`);
      if (sizeEl) {
        // Ensure the element is in view
        sizeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredSizes]);

  // Listen for keyboard selection events
  useEffect(() => {
    const handleKeyboardSelect = (e: CustomEvent) => {
      // Check if the event is for our component by comparing selectedIndex
      if (
        e.detail?.index === selectedIndex &&
        selectedIndex >= 0 &&
        selectedIndex < filteredSizes.length
      ) {
        // Get the selected size and toggle it
        const selectedSize = filteredSizes[selectedIndex].dimensions;
        handleToggle(selectedSize);
      }
    };

    // Add event listener for custom keyboard selection event
    document.addEventListener(
      'filterlist:keyboardselect',
      handleKeyboardSelect as EventListener,
    );

    return () => {
      document.removeEventListener(
        'filterlist:keyboardselect',
        handleKeyboardSelect as EventListener,
      );
    };
  }, [selectedIndex, filteredSizes, handleToggle]);

  return {
    sortType,
    searchTerm,
    setSearchTerm,
    handleKeyDown,
    inputRef,
    filteredSizes,
    selectedIndex,
    handleToggle,
  };
};
