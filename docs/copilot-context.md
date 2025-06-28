# Image Tagger - Project Context

## Project Purpose

An image tagging application that allows users to:

- View images from a designated folder in a paginated list
- Add, edit, and reorder tags for each image
- Filter images by tags, image size, or filetype
- Save tags back to associated text files (comma separated format)

## Data Structure

- Images are placed in a folder (public/assets)
- Each image has an associated .txt file with comma-separated tags
- File structure pattern: image.jpg and image.txt in the same directory
- All UI state is managed in memory and is not persisted between sessions

## Core Features

1. **Image Display**: Paginated gallery of images from assets folder
2. **Tag Management**: UI for adding, editing, reordering tags per image
3. **Filtering System**: Filter images by tags, dimensions, and filetype
4. **Persistence**: Save modified tags back to text files

## Technical Implementation

- **Package Management**: pnpm
- **Frontend**: Next.js with App Router, React, TypeScript
- **State Management**: Redux for global state (image list, filters), React state (useState) for local state
- **Styling**: Tailwind CSS for responsive design
- **Performance**: `useMemo`, `React.memo` and `useCallback` to minimise re-renders and keep the UI fast
- **Formatting**: eslint and prettier, imports ordered with an eslint plugin
- **Filenames**: Lower kebab-case filenames eg. `file-name.ts` for all Typescript/TSX files
- **Struture**: Follow established file and folder patterns. Avoid unnecessary exports to keep code comprehension tight. Structure reference can be found in component `README.md` files if needed.

## Architecture Decisions

- Feature-based component organization
- Strict TypeScript usage
- Container/Presentational component pattern
- Path aliases (@/\*) for clean imports

## Performance Considerations

- Optimize image loading for potentially large collections
- Memoization for expensive operations
- Code splitting for larger components

## Future Considerations

- [To be added as project evolves]

---

_This file serves as a persistent context reference for GitHub Copilot conversations_
