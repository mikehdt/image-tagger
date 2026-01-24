# Component Architecture

This document provides an overview of the component architecture used in the Image Tagger application.

## Directory Structure

```
/components
  /asset                  # Asset display and metadata
    /components
      asset-metadata.tsx  # Displays asset metadata
      crop-visualization.tsx # Visual crop overlay
    asset.tsx             # Main asset component with image and tagging

  /bottom-shelf           # Bottom toolbar components

  /pagination             # Pagination controls

  /shared                 # Shared, reusable components
    /button               # Button with variants (toggle, ghost, etc.)
    /checkbox             # Custom styled checkbox
    /dropdown             # Accessible dropdown with keyboard nav
    /modal                # Modal dialog with portal rendering
    /responsive-toolbar-group # Responsive toolbar layout
    /toast                # Toast notification system

  /tagging                # Tag management (v2 architecture)
    /components
      tag.tsx             # Base tag UI with state styling
      input-tag.tsx       # Tag input for adding/editing
      sortable-tag.tsx    # Draggable tag wrapper (@dnd-kit)
      editable-tag.tsx    # Mode switcher (display/edit)
      tag-list.tsx        # Tag list with add/edit state management
    tagging-manager.tsx   # Redux integration layer

  /top-shelf              # Top toolbar components
    /category-navigation  # Category dropdown navigation
    /filter-list          # Filter panel (tags, sizes, filetypes)
```

## Architecture Principles

1. **Separation of Concerns**: Components are organised by feature with clear boundaries
2. **Composition over Inheritance**: Components are composed together rather than extended
3. **Redux for State Management**: Redux Toolkit for global state, local state for UI concerns
4. **Memoization for Performance**: Strategic use of React.memo with custom comparators
5. **Conditional Rendering**: DnD context only rendered when needed (on hover)

## Data Flow

1. Asset components display images and metadata from Redux store
2. TaggingManager connects to Redux for tag data and dispatches actions
3. TagList manages local UI state (add input, edit state, duplicate detection)
4. Tag components receive data as props and call handlers for interactions

## Component Relationships

```
Asset -> TaggingManager -> TagList -> TagsDisplay -> SortableTag -> EditableTag -> Tag
                                   |             |              |              -> InputTag
                                   |             -> EditableTag (when not sortable)
                                   -> InputTag (add new tag)
```

## Key Patterns

- **Memoized Components**: Custom memo comparators prevent unnecessary re-renders
- **Conditional DnD**: DndContext only mounts when tag area is hovered
- **Duplicate Detection**: Visual feedback when entering duplicate tag names
- **State Colocation**: Edit state lives in TagList, close to where it's used
