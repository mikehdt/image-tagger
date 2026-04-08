# Tagging Components (v2)

Tag management components for viewing, editing, and organising image tags with drag-and-drop reordering support.

## Component Hierarchy

```
TaggingManager           # Redux integration layer, provides handlers
└── TagList              # Manages add/edit state, duplicate detection
    └── TagsDisplay      # Conditional DnD context, renders tag elements
        ├── SortableTag  # DnD wrapper (when sortable + hovered)
        │   └── EditableTag
        │       ├── Tag       # Display mode
        │       └── InputTag  # Edit mode
        └── EditableTag  # Direct render (when not sortable/hovered)
            ├── Tag
            └── InputTag
```

## Features

- Add, edit, delete, and toggle tags
- Drag-and-drop reordering (when tag sort is set to "Sort Order")
- Duplicate detection with visual feedback (matching tag highlighted, others faded)
- Case-insensitive duplicate matching
- Conditional DnD rendering for performance (only active when hovered)
- Memoized components to minimise re-renders

## State Management

- **TaggingManager**: Connects to Redux store for tag data and dispatches actions
- **TagList**: Local state for add input value and edit state (editingTagName, editValue)
- **TagsDisplay**: Local state for hover detection (enables/disables DnD context)

## Visual States

Tags display different colours based on their state:

- **Saved** (teal): Tag exists in the source file
- **To Add** (amber): New tag pending save
- **Dirty** (indigo): Tag modified pending save
- **To Delete** (pink): Tag marked for deletion, shown with strikethrough

## Duplicate Detection

When typing in the add or edit input matches an existing tag:

1. All other tags fade out (opacity 25%, non-interactive)
2. The matching tag remains visible but non-interactive (no edit/delete/drag)
3. Submit is disabled until the duplicate is resolved

## Props

### TaggingManager

| Prop      | Type     | Description                     |
| --------- | -------- | ------------------------------- |
| `assetId` | `string` | The asset ID to manage tags for |

### TagList

| Prop          | Type                                 | Description                      |
| ------------- | ------------------------------------ | -------------------------------- |
| `tags`        | `TagData[]`                          | Array of tag objects to display  |
| `sortable`    | `boolean`                            | Enable drag-and-drop reordering  |
| `assetId`     | `string`                             | Asset identifier for DnD context |
| `sensors`     | `SensorDescriptor[]`                 | DnD sensors from useSensors      |
| `onDragEnd`   | `(event: DragEndEvent) => void`      | Called when drag completes       |
| `onAddTag`    | `(tagName: string) => void`          | Called to add a new tag          |
| `onToggleTag` | `(tagName: string) => void`          | Called to toggle tag filter      |
| `onEditTag`   | `(old: string, new: string) => void` | Called to rename a tag           |
| `onDeleteTag` | `(tagName: string) => void`          | Called to mark tag for deletion  |
