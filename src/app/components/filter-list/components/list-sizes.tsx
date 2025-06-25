import { Fragment, ReactNode, useCallback, useEffect, useMemo } from 'react';

import { selectImageSizes } from '../../../store/assets';
import { selectFilterSizes, toggleSizeFilter } from '../../../store/filters';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { decomposeDimensions } from '../../../utils/helpers';
import { useFilterList } from '../filter-list-context';
import { SortDirection, SortType } from '../types';

/**
 * Highlights all occurrences of a search term within text
 * @param text The text to search within
 * @param searchTerm The term to highlight
 * @returns Array of React elements with highlighted matches
 */
const highlightMatches = (text: string, searchTerm: string) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return formatDimensions(text); // Return the formatted text if no search term
  }

  // Normalize the search term and text by replacing × with x for matching
  const normalizedTerm = searchTerm.toLowerCase().replace('×', 'x');
  const normalizedText = text.toLowerCase().replace('×', 'x');

  // Get the original text with proper × symbol
  const formattedText = formatDimensions(text);

  // If no matches, return formatted text
  if (!normalizedText.includes(normalizedTerm)) {
    return formattedText;
  }

  const result = [];
  let lastIndex = 0;

  // Find all occurrences of the search term
  let index = normalizedText.indexOf(normalizedTerm);

  while (index !== -1) {
    // Add the text before the match
    if (index > lastIndex) {
      result.push(
        <Fragment key={`text-${lastIndex}`}>
          {formatDimensions(text.substring(lastIndex, index))}
        </Fragment>,
      );
    }

    // Add the highlighted match
    result.push(
      <span key={`match-${index}`} className="font-bold">
        {formatDimensions(text.substring(index, index + searchTerm.length))}
      </span>,
    );

    lastIndex = index + searchTerm.length;
    index = normalizedText.indexOf(normalizedTerm, lastIndex);
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    result.push(
      <Fragment key={`text-${lastIndex}`}>
        {formatDimensions(text.substring(lastIndex))}
      </Fragment>,
    );
  }

  return result;
};

// Calculate aspect ratio from width and height
const getAspectRatio = (width: number, height: number): [number, number] => {
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const divisor = gcd(width, height);
  return [width / divisor, height / divisor];
};

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

