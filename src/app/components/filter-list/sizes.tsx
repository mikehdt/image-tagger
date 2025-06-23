import { Fragment, ReactNode, useCallback, useEffect, useMemo } from 'react';

import { selectImageSizes } from '../../store/assets';
import { selectFilterSizes, toggleSizeFilter } from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { decomposeDimensions } from '../../utils/helpers';
import { FilterViewProps, SortDirection, SortType } from './types';

/**
 * Highlights all occurrences of a search term within text
 * @param text The text to search within
 * @param searchTerm The term to highlight
 * @returns Array of React elements with highlighted matches
 */
const highlightMatches = (text: string, searchTerm: string) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return text; // Return the original text if no search term
  }

  // Normalize the search term and text by replacing × with x for matching
  const normalizedSearchTerm = searchTerm
    .toLowerCase()
    .replace(/[×x]/g, '[×x]');
  const termRegex = new RegExp(normalizedSearchTerm, 'gi');
  const segments = [];
  let lastIndex = 0;
  let match;

  // Find all occurrences of the search term
  while ((match = termRegex.exec(text.replace(/[×x]/g, 'x'))) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    // Add the text before the match
    if (startIndex > lastIndex) {
      segments.push(
        <Fragment key={`${lastIndex}-regular`}>
          {text.slice(lastIndex, startIndex)}
        </Fragment>,
      );
    }

    // Add the bold match (using the original text formatting)
    segments.push(
      <strong key={`${startIndex}-highlight`} className="font-extrabold">
        {text.slice(startIndex, endIndex)}
      </strong>,
    );

    lastIndex = endIndex;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    segments.push(
      <Fragment key={`${lastIndex}-regular`}>{text.slice(lastIndex)}</Fragment>,
    );
  }

  return segments.length > 0 ? segments : text;
};

// Get sort options for the sizes view
export const getSizeSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  return {
    directionLabel:
      sortType === 'count'
        ? `${sortDirection === 'asc' ? '↓ 9-0' : '↑ 0-9'}`
        : sortType === 'dimensions'
          ? `${sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0'}`
          : sortType === 'aspectRatio'
            ? `${sortDirection === 'asc' ? '↑ Tall-Wide' : '↓ Wide-Tall'}`
            : `${sortDirection === 'asc' ? '↑ Selected' : '↓ Selected'}`,
    typeLabel:
      sortType === 'count'
        ? 'Count'
        : sortType === 'dimensions'
          ? 'Size'
          : sortType === 'aspectRatio'
            ? 'Ratio'
            : 'Active',
    nextType:
      sortType === 'count'
        ? ('dimensions' as SortType)
        : sortType === 'dimensions'
          ? ('aspectRatio' as SortType)
          : sortType === 'aspectRatio'
            ? ('active' as SortType)
            : ('count' as SortType),
  };
};

// Type for the formatted size display output
type FormattedSizeDisplay = {
  primary: string | ReactNode | (string | ReactNode)[];
  secondary: string;
};

