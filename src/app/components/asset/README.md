# Asset Components

This directory contains components for managing and displaying media assets with associated metadata.

## Component Hierarchy

```
Asset                  # Main asset component
├── AssetImage         # Handles image display and loading states
├── AssetMetadata      # Displays and manages asset metadata
└── AssetTags          # Adapter between Asset and TaggingManager
```

## Hook Dependencies

- useAssetData - Retrieves asset data from the Redux store
- useAssetMetadata - Manages asset metadata display and formatting
- useAssetTags - Connects to tag functionality for the specific asset
- useAssetSelection - Handles asset selection state and interactions

## Implementation Flow

1. Asset components load and display image content
2. Metadata is extracted and presented in a structured format
3. Tagging functionality is connected through AssetTags adapter
4. User interactions trigger appropriate Redux actions to update state
5. Asset display updates reactively based on filters and modifications
