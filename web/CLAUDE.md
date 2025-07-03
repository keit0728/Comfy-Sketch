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
- `docs/spec/` - Feature specifications and technical documentation

## Code Conventions

- Use TypeScript for type safety
- Follow existing component patterns in `src/components/`
- Maintain consistent file naming conventions
- Use kebab-case for file names
- Use Tailwind CSS for styling
- Support both English and Japanese locales
- All comments in source code must be written in English
- When defining useState, always specify the type explicitly (e.g., `useState<boolean>(false)`, `useState<string>('')`, `useState<number>(0)`)
- Function components must always be defined using FC type with className and ...props as parameters
- Each file should contain only one function component

## UI Components and Design

- Use shadcn/ui components as much as possible for consistent design
- Page-specific components should be placed in `src/app/[locale]/<page-name>/(components)` directory. Exception: home page components should be placed in `src/app/[locale]/(components)`
- Common components used across all pages should be placed in `src/components/common`
- The `src/components/ui` directory should only contain components downloaded via shadcn/ui
- Component directories (`(components)`) should only contain React component files (.tsx)
- Type definitions and utility functions specific to components should be placed in `src/lib/<feature-name>/` directory:
  - `src/lib/<feature-name>/types.ts` - Type definitions and interfaces
  - `src/lib/<feature-name>/utils.ts` - Utility functions
  - Example: Drawing-related types and utils are in `src/lib/drawing/`

## Internationalization (i18n)

- All features must support i18n (both English and Japanese)
- Manage i18n message files according to these rules:
  - Messages are organized by page in `messages/[locale]/[page-name].json`
  - `common.json` - Store strings used in common components shared across pages
  - `[page-name].json` - Store ALL strings used in that specific page, including:
    - Page-specific component strings
    - Dialog messages related to that page
    - Toast/notification messages for that page's features
  - Example: For the home page, all export dialog messages should be in `home.json` under `exportDialog` section, NOT in a separate `export.json` file
- When implementing new features:
  - Always add both English and Japanese translations
  - Group related messages under logical sections within the page's JSON file
  - Use nested structure for related UI components (e.g., `home.toolbar`, `home.exportDialog`)

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

## Feature Specifications

Before implementing new features or modifying existing ones, always review the relevant specifications in the `docs/spec/` directory:

- `docs/spec/pen-tool.md` - Pen tool specifications
- `docs/spec/eraser-tool.md` - Eraser tool specifications
- `docs/spec/select-tool.md` - Select tool specifications
- `docs/spec/layer-system.md` - Layer system specifications
- `docs/spec/undo-redo.md` - Undo/Redo functionality specifications

These specifications document the expected behavior and implementation details of each feature.