export const SizesView = ({
  sortType,
  sortDirection,
  searchTerm = '',
  selectedIndex = -1,
  updateListLength,
  onItemSelect,
}: FilterViewProps) => {
  const dispatch = useAppDispatch();
  const allSizes = useAppSelector(selectImageSizes);
  const filterSizes = useAppSelector(selectFilterSizes);

  // Handle size click to toggle filters
  const handleSizeClick = useCallback(
    (size: string, isKeyboardSelection = false) => {
      dispatch(toggleSizeFilter(size));

      // Notify parent of selection when keyboard navigation is used
      if (isKeyboardSelection && onItemSelect) {
        onItemSelect(selectedIndex);
      }
    },
    [dispatch, onItemSelect, selectedIndex],
  );

  // Format dimensions for display
  const formatDimensions = useCallback((size: string) => {
    const { width, height } = decomposeDimensions(size);
    return `${width}×${height}`;
  }, []);

  // Format aspect ratio for display
  const formatAspectRatio = useCallback((size: string) => {
    const { width, height } = decomposeDimensions(size);

    // Calculate the greatest common divisor with Euclidean algorithm
    const calculateGCD = (a: number, b: number): number => {
      return b === 0 ? a : calculateGCD(b, a % b);
    };

    // Calculate the greatest common divisor
    const divisor = calculateGCD(width, height);

    // Simplify the ratio by dividing both width and height by their GCD
    const simplifiedWidth = width / divisor;
    const simplifiedHeight = height / divisor;

    return `${simplifiedWidth}:${simplifiedHeight}`;
  }, []);

  // Format megapixels for display
  const formatMegapixels = useCallback((size: string) => {
    const { width, height } = decomposeDimensions(size);
    const megapixels = (width * height) / 1000000;
    return `${megapixels.toFixed(1)}MP`;
  }, []);

  // Format size display based on current sort type
  const formatSizeDisplay = useCallback(
    (size: string): FormattedSizeDisplay => {
      const dimensions = formatDimensions(size);
      const aspectRatio = formatAspectRatio(size);
      const megapixels = formatMegapixels(size);

      // For searchTerm highlighting, we only highlight the primary display
      switch (sortType) {
        case 'dimensions':
          return {
            primary: highlightMatches(megapixels, searchTerm),
            secondary: dimensions,
          };
        case 'aspectRatio':
          return {
            primary: highlightMatches(aspectRatio, searchTerm),
            secondary: dimensions,
          };
        case 'count':
        case 'active':
        default:
          return {
            primary: highlightMatches(dimensions, searchTerm),
            secondary: '',
          };
      }
    },
    [
      sortType,
      formatDimensions,
      formatAspectRatio,
      formatMegapixels,
      searchTerm,
    ],
  );

  // Sort and filter sizes based on search term and current sort type and direction
  const sortedSizes = useMemo(() => {
    // Filter sizes based on search term - match against both x and × symbols
    const normalizedSearchTerm = searchTerm
      .toLowerCase()
      .replace(/[×x]/g, '[×x]');
    const searchRegex = normalizedSearchTerm
      ? new RegExp(normalizedSearchTerm, 'i')
      : null;

    const filteredSizes = Object.entries(allSizes).filter(([size]) => {
      if (!searchTerm || searchTerm.trim() === '') return true;

      // Search based on the primary display value according to sort type
      let searchableText = '';

      switch (sortType) {
        case 'dimensions':
          // Search by megapixels
          searchableText = formatMegapixels(size);
          break;
        case 'aspectRatio':
          // Search by aspect ratio
          searchableText = formatAspectRatio(size);
          break;
        case 'count':
        case 'active':
        default:
          // Search by resolution dimensions
          searchableText = formatDimensions(size);
          // For dimensions, we need to handle both × and regular x for matching
          searchableText = searchableText.replace('×', 'x');
          break;
      }

      // Match against the appropriate text based on sort type
      return searchRegex ? searchRegex.test(searchableText) : true;
    });

    // Sort the filtered sizes
    return filteredSizes.sort(([sizeA, countA], [sizeB, countB]) => {
      if (sortType === 'active') {
        // Sort by selected/active status first
        const isSelectedA = filterSizes.includes(sizeA);
        const isSelectedB = filterSizes.includes(sizeB);

        if (isSelectedA !== isSelectedB) {
          // If one is selected and the other isn't, the selected one goes first
          return isSelectedA ? -1 : 1;
        }

        // If both have the same selection status, sort by dimensions as secondary
        const dimA = decomposeDimensions(sizeA);
        const dimB = decomposeDimensions(sizeB);
        const totalPixelsA = dimA.width * dimA.height;
        const totalPixelsB = dimB.width * dimB.height;
        return sortDirection === 'asc'
          ? totalPixelsA - totalPixelsB
          : totalPixelsB - totalPixelsA;
      } else if (sortType === 'count') {
        // Sort by count - for count, "asc" means highest first (reversed)
        const comparison =
          sortDirection === 'asc' ? countB - countA : countA - countB;
        // If counts are equal, sort by dimensions as secondary
        if (comparison !== 0) return comparison;

        const dimA = decomposeDimensions(sizeA);
        const dimB = decomposeDimensions(sizeB);
        const totalPixelsA = dimA.width * dimA.height;
        const totalPixelsB = dimB.width * dimB.height;
        return sortDirection === 'asc'
          ? totalPixelsA - totalPixelsB
          : totalPixelsB - totalPixelsA;
      } else if (sortType === 'dimensions') {
        // Sort by total number of pixels (width × height)
        const dimA = decomposeDimensions(sizeA);
        const dimB = decomposeDimensions(sizeB);
        const totalPixelsA = dimA.width * dimA.height;
        const totalPixelsB = dimB.width * dimB.height;
        return sortDirection === 'asc'
          ? totalPixelsA - totalPixelsB
          : totalPixelsB - totalPixelsA;
      } else if (sortType === 'aspectRatio') {
        // Sort by aspect ratio (width / height)
        const dimA = decomposeDimensions(sizeA);
        const dimB = decomposeDimensions(sizeB);
        const ratioA = dimA.width / dimA.height;
        const ratioB = dimB.width / dimB.height;
        return sortDirection === 'asc' ? ratioA - ratioB : ratioB - ratioA;
      } else {
        // Default sort by size string
        const comparison = sizeA.localeCompare(sizeB);
        return sortDirection === 'desc' ? -comparison : comparison;
      }
    });
  }, [
    allSizes,
    sortType,
    sortDirection,
    filterSizes,
    searchTerm,
    formatDimensions,
    formatAspectRatio,
    formatMegapixels,
  ]);

  // Update list length for keyboard navigation when sorted sizes change
  useEffect(() => {
    if (updateListLength) {
      updateListLength(sortedSizes.length);
    }
  }, [sortedSizes, updateListLength]);

  // Handle enter key for keyboard navigation
  useEffect(() => {
    if (
      selectedIndex >= 0 &&
      sortedSizes.length > 0 &&
      selectedIndex < sortedSizes.length
    ) {
      const [size] = sortedSizes[selectedIndex];
      const handleKeyDownEnter = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleSizeClick(size, true);
        }
      };
      document.addEventListener('keydown', handleKeyDownEnter);
      return () => {
        document.removeEventListener('keydown', handleKeyDownEnter);
      };
    }
  }, [selectedIndex, sortedSizes, handleSizeClick]);

  if (sortedSizes.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        {searchTerm
          ? `No sizes matching "${searchTerm}"`
          : 'No image sizes found'}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {sortedSizes.map(([size, count], index) => {
        const isSelected = filterSizes.includes(size);
        const isKeyboardSelected = index === selectedIndex;

        // Get the formatted display for the size
        const { primary, secondary } = formatSizeDisplay(size);

        return (
          <li
            key={size}
            onClick={() => handleSizeClick(size)}
            className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
              isKeyboardSelected
                ? isSelected
                  ? 'bg-sky-100'
                  : 'bg-blue-100'
                : isSelected
                  ? 'bg-sky-50'
                  : 'hover:bg-slate-50'
            }`}
            title={
              isSelected
                ? 'Click to remove from filters'
                : 'Click to add to filters'
            }
          >
            <span
              className={`text-sm ${
                isSelected ? 'font-medium text-sky-700' : 'text-slate-800'
              }`}
            >
              {primary}
              {secondary && (
                <span className="ml-1 text-xs text-slate-500">
                  ({secondary})
                </span>
              )}
            </span>
            <span
              className={`text-xs tabular-nums ${
                isSelected ? 'text-sky-600' : 'text-slate-500'
              }`}
            >
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
