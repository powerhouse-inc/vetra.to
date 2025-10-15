# Packages Module

This module provides a comprehensive packages listing page that fetches and displays Vetra packages from the Switchboard GraphQL API.

## Features

- **Server-Side Data Fetching**: Package data is fetched server-side for optimal SEO and performance
- **Client-Side Filtering**: Interactive filtering by search query, user experiences, and categories
- **Responsive Grid Layout**: Adaptive card grid that works across all screen sizes
- **Type-Safe**: Fully typed with TypeScript
- **Real-time Filter Updates**: Instant filtering without page reloads

## Structure

```
modules/packages/
├── components/
│   ├── index.ts                 # Component exports
│   ├── package-item-card.tsx    # Individual package card component
│   ├── package-filters.tsx      # Sidebar filters component
│   └── packages-list.tsx        # Main list component with filtering logic
└── lib/
    └── server-data.ts          # GraphQL client and data fetching functions
```

## Usage

The packages page is available at `/packages` and is rendered by `app/packages/page.tsx`.

### Server-Side Data Fetching

```typescript
import { getVetraPackages } from '@/modules/packages/lib/server-data'

const packages = await getVetraPackages({
  search: 'optional search term',
  sortOrder: 'asc' | 'desc',
  documentId_in: ['optional', 'array', 'of', 'ids'],
})
```

### Components

#### PackageItemCard

Displays an individual package with icon, category, author, and description.

```tsx
<PackageItemCard
  documentId="unique-id"
  name="Package Name"
  description="Package description"
  category="Document Model"
  authorName="BAI-team"
/>
```

#### PackageFilters

Provides sidebar filtering UI with search, user experiences, and categories.

```tsx
<PackageFilters
  onFilterChange={(filters) => {
    // Handle filter changes
  }}
  totalCount={packages.length}
/>
```

#### PackagesList

Main component that combines filters and package cards with client-side filtering logic.

```tsx
<PackagesList packages={packages} />
```

## GraphQL Schema

The module queries the `vetraPackages` query from Switchboard:

```graphql
query GetVetraPackages($search: String, $sortOrder: String, $documentId_in: [String!]) {
  vetraPackages(search: $search, sortOrder: $sortOrder, documentId_in: $documentId_in) {
    documentId
    name
    description
    category
    authorName
    authorWebsite
    githubUrl
    npmUrl
    driveId
  }
}
```

## Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_SWITCHBOARD_URL=https://switchboard.staging.vetra.io/graphql
```

## Styling

The module uses Tailwind CSS and shadcn/ui components for consistent styling with the rest of the application.

## Category Icons

Package cards display different icons based on category:

- **Processor**: Database icon (blue)
- **Subgraph**: Layers icon (purple)
- **Application/Codegen**: Code icon (orange)
- **Editor**: File code icon (blue)
- **Default**: File text icon (orange)