// Get a visual representation of size
const SizeVisualizer = ({
  size,
  isActive,
}: {
  size: string;
  isActive: boolean;
}): ReactNode => {
  const { width, height } = decomposeDimensions(size);
  const maxSize = 36; // Maximum box size for visualization
  let boxWidth, boxHeight;

  if (width >= height) {
    boxWidth = maxSize;
    boxHeight = Math.round((height / width) * maxSize);
  } else {
    boxHeight = maxSize;
    boxWidth = Math.round((width / height) * maxSize);
  }

  // Minimum size to keep box visible
  boxWidth = Math.max(boxWidth, 8);
  boxHeight = Math.max(boxHeight, 8);

  return (
    <div className={`mr-2 w-10 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
      <div
        className={`border ${
          isActive ? 'border-sky-400 bg-sky-200' : 'bg-slate-50'
        }`}
        style={{ width: boxWidth, height: boxHeight }}
      />
    </div>
  );
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
      directionLabel = sortDirection === 'asc' ? '↓ 9-0' : '↑ 0-9';
      break;
    case 'dimensions':
      typeLabel = 'Size';
      directionLabel =
        sortDirection === 'asc' ? '↑ Small-Large' : '↓ Large-Small';
      break;
    case 'active':
      typeLabel = 'Active';
      directionLabel = sortDirection === 'asc' ? '↑ Active' : '↓ Active';
      break;
    case 'alphabetical':
      typeLabel = 'Name';
      directionLabel = sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A';
      break;
    default: // for other types, use similar to alphabetical
      typeLabel = 'Name';
      directionLabel = sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A';
  }

  // Calculate next sort type based on current sort type
  // Define a safe mapping for sort type transitions
  let nextType: SortType = 'count';
  if (sortType === 'count') {
    nextType = 'dimensions';
  } else if (sortType === 'dimensions') {
    nextType = 'active';
  } else if (sortType === 'active') {
    nextType = 'alphabetical';
  } else if (sortType === 'alphabetical') {
    nextType = 'count';
  }

  return {
    typeLabel,
    directionLabel,
    nextType,
  };
};

// Format the dimensions for display with proper × symbol
const formatDimensions = (dimensions: string): string => {
  if (!dimensions.includes('x')) return dimensions;
  return dimensions.replace('x', '×');
};

// Calculate the pixel count from dimensions
// This function is not currently used but kept for future functionality
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getPixelCount = (dimensions: string): number => {
  const { width, height } = decomposeDimensions(dimensions);
  return width * height;
};

export const SizesView = () => {
  const dispatch = useAppDispatch();
  const allSizes = useAppSelector(selectImageSizes);
  const activeSizes = useAppSelector(selectFilterSizes);

  const {
    sortType,
    sortDirection,
    searchTerm,
    updateListLength,
    selectedIndex,
    inputRef,
  } = useFilterList();

  // Filter and sort sizes based on search term and sort settings
  const filteredSizes = useMemo(() => {
    // Convert map to array and filter by search term (if present)
    const filter = searchTerm.toLowerCase().replace('×', 'x');
    const list = Object.entries(allSizes)
      .filter(([dimensions]) => {
        if (!filter) return true;
        // Normalize the dimensions format for searching (× to x)
        const normalizedDimensions = dimensions.toLowerCase().replace('×', 'x');
        return normalizedDimensions.includes(filter);
      })
      .map(([dimensions, count]) => {
        const { width, height } = decomposeDimensions(dimensions);
        const { ratio, type } = formatAspectRatio(width, height);
        return {
          dimensions,
          count,
          width,
          height,
          ratio,
          type,
          pixelCount: width * height,
          isActive: activeSizes.includes(dimensions),
        };
      });

    // Sort the sizes
    return list.sort((a, b) => {
      if (sortType === 'active') {
        // First compare by active state
        if (a.isActive !== b.isActive) {
          return sortDirection === 'asc'
            ? a.isActive
              ? -1
              : 1 // active items first when ascending
            : a.isActive
              ? 1
              : -1; // active items last when descending
        }
        // If both have same active state, sort by width as secondary criteria
        return sortDirection === 'asc'
          ? a.width - b.width // ascending width as tie-breaker
          : b.width - a.width; // descending width as tie-breaker
      } else if (sortType === 'count') {
        return sortDirection === 'asc'
          ? a.count - b.count // ascending
          : b.count - a.count; // descending
      } else if (sortType === 'dimensions') {
        // Sort by total pixels (width × height)
        return sortDirection === 'asc'
          ? a.pixelCount - b.pixelCount // ascending
          : b.pixelCount - a.pixelCount; // descending
      } else {
        // Sort by dimensions as string (name)
        return sortDirection === 'asc'
          ? a.dimensions.localeCompare(b.dimensions) // A-Z
          : b.dimensions.localeCompare(a.dimensions); // Z-A
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

  // Format the count with the appropriate megapixel label
  const formatMegaPixels = (pixelCount: number): string => {
    const mp = pixelCount / 1000000;
    if (mp < 0.1) {
      return ''; // Skip showing MP for very small images
    }
    return mp.toFixed(1) + ' MP';
  };

  return (
    <div className="max-h-80 overflow-y-auto">
      {filteredSizes.length === 0 ? (
        <div className="p-4 text-center text-sm text-slate-500">
          {searchTerm
            ? `No sizes matching "${searchTerm}"`
            : 'No sizes available'}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filteredSizes.map((item, index) => (
            <li
              id={`size-${item.dimensions}`}
              key={item.dimensions}
              onClick={() => handleToggle(item.dimensions)}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
                index === selectedIndex
                  ? item.isActive
                    ? 'bg-sky-200'
                    : 'bg-blue-100'
                  : item.isActive
                    ? 'bg-sky-100'
                    : 'hover:bg-blue-50'
              }`}
            >
              <SizeVisualizer size={item.dimensions} isActive={item.isActive} />

              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800">
                    {searchTerm
                      ? highlightMatches(item.dimensions, searchTerm)
                      : formatDimensions(item.dimensions)}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">
                    {item.count}
                  </span>
                </div>
                <div className="flex text-xs">
                  <span className="text-slate-500">{item.ratio}</span>
                  <span className="mx-1 text-slate-300">•</span>
                  <span className="text-slate-500">{item.type}</span>
                  {item.pixelCount > 100000 && (
                    <>
                      <span className="mx-1 text-slate-300">•</span>
                      <span className="text-slate-500">
                        {formatMegaPixels(item.pixelCount)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
