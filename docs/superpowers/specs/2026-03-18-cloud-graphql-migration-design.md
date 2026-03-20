# Cloud Module: Pure GraphQL Migration + Subdomain Support

## Problem

The vetra.to cloud module depends on `@powerhousedao/vetra-cloud-package` to construct document operations locally via `PHDocumentController` / `RemoteDocumentController`, then push them to the switchboard. This creates two problems:

1. **Unnecessary coupling**: The npm package version lags behind the local vetra-cloud-package, causing missing fields (e.g. `subdomain`, `customDomain`) and broken features.
2. **Missing subdomain**: Environments created via vetra.to never get a `subdomain` set. The processor skips gitops sync without one, so environments never deploy to k8s.

## Solution

Replace the controller pattern with direct GraphQL calls to the switchboard's typed API. The switchboard already exposes per-action mutations (`VetraCloudEnvironment_start`, `VetraCloudEnvironment_addPackage`, etc.) that accept a `docId` + `input` and return the full updated document state.

## GraphQL API Shape

### Queries

```graphql
# List environments
VetraCloudEnvironment_findDocuments(search: { parentId: "powerhouse" }) {
  items { id name state { global { name subdomain customDomain status services packages { name version } } } }
  totalCount hasNextPage hasPreviousPage cursor
}

# Get single environment
VetraCloudEnvironment_document(identifier: "<id>") {
  document { id name documentType createdAtUtcIso lastModifiedAtUtcIso
    revisionsList { scope revision }
    state { global { name subdomain customDomain status services packages { name version } } }
  }
}
```

### Mutations

All mutations take `(docId: PHID!, input: <InputType>!)` and return `VetraCloudEnvironmentMutationResult` (full document with updated state).

| Mutation                                                         | Input                                            |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| `VetraCloudEnvironment_createDocument(name!, parentIdentifier?)` | Returns new doc                                  |
| `VetraCloudEnvironment_setEnvironmentName`                       | `{ name: String! }`                              |
| `VetraCloudEnvironment_setSubdomain`                             | `{ subdomain: String! }`                         |
| `VetraCloudEnvironment_setCustomDomain`                          | `{ customDomain: String }`                       |
| `VetraCloudEnvironment_enableService`                            | `{ serviceName: VetraCloudEnvironmentService! }` |
| `VetraCloudEnvironment_disableService`                           | `{ serviceName: VetraCloudEnvironmentService! }` |
| `VetraCloudEnvironment_addPackage`                               | `{ packageName: String!, version: String }`      |
| `VetraCloudEnvironment_removePackage`                            | `{ packageName: String! }`                       |
| `VetraCloudEnvironment_start`                                    | `{ _placeholder: String }`                       |
| `VetraCloudEnvironment_stop`                                     | `{ _placeholder: String }`                       |

## Architecture

### Files to delete

- `modules/cloud/controller.ts` — PHDocumentController setup
- `modules/cloud/hooks/use-environment-controller.ts` — controller hook

### Files to create

#### `modules/cloud/types.ts` (rewrite)

Local TypeScript types matching the GraphQL schema. No external deps.

```typescript
export type CloudEnvironmentService = 'CONNECT' | 'SWITCHBOARD'
export type CloudEnvironmentStatus = 'STARTED' | 'STOPPED' | 'DEPLOYING'

export type CloudPackage = {
  name: string
  version: string | null
}

export type CloudEnvironmentState = {
  name: string | null
  subdomain: string | null
  customDomain: string | null
  services: CloudEnvironmentService[]
  packages: CloudPackage[] | null
  status: CloudEnvironmentStatus
}

export type CloudEnvironment = {
  id: string
  name: string
  documentType: string
  createdAtUtcIso: string
  lastModifiedAtUtcIso: string
  revision: number
  state: CloudEnvironmentState
}
```

#### `modules/cloud/graphql.ts` (new)

Thin GraphQL client. Uses `fetch` directly — no SDK dependency. Contains:

- A generic `gql<T>(query, variables?)` helper that posts to the switchboard endpoint
- Query functions: `fetchEnvironments()`, `fetchEnvironment(id)`
- Mutation functions: `createEnvironment(name, parentId?)`, `setEnvironmentName(docId, name)`, `setSubdomain(docId, subdomain)`, `enableService(docId, serviceName)`, `disableService(docId, serviceName)`, `addPackage(docId, packageName, version?)`, `removePackage(docId, packageName)`, `startEnvironment(docId)`, `stopEnvironment(docId)`, `deleteEnvironment(docId)`
- `createEnvironment` passes `parentIdentifier` from `NEXT_PUBLIC_CLOUD_DRIVE_ID` env var (defaults to `"powerhouse"`), same as the current `DRIVE_ID` constant
- Each mutation function returns the updated `CloudEnvironment`
- GraphQL endpoint comes from `NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL` || `NEXT_PUBLIC_SWITCHBOARD_URL` env var

#### `modules/cloud/subdomain.ts` (new)

Deterministic subdomain generator copied from vetra-cloud-package. Pure function, zero deps:

