# Filter List Components

This directory contains components for managing and displaying filter lists for image assets.

## Component Hierarchy

```
FilterList                 # Main container for filter functionality
├── FilterListProvider     # Provides context for filter state
│   └── FilterPanel        # Main panel UI container
│       ├── ViewSelector   # Toggles between filter view types
│       ├── FilterControls # Sort and filter action controls
│       ├── SearchProvider # Context for search functionality
│       │   └── SearchInput # Input field for searching
│       └── FilterViews    # Container for different filter views
│           ├── TagsView   # Filter by tags
│           ├── SizesView  # Filter by image dimensions
│           └── FiletypesView # Filter by file extensions
```

## Hook Dependencies

- useKeyboardNavigation - Handles keyboard interaction for accessibility
- usePanelPosition - Calculates and manages panel positioning
- useOutsideClick - Detects clicks outside the panel for closing
- useFilterList - Main hook combining filter-related functionality

## Implementation Flow

1. Filter components provide an interactive UI for filtering assets
2. Users can filter by tags, image dimensions, or file types
3. Results update in real-time as filters are applied or removed
4. Filter state is persisted in Redux for application-wide consistency
5. Components use context to avoid prop drilling and maintain clean architecture
