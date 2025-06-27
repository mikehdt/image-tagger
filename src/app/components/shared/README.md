# Shared Components

This directory contains reusable components and utilities that are shared
across different parts of the application.

## Directory Structure

```
/dnd # Drag and Drop components and utilities
├── /hooks
│   └── use-sortable.ts # Hook for creating sortable functionality
└── sortable-provider.tsx # Component that provides sortable context
```

## Usage Guidelines

1. Always import from the index files rather than directly from component files
2. Keep shared components focused on a single responsibility
3. Ensure shared components are thoroughly documented
4. Avoid coupling shared components to specific business logic