```typescript
export function generateSubdomain(documentId: string): string
```

Uses the same adjective-animal-number scheme as the source (`hashUUID` → `adjective-animal-NN`). Must produce identical output for the same document ID.

### Files to update

#### `modules/cloud/api.ts` (delete)

Merged into `graphql.ts`. No longer needed as a separate file.

#### `modules/cloud/hooks/use-environment.ts` (update)

- Import from `../graphql` instead of `../api`
- Types from `../types` instead of the npm package
- Same external API: `useEnvironments()`, `useRefreshEnvironments()`, `useEnvironment(id)`

#### `modules/cloud/hooks/use-environment-detail.ts` (new, replaces use-environment-controller)

Hook for the detail page that provides:

```typescript
export function useEnvironmentDetail(documentId: string) {
  // Returns:
  return {
    environment: CloudEnvironment | null, // full document data
    isLoading: boolean,
    error: Error | null,
    // Mutation wrappers (each returns updated state, triggers re-render):
    setName: (name: string) => Promise<void>,
    setSubdomain: (subdomain: string) => Promise<void>,
    enableService: (service: CloudEnvironmentService) => Promise<void>,
    disableService: (service: CloudEnvironmentService) => Promise<void>,
    addPackage: (name: string, version?: string) => Promise<void>,
    removePackage: (name: string) => Promise<void>,
    start: () => Promise<void>,
    stop: () => Promise<void>,
  }
}
```

Each mutation wrapper calls the GraphQL mutation, updates local state from the response, and handles errors. No controller, no push, no onChange subscription.

#### `app/cloud/[project]/page.tsx` (update)

- Replace `useEnvironmentController` with `useEnvironmentDetail`
- Remove all `controller.xxx()` + `await push()` patterns → call mutation wrappers directly
- Add subdomain auto-heal: on load, if `environment.state.subdomain` is null, call `setSubdomain(generateSubdomain(documentId))`
- The `EnvironmentController` type is gone; components receive mutation functions as props instead

#### `app/cloud/new-project-form.tsx` (update)

- Replace `createEnvironmentController` → `createEnvironment(name)` from graphql.ts
- Remove `useRenown` import — no longer needed (was only used for `signer` passed to controller)
- After creation, call `setSubdomain(newDocId, generateSubdomain(newDocId))` before navigating

#### `app/cloud/new/server/[project]/page.tsx` (update)

- Replace `useEnvironmentController` with `useEnvironmentDetail`
- Replace `controller.addPackage({...})` + `push()` with `addPackage(name, version)` wrapper

#### `app/cloud/cloud-dashboard.tsx` + `app/cloud/cloud-projects.tsx` (minor)

- Update type imports to use local `CloudEnvironment` type
- `deleteDocument` moves into `graphql.ts`

### Dependency removal

Remove from `package.json`:

- `@powerhousedao/vetra-cloud-package`

Check if `@powerhousedao/reactor-browser` imports (`createClient`, `useRenown`, `RemoteDocumentController`) are still needed elsewhere. `useUser` is used for auth in `app/cloud/page.tsx` — that stays. `useRenown` in `new-project-form.tsx` is removed (was only used for controller's `signer`). `createClient` and `RemoteDocumentController` imports get removed.

## Subdomain Flow

### New environments

1. User submits name in creation form
2. `createEnvironment(name)` mutation → returns doc with `id`
3. `setSubdomain(id, generateSubdomain(id))` mutation → subdomain set
4. Navigate to detail page

### Existing environments with null subdomain

1. Detail page loads, fetches document
2. If `state.subdomain` is null, auto-heal: `setSubdomain(id, generateSubdomain(id))`
3. Guard with a `useRef` flag to prevent double-firing on re-renders
4. Processor receives the operation, gitops sync proceeds

### Subdomain generator

The `generateSubdomain` function is deterministic (hash of document UUID → adjective-animal-NN). Copied verbatim from `vetra-cloud-package/shared/subdomain-generator.ts` to ensure identical output.

## Migration Checklist

1. Create `modules/cloud/types.ts` with local types
2. Create `modules/cloud/subdomain.ts` with generator
3. Create `modules/cloud/graphql.ts` with queries + mutations
4. Create `modules/cloud/hooks/use-environment-detail.ts`
5. Update `modules/cloud/hooks/use-environment.ts`
6. Update `app/cloud/new-project-form.tsx`
7. Update `app/cloud/[project]/page.tsx` (detail page + subdomain auto-heal)
8. Update `app/cloud/new/server/[project]/page.tsx` (add package page)
9. Update `app/cloud/cloud-dashboard.tsx` + `cloud-projects.tsx`
10. Delete `modules/cloud/controller.ts`
11. Delete `modules/cloud/hooks/use-environment-controller.ts`
12. Delete `modules/cloud/api.ts`
13. Delete `modules/cloud/client.ts` (endpoint config moves into graphql.ts)
14. Remove `@powerhousedao/vetra-cloud-package` from package.json + pnpm install
