This is a [Next.js](https://nextjs.org) project using React, Redux and TypeScript. Package management is handled with `pnpm`.

## Getting Started

To run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Coding Style

### Project Structure

```
/src
  /app                    # Next.js App Router structure
    /components           # Reusable UI components
      /asset              # Asset-related components
      /shared             # Shared utility components
      /tagging            # Tagging functionality
    /constants            # Application constants
    /providers            # React context providers
    /store                # Redux store configuration
      /assets             # Asset-related state
      /filters            # Filter-related state
      /middleware         # Redux middleware
    /utils                # Utility functions
    /views                # Page-specific components
    layout.tsx            # Root layout component
    page.tsx              # Home page component
```

### Component Organization

1. **Feature-based Structure**: Components are organized by feature (asset, tagging, etc.)
2. **Component Hierarchy**:
   - Main components at the root level of feature directory
   - Subcomponents in a `/components` subdirectory
   - Hooks in a `/hooks` subdirectory
   - Only use `index.ts` files to export sub-component folder contents, hook folder contents, or Redux slices.

### State Management

1. **Global State**: Redux with Redux Toolkit for application-wide state
   - Store organized by domain (assets, filters)
   - Use typed selectors and action creators

2. **Local State**: React hooks for component-specific state
   - `useState` for simple state
   - `useReducer` for complex state logic or to avoid long prop drilling
   - Custom hooks to encapsulate related state and logic

3. **Context API**: Used to avoid prop drilling within feature boundaries
   - Keep contexts focused on specific features
   - Provide proper TypeScript typing for context values
   - Use context providers only where there is a lot of state or component complexity

### TypeScript Usage

1. **Strict Type Safety**: TypeScript's strict mode is enabled
2. **Type Definitions**:
   - Define interfaces for component props
   - Use type inference where possible
   - Export types and interfaces for reuse
3. **Path Aliases**: Use `@/*` import paths for cleaner imports

### Component Design

1. **Composition over Inheritance**: Build complex UIs by composing smaller components
2. **Single Responsibility**: Each component should do one thing well
3. **Container/Presentational Pattern**: Separate data management from presentation
4. **Custom Hooks**: Extract reusable logic into custom hooks

### CSS and Styling

1. **Tailwind CSS**: Use Tailwind utilities for styling
2. **Component Classes**: Group related Tailwind classes with meaningful names
3. **Responsive Design**: Use Tailwind's responsive prefixes consistently

### Import Conventions

1. **Organized Imports**: Use the simple-import-sort plugin rules
2. **Import Order**:
   - External dependencies first
   - Internal absolute imports
   - Relative imports
     - An eslint plugin to automatically sort import order is used

### Code Formatting

1. **Prettier**: Automatic code formatting using Prettier
2. **ESLint**: Code quality rules enforced by ESLint
3. **Consistency**: Follow existing patterns in the codebase
4. **Knip**: Run every now and then to help find unused code

### Documentation

1. **README Files**: Each major feature has its own README
2. **Code Comments**: Document complex logic and non-obvious decisions
3. **JSDoc**: Use JSDoc comments for public APIs and utility functions

### Performance Considerations

1. **Memoization**: Use React.memo, useMemo, and useCallback appropriately
2. **Code Splitting**: Utilize Next.js dynamic imports for larger components
3. **Bundle Size**: Monitor and optimize bundle size
