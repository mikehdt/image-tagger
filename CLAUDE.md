# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Run development server with Turbopack
- `pnpm build` - Build for production
- `pnpm lint` - Run Next.js linting
- `pnpm format:check` - Check code formatting with Prettier
- `pnpm format:write` - Format code with Prettier
- `pnpm knip` - Find unused dependencies and code

Package manager: pnpm (specified in packageManager field)

## Architecture Overview

This is a Next.js 15 application for managing and tagging image collections with the following architecture:

### State Management

- Redux Toolkit with typed hooks
- Store slices: assets, filters, project, selection, toasts
- Custom middleware: filter-manager for coordinating filter state changes
- Async operations handled via AppThunk type

### Core Features

- Image gallery with pagination
- Tag management (add/edit/reorder tags via drag-and-drop using @dnd-kit)
- Advanced filtering (tags, dimensions, filetype)
- Project-based organization
- Tag persistence to associated text files

### Key Directories

- `src/app/store/` - Redux store configuration and slices
- `src/app/components/` - React components organized by feature area
- `src/app/utils/` - Utility functions and helpers
- `src/app/api/` - Next.js API routes for serving images and project data
- `public/projects/` - Static project data and thumbnails

### Component Architecture

- Feature-based component organization (asset, tagging, top-shelf, bottom-shelf)
- Shared components in `src/app/components/shared/`
- Hook-based logic extraction for complex components
- Context providers for component-specific state (tagging, filters, popups)

### API Structure

- `/api/images/[...path]` - Dynamic image serving
- `/api/projects/[projectName]` - Project data endpoints
- `/api/config` - Configuration data

### Data Flow

- Images and tags loaded via API routes
- Redux manages application state
- Components use typed selectors and actions
- Filter changes trigger middleware that coordinates related state updates

## Development Guidelines

### File Structure and Naming

- Lower kebab-case filenames for all TypeScript/TSX files (`file-name.ts`)
- Preference for named exports over default exports
- Only export values consumed elsewhere
- Path alias `@/app/...` for clean imports, maximum two `../../` levels
- Feature-based component organization

### Code Style

- Australian English for UI text, US English for code (e.g., `colour` vs `color`)
- Use `requestAnimationFrame` over `setTimeout` for UI timing
- Performance optimisation with `React.memo`, `useSelector`, `useMemo`, `useCallback`

### Data Structure

- Images have associated `.txt` files with comma-separated tags
- Supports .jpg, .jpeg, .png, .webp formats
- File pattern: `image.jpg` + `image.txt` in same directory
- UI state in memory only, not persisted between sessions

### Documentation

- README.md files for complex components with sub-folders
- Minimal inline comments unless code is complex/unclear
- No need to document every prop
