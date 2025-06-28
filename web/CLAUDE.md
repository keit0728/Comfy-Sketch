# Claude Code Configuration

This file contains configuration and instructions for Claude Code to work effectively with this project.

## Language Settings

- **Response Language**: Always respond in Japanese (日本語) unless explicitly requested otherwise

## Project Overview

This is a Next.js web application with TypeScript, using internationalization (i18n) and component-based architecture.

## Technology Stack

- Next.js with App Router
- TypeScript
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
- Use kebab-case for file names
- Use Tailwind CSS for styling
- Support both English and Japanese locales
- All comments in source code must be written in English
- NEVER use `console.log()` statements for debugging - remove all debug logging before completing tasks
- When defining useState, always specify the type explicitly (e.g., `useState<boolean>(false)`, `useState<string>('')`, `useState<number>(0)`)
- Function components must always be defined using FC type with className and ...props as parameters
- Each file should contain only one function component

## UI Components and Design

- Use shadcn/ui components as much as possible for consistent design
- Page-specific components should be placed in `src/app/[locale]/<page-name>/(components)` directory. Exception: home page components should be placed in `src/app/[locale]/(components)`
- Common components used across all pages should be placed in `src/components/common`
- The `src/components/ui` directory should only contain components downloaded via shadcn/ui

## Internationalization (i18n)

- All features must support i18n
- Manage i18n message files according to these rules:
  - `common.json` - Store strings used in common components
  - `page-name.json` - Store strings used in page-specific components

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
