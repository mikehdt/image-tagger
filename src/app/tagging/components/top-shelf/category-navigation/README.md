# Category Navigation Components

This folder contains components for navigating between categories in the application.

## Components

### `CategoryNavigation`

The main component that provides a dropdown button for category navigation.

**Responsibilities:**

- Renders the navigation button
- Manages dropdown state (open/closed)
- Handles positioning logic for the dropdown panel
- Manages click outside and escape key handlers
- Coordinates navigation between pages and scrolling

**Props:**

- `currentPage: number` - The current page number

### `CategoryList`

A pure component that renders the list of categories with page information.

**Responsibilities:**

- Renders the category list header with close button
- Displays categories with proper styling and interaction states
- Shows page numbers only when they change
- Handles category click events via callback

**Props:**

- `categoriesWithPageInfo: CategoryInfo[]` - Array of categories with page info
- `currentPage: number` - Current page for highlighting
- `onCategoryClick: (page: number, anchorId: string) => void` - Callback for category clicks
- `onClose: () => void` - Callback to close the dropdown

## Features

- **Cross-page navigation**: Can navigate to categories on different pages
- **Same-page scrolling**: Smooth scrolls to categories on the same page
- **URL hash updates**: Updates browser URL for bookmarkable positions
- **Smart positioning**: Adjusts dropdown position to stay within viewport
- **Page number optimization**: Only shows page numbers when they change
- **Continuation indicators**: Shows "(continued)" for categories spanning multiple pages

## Dependencies

- Uses `scrollToAnchor` utility for consistent scrolling behavior
- Integrates with Redux store for asset and pagination data
- Uses Next.js router for cross-page navigation
