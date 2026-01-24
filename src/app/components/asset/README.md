# Asset Components

This directory contains components for displaying media assets with associated metadata and tagging.

## Component Hierarchy

```
Asset                    # Main asset component
├── AssetImage           # Handles image display and loading states
├── AssetMetadata        # Displays asset metadata (dimensions, filesize, etc.)
├── CropVisualization    # Visual overlay for crop indicators
└── TaggingManager       # Tag management (from tagging)
```

## Hook Dependencies

- useAssetData - Retrieves asset data from the Redux store
- useAssetMetadata - Manages asset metadata display and formatting
- useAssetSelection - Handles asset selection state and interactions

## Implementation Flow

1. Asset component loads and displays image content
2. Metadata is extracted and presented in a structured format
3. TaggingManager provides inline tag editing and management
4. User interactions trigger appropriate Redux actions to update state
5. Asset display updates reactively based on filters and modifications
