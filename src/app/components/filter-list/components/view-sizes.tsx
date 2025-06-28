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
    return text; // Return the text if no search term
  }

  // Normalize the search term and text if needed
  // For dimensions, replace × with x for matching
  // For ratios and megapixels, just lowercase
  const normalizedTerm = searchTerm.toLowerCase().replace('×', 'x');
  const normalizedText = text.toLowerCase().replace('×', 'x');

  // If no matches, return text
  if (!normalizedText.includes(normalizedTerm)) {
    return text;
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
          {text.substring(lastIndex, index)}
        </Fragment>,
      );
    }

    // Add the highlighted match
    result.push(
      <span key={`match-${index}`} className="font-bold">
        {text.substring(index, index + searchTerm.length)}
      </span>,
    );

    lastIndex = index + searchTerm.length;
    index = normalizedText.indexOf(normalizedTerm, lastIndex);
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    result.push(
      <Fragment key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
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
    <div
      className={`border ${
        isActive ? 'border-sky-500 bg-sky-200' : 'border-slate-300 bg-slate-50'
      }`}
      style={{ width: boxWidth, height: boxHeight }}
    />
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
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
      break;
    case 'dimensions':
      typeLabel = 'Size';
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
      break;
    case 'active':
      typeLabel = 'Active';
      directionLabel = sortDirection === 'asc' ? '↑ Active' : '↓ Active';
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

// Format the dimensions for display with proper × symbol
const formatDimensions = (dimensions: string): string => {
  if (!dimensions.includes('x')) return dimensions;
  return dimensions.replace('x', '×');
};

// Format the count with the appropriate megapixel label
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatMegaPixels = (pixelCount: number): string => {
  const mp = pixelCount / 1000000;
  if (mp < 0.1) {
    return ''; // Skip showing MP for very small images
  }
  return mp.toFixed(1) + ' MP';
};

// Calculate the pixel count from dimensions
// This function is not currently used but kept for future functionality
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getPixelCount = (dimensions: string): number => {
  const { width, height } = decomposeDimensions(dimensions);
  return width * height;
};

// Component to display conditional info based on sort type
const SizeInfo = ({
  item,
  sortType,
  searchTerm,
}: {
  item: {
    dimensions: string;
    width: number;
    height: number;
    count: number;
    pixelCount: number;
    ratio: string;
    type: string;
    isActive: boolean;
    formattedMP: string;
  };
  sortType: SortType;
  searchTerm: string;
}) => {
  // Format the main display based on sort type
  if (sortType === 'aspectRatio') {
    return (
      <>
        <div className="flex items-center justify-between tabular-nums">
          <span>
            <span className="text-slate-800">
              {searchTerm
                ? highlightMatches(item.ratio, searchTerm)
                : item.ratio}
            </span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="text-sm text-slate-500">{item.type}</span>
          </span>
          <span className="ml-auto text-xs text-slate-500">{item.count}</span>
        </div>
        <div className="flex text-xs tabular-nums">
          <span className="text-slate-500">
            {formatDimensions(item.dimensions)}
          </span>
          {item.pixelCount > 100000 && (
            <>
              <span className="mx-1 text-slate-300">•</span>
              <span className="text-slate-500">{item.formattedMP}</span>
            </>
          )}
        </div>
      </>
    );
  } else if (sortType === 'megapixels') {
    return (
      <>
        <div className="flex items-center justify-between tabular-nums">
          <span className="text-slate-800">
            {searchTerm
              ? highlightMatches(item.formattedMP, searchTerm)
              : item.formattedMP}
          </span>
          <span className="ml-auto text-xs text-slate-500">{item.count}</span>
        </div>
        <div className="flex text-xs tabular-nums">
          <span className="text-slate-500">
            {formatDimensions(item.dimensions)}
          </span>
          <span className="mx-1 text-slate-300">•</span>
          <span className="text-slate-500">{item.ratio}</span>
          <span className="mx-1 text-slate-300">•</span>
          <span className="text-slate-500">{item.type}</span>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="flex items-center justify-between tabular-nums">
          <span className="text-slate-800">
            {searchTerm
              ? highlightMatches(formatDimensions(item.dimensions), searchTerm)
              : formatDimensions(item.dimensions)}
          </span>
          <span className="ml-auto text-xs text-slate-500">{item.count}</span>
        </div>
        <div className="flex text-xs tabular-nums">
          <span className="text-slate-500">{item.ratio}</span>
          <span className="mx-1 text-slate-300">•</span>
          <span className="text-slate-500">{item.type}</span>
          {item.pixelCount > 100000 && (
            <>
              <span className="mx-1 text-slate-300">•</span>
              <span className="text-slate-500">{item.formattedMP}</span>
            </>
          )}
        </div>
      </>
    );
  }
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
          return sortDirection === 'asc'
            ? a.isActive
              ? -1
              : 1 // active items first when ascending
            : a.isActive
              ? 1
              : -1; // active items last when descending
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

  // Reference the formatMegaPixels function defined above

  return filteredSizes.length === 0 ? (
    <div className="truncate p-4 text-center text-sm text-slate-500">
      {searchTerm ? `No sizes match "${searchTerm}"` : 'No sizes available'}
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
          <div className="mr-2 flex w-10 justify-center">
            <SizeVisualizer size={item.dimensions} isActive={item.isActive} />
          </div>

          <div className="flex flex-1 flex-col">
            <SizeInfo item={item} sortType={sortType} searchTerm={searchTerm} />
          </div>
        </li>
      ))}
    </ul>
  );
};
