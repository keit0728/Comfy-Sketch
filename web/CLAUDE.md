# Claude Code Configuration

This file contains configuration and instructions for Claude Code to work effectively with this project.

## Project Overview

This is a Next.js web application with TypeScript, using internationalization (i18n) and component-based architecture. The project allows users to draw in 2D space using Three.js for rendering and canvas manipulation.

## Technology Stack

- Next.js with App Router
- TypeScript
- Three.js for 2D drawing and canvas rendering
- Tailwind CSS
- ESLint
- Internationalization (i18n) with English and Japanese support

## Development Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run format
npm run format
```

## Project Structure

- `src/app/` - Next.js app router pages and layouts
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and shared code
- `src/i18n/` - Internationalization configuration
- `messages/` - Translation files for different locales
- `public/` - Static assets

## Code Conventions

- Use TypeScript for type safety
- Follow existing component patterns in `src/components/`
- Maintain consistent file naming conventions
- Use Tailwind CSS for styling
- Support both English and Japanese locales
- All comments in source code must be written in English
- NEVER use `console.log()` statements for debugging - remove all debug logging before completing tasks

## State Management with Jotai

When using Jotai for state management, follow these guidelines for proper hook usage:

- **useAtom**: Use when you need both the value and setter function
  ```typescript
  const [value, setValue] = useAtom(myAtom);
  ```

- **useAtomValue**: Use when you only need to read the value (read-only access)
  ```typescript
  const value = useAtomValue(myAtom);
  ```

- **useSetAtom**: Use when you only need the setter function (write-only access)
  ```typescript
  const setValue = useSetAtom(myAtom);
  ```

Choose the appropriate hook based on your component's needs to optimize performance and prevent unnecessary re-renders.
