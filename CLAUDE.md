# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production with Turbopack
- `pnpm start` - Start production server

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

### Testing

- `npx vitest` - Run tests (Vitest with Storybook integration)
- Tests are integrated with Storybook stories via `@storybook/addon-vitest`

### GraphQL & Code Generation

- `pnpm codegen` - Generate TypeScript types and React Query hooks from GraphQL schema
- Schema URL: `https://switchboard.staging.vetra.io/graphql`
- Generated files: `modules/__generated__/graphql/gql-generated.ts`

### Storybook

- `pnpm storybook` - Start Storybook dev server on port 6006
- `pnpm build-storybook` - Build Storybook for production

## Architecture Overview

### Project Structure

- **Next.js 15 App Router** - Main framework with standalone output
- **Modular Architecture** - Code organized in `modules/` directory by feature
- **Component Library** - Comprehensive UI components in `modules/shared/components/ui/`

### Key Directories

- `app/` - Next.js App Router pages and API routes
- `modules/` - Feature-specific modules (builders, cloud, home, shared)
- `modules/shared/` - Shared components, utilities, and configurations
- `modules/__generated__/` - Auto-generated GraphQL types and hooks

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI components
- **State Management**: TanStack Query (React Query v5)
- **GraphQL**: GraphQL Codegen with React Query integration
- **Testing**: Vitest with Storybook integration
- **Build**: Turbopack (Next.js experimental)

### Environment Configuration

- Runtime environment variables via `window.__ENV` in layout.tsx
- Environment validation using Zod schemas in `modules/shared/config/`
- Supports both build-time and runtime configuration

### GraphQL Integration

- Custom fetcher with Next.js caching support (`modules/shared/lib/fetcher.ts`)
- Auto-generated hooks for switchboard API
- Type-safe GraphQL operations with cache control

### Component Development

- All UI components have Storybook stories
- Consistent styling with `cn()` utility (clsx + tailwind-merge)
- Radix UI primitives for accessibility

### Special Features

- **Powerhouse Ecosystem**: Integration with @powerhousedao/reactor and related packages
- **Renown Provider**: Identity and authentication system
- **Theme Support**: Light/dark theme with next-themes
- **SVG Handling**: Custom SVGR configuration for Turbopack

### Code Organization Patterns

- Feature modules contain their own components, hooks, and utilities
- Shared utilities in `modules/shared/lib/`
- Type definitions in respective module directories
- Consistent barrel exports via index.ts files

### Development Notes

- Uses pnpm as package manager
- Turbopack enabled for faster builds
- Docker support with standalone output
- Semantic releases configured
