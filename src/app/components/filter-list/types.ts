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

// Props for the filter view components
export interface FilterViewProps {
  sortType: SortType;
  sortDirection: SortDirection;
  searchTerm?: string;
  selectedIndex?: number;
  updateListLength?: (length: number) => void;
  onItemSelect?: (index: number) => void;
}

// Base props for the filter list component
export interface FilterListProps {
  isOpen: boolean;
  onClose: () => void;
  containerRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
}
