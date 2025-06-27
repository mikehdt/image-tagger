# Tagging Module Architecture

## Component Hierarchy

```
Asset # Main asset component
└── AssetTags # Adapter between Asset and TaggingManager
      └── TaggingManager         # Orchestrates tag functionality
          ├── SortableProvider   # From shared/dnd - provides drag-drop functionality
          └── TaggingProvider    # Provides tag state through context
              └── TagList        # Renders tags with input field
                  ├── SortableTag # Draggable tag container
                  │   ├── Tag     # Base tag UI component
                  │   └── InputTag # For editing mode
                  └── InputTag    # For adding new tags
```

## Hook Dependencies

- useAssetTags - Connects to Redux store for tag data
- useSortable - Provides drag-drop sensor and event handling
- useTagState - Manages local tag edit state
- useTagCalculations - Provides computed values for tag display
- useTagActions - Provides functions for tag manipulation

## Implementation Flow

This architecture separates concerns while maintaining a cohesive flow:

1. Asset components handle asset display and organization
2. Tagging components handle tag display and interaction
3. Shared components provide reusable functionality
