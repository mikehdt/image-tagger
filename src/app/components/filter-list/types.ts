// Define sort types and directions as constants
export type SortType =
  | 'count'
  | 'alphabetical'
  | 'active'
  | 'dimensions'
  | 'aspectRatio'
  | 'megapixels';
export type SortDirection = 'asc' | 'desc';

// Define view types
export type FilterView = 'tag' | 'size' | 'filetype';

// Define sub-view types for size view
export type SizeSubView = 'dimensions' | 'buckets';

// Base props for the filter list component
export interface FilterListProps {
  isOpen: boolean;
  onClose: () => void;
  containerRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
}
