# Component Architecture

This document provides an overview of the component architecture used in the Image Tagger application.

## Directory Structure

```
/components
  /asset                  # Asset-related components
    /components           # Asset subcomponents
      asset-metadata.tsx  # Displays asset metadata
      asset-tags.tsx      # Adapter to tagging functionality
    asset.tsx             # Main asset component

  /shared                 # Shared, reusable components
    /dnd                  # Drag and drop functionality
      /hooks
        use-sortable.ts   # Hook for sortable items
      sortable-provider.tsx # Provider for sortable context

  /tagging                # Tag management components
    /components           # Tag subcomponents
      tag.tsx             # Base tag UI
      input-tag.tsx       # Tag input for adding/editing tags
      sortable-tag.tsx    # Draggable tag wrapper
      tag-list.tsx        # List of tags with input
    /hooks                # Tag-related hooks
      use-asset-tags.ts   # Connect asset tags to store
      use-tag-actions.ts  # Tag action functions
      use-tag-calculations.ts # Tag computed properties
      use-tag-state.ts    # Tag state management
    tagging-context.tsx   # Context provider for tag state
    tagging-manager.tsx   # Orchestrates tag functionality
```

## Architecture Principles

1. **Separation of Concerns**: Components are organized by feature (asset, tagging) with clear boundaries
2. **Composition over Inheritance**: Components are composed together rather than extended
3. **Context for State Management**: React context is used to reduce prop drilling
4. **Adapter Pattern**: AssetTags serves as an adapter between Asset and TaggingManager
5. **Reusability**: Common functionality is extracted to shared components

## Data Flow

1. Asset components request and display asset data including images and metadata
2. Tagging components provide tag management functionality:
   - TaggingManager orchestrates tag operations
   - TaggingContext provides tag state and actions
   - Hooks connect to the Redux store
3. Shared components provide reusable functionality like drag-and-drop

## Component Relationships

```
Asset -> AssetTags -> TaggingManager -> TaggingProvider -> TagList -> SortableTag -> Tag
                                      |                  -> InputTag
                                      |-> SortableProvider
```

## Hooks Usage

- **useAssetTags**: Connects to the store for tag data and operations
- **useSortable**: Provides drag-drop functionality
- **useTagState**: Manages local tag editing state
- **useTagCalculations**: Provides computed values for tag display
- **useTagActions**: Encapsulates tag operations (add, edit, delete)
