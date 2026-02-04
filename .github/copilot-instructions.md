# Image Tagger - Project Context

## Project Purpose

An image tagging application that allows users to:

- View images from a designated folder in a paginated list
- Add, edit, and reorder tags for each image
- Filter images by tags, image size, or filetype
- Save tags back to associated text files (comma separated format)
- Visualise image bucketing, and other image tagging tools

## Data Structure

- Images are loaded from a folder picked from the folder selector page
- Each image has an associated `.txt` file with comma-separated tags
- File structure pattern: `image.jpg` and `image.txt` in the same directory (supports .jpg, .jpeg, .png, .webp)
- UI state is managed in memory and not persisted between sessions
- Project is run locally and does not need to be concerned with concurrency issues from multi-user scenarios

## Core Features

1. **Image Display**: Paginated gallery of images from assets folder
2. **Tag Management**: UI for adding, editing, reordering tags per image
3. **Filtering System**: Filter images by tags, dimensions, filetype etc
4. **Persistence**: Save modified tags back to text files

## Technical Implementation

- **Package Management**: pnpm
- **Frontend**: Next.js with App Router, React, TypeScript
- **State Management**: Redux / Redux Toolkit for global state (image list, filters), React `useState` for local state
- **Styling**: Tailwind CSS for responsive design; Lucide for icons
- **Language**: Australian English for UI and documentation eg. colour, US English for coding such as variable or function naming eg. color
- **Formatting**: eslint and prettier, imports ordered with an eslint plugin (can ignore import order errors as linting will fix them)
- **Filenames**: Lower kebab-case filenames eg. `file-name.ts` for all Typescript/TSX files
- **Structure**:
  - Follow established file and folder patterns
  - Preference named exports over default exports
  - Only export values and functions that are actually consumed elsewhere
  - Avoid wildcard exports (exception: Redux Toolkit slices)
  - Shared UI components are placed in the `components/shared` folder
  - Shared functions can be found in the `utils` folder
- **UI Timing**: Prefer `requestAnimationFrame` over `setTimeout`, although `setTimeout` is acceptable for longer delays
- **Documentation**:
  - There is no need to document every single prop
  - Use inline comments `//` to describe simple or obvious components or functions _only if the code is complex or unclear_
  - If the component is very complex with many sub-parts (eg. has its own `components` or `hooks` sub-folders), keep a `README.md` file for the component updated to explain its use and structure

## Architecture Decisions

- Feature-based component organisation
- Path alias `@/app/...` for clean imports, at most two `../../` is allowable
- Main development environment is Windows - when needed favour Powershell commands over Unix/BSD tooling

## Performance Considerations

- Optimize image loading for potentially large collections
- Use memoization for expensive operations: `React.memo`, `useSelector`, `useMemo`, and `useCallback` to minimise re-renders and keep the UI fast
- If a component is becoming large, suggest a refactor into more manageable pieces
