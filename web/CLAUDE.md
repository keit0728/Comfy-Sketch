# Claude Code Configuration

This file contains configuration and instructions for Claude Code to work effectively with this project.

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

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit
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