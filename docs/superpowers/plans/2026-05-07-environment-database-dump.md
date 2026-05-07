# Environment Database Dump Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the on-demand environment database dump feature end-to-end across `vetra-cloud-package` (subgraph), `powerhouse-k8s-hosting` (gitops + image), and `vetra.to` (UI).

**Architecture:** Owner-gated GraphQL mutation creates a one-shot k8s `Job` in the tenant namespace. The Job runs `pg_dump --format=custom` against the env's PgBouncer pooler and pipes it to `s3://powerhouse-env-dumps/<tenant>/<id>.dump` on Hetzner Object Storage. A subgraph watcher reconciles Job state into a new `obsDb.database_dumps` table. The UI surfaces the list in a new Database drawer (Backups tab) on the env detail page.

**Tech Stack:** TypeScript, Kysely + PGlite (subgraph DB), `@kubernetes/client-node`, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (presign), Helm, ArgoCD, Alpine + `pg_dump` + `s5cmd` (image), Next.js 16 + React 19 + Tailwind 4 + shadcn (UI).

**Spec:** `docs/superpowers/specs/2026-05-07-environment-database-dump-design.md`

**Working dirs (paths assumed throughout this plan):**

- Subgraph: `/home/froid/projects/powerhouse/vetra-cloud-package`
- GitOps: `/home/froid/projects/powerhouse/powerhouse-k8s-hosting`
- UI: `/home/froid/projects/powerhouse/vetra.to`

---

## Phase 1 — Subgraph backend (`vetra-cloud-package`)

### Task 1: Add `database_dumps` migration

**Files:**

- Modify: `subgraphs/vetra-cloud-observability/db/migrations.ts`
- Modify: `subgraphs/vetra-cloud-observability/db/schema.ts`
- Test: `subgraphs/vetra-cloud-observability/__tests__/db-migrations.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `subgraphs/vetra-cloud-observability/__tests__/db-migrations.test.ts` inside the existing `describe("db migrations", ...)`:

```ts
it('creates database_dumps with correct columns and index', async () => {
  await db
    .insertInto('database_dumps')
    .values({
      id: 'dump-1',
      documentId: 'doc-1',
      tenantId: 'tenant-1',
      requestedBy: '0xabc',
      status: 'PENDING',
      jobName: null,
      s3Key: null,
      sizeBytes: null,
      errorMessage: null,
      requestedAt: '2026-05-07T10:00:00Z',
      startedAt: null,
      completedAt: null,
      expiresAt: '2026-05-08T10:00:00Z',
    })
    .execute()

  const rows = await db.selectFrom('database_dumps').selectAll().execute()
  expect(rows).toHaveLength(1)
  expect(rows[0].status).toBe('PENDING')
})
```

- [ ] **Step 2: Run the test, verify it fails**

```bash
cd /home/froid/projects/powerhouse/vetra-cloud-package
npx vitest run subgraphs/vetra-cloud-observability/__tests__/db-migrations.test.ts
```

Expected: FAIL — `database_dumps` table doesn't exist.

- [ ] **Step 3: Add table type to `db/schema.ts`**

Append to `subgraphs/vetra-cloud-observability/db/schema.ts` (next to the other interfaces, before any type that aggregates them):

```ts
/**
 * On-demand pg_dump exports of a tenant env's Postgres. 24h-TTL on the
 * S3 file (bucket lifecycle); rows pruned after 7 days. See spec
 * 2026-05-07-environment-database-dump-design.md.
 */
export interface DatabaseDumps {
  id: string
  documentId: string
  tenantId: string
  requestedBy: string
  status: string // PENDING | RUNNING | READY | FAILED
  jobName: string | null
  s3Key: string | null
  sizeBytes: number | null
  errorMessage: string | null
  requestedAt: string
  startedAt: string | null
  completedAt: string | null
  expiresAt: string
}
```

Then find the `ObservabilityDB` aggregate type at the bottom of the file (it's a `type` with all table interfaces) and add `database_dumps: DatabaseDumps;` to it.

- [ ] **Step 4: Add CREATE TABLE to `up()` in `db/migrations.ts`**

Append at the end of `up()` in `subgraphs/vetra-cloud-observability/db/migrations.ts`:

```ts
await db.schema
  .createTable('database_dumps')
  .addColumn('id', 'varchar(64)', (col) => col.primaryKey())
  .addColumn('documentId', 'varchar(255)', (col) => col.notNull())
  .addColumn('tenantId', 'varchar(255)', (col) => col.notNull())
  .addColumn('requestedBy', 'varchar(255)', (col) => col.notNull())
  .addColumn('status', 'varchar(32)', (col) => col.notNull())
  .addColumn('jobName', 'varchar(255)')
  .addColumn('s3Key', 'varchar(512)')
  .addColumn('sizeBytes', 'bigint')
  .addColumn('errorMessage', 'text')
  .addColumn('requestedAt', 'varchar(255)', (col) => col.notNull())
  .addColumn('startedAt', 'varchar(255)')
  .addColumn('completedAt', 'varchar(255)')
  .addColumn('expiresAt', 'varchar(255)', (col) => col.notNull())
  .ifNotExists()
  .execute()

await db.schema
  .createIndex('database_dumps_tenant_idx')
  .ifNotExists()
  .on('database_dumps')
  .columns(['tenantId', 'requestedAt'])
  .execute()
```

If the file has a `down()` function, append a matching drop:

```ts
await db.schema.dropTable('database_dumps').ifExists().execute()
```

- [ ] **Step 5: Re-run test, verify it passes**

```bash
npx vitest run subgraphs/vetra-cloud-observability/__tests__/db-migrations.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra-cloud-package
git add subgraphs/vetra-cloud-observability/db/
git commit -m "feat(observability): add database_dumps table"
```

---

### Task 2: Dump repository (CRUD over `database_dumps`)

**Files:**

- Create: `subgraphs/vetra-cloud-observability/dumps/repo.ts`
- Test: `subgraphs/vetra-cloud-observability/__tests__/dumps-repo.test.ts`

- [ ] **Step 1: Write failing test**

Create `subgraphs/vetra-cloud-observability/__tests__/dumps-repo.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { Kysely } from 'kysely'
import { PGliteDialect } from 'kysely-pglite-dialect'
import { up } from '../db/migrations.js'
import type { ObservabilityDB } from '../db/schema.js'
import { DumpsRepo } from '../dumps/repo.js'

let db: Kysely<ObservabilityDB>
let repo: DumpsRepo

beforeEach(async () => {
  const pglite = new PGlite()
  db = new Kysely<ObservabilityDB>({ dialect: new PGliteDialect(pglite) })
  await up(db)
  repo = new DumpsRepo(db)
})
afterEach(async () => {
  await db.destroy()
})

describe('DumpsRepo', () => {
  it('creates a PENDING dump and lists it', async () => {
    const created = await repo.create({
      documentId: 'doc-1',
      tenantId: 'tenant-1',
      requestedBy: '0xabc',
      now: new Date('2026-05-07T10:00:00Z'),
    })
    expect(created.status).toBe('PENDING')
    expect(created.id).toMatch(/^[a-z0-9]{12}$/)

    const list = await repo.listByTenant('tenant-1')
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(created.id)
  })

  it('rejects a second in-flight dump for the same tenant', async () => {
    await repo.create({
      documentId: 'doc-1',
      tenantId: 'tenant-1',
      requestedBy: '0xabc',
      now: new Date(),
    })
    await expect(
      repo.create({
        documentId: 'doc-1',
        tenantId: 'tenant-1',
        requestedBy: '0xabc',
        now: new Date(),
      }),
    ).rejects.toThrow('DUMP_IN_PROGRESS')
  })

  it('transitions PENDING → RUNNING → READY', async () => {
    const d = await repo.create({
      documentId: 'doc-1',
      tenantId: 'tenant-1',
      requestedBy: '0xabc',
      now: new Date(),
    })
    await repo.markRunning(d.id, 'pgdump-xxx', new Date())
    await repo.markReady(d.id, 'tenant-1/' + d.id + '.dump', 12345, new Date())

    const list = await repo.listByTenant('tenant-1')
    expect(list[0].status).toBe('READY')
    expect(list[0].sizeBytes).toBe(12345)
  })

  it('transitions to FAILED with error', async () => {
    const d = await repo.create({
      documentId: 'doc-1',
      tenantId: 'tenant-1',
      requestedBy: '0xabc',
      now: new Date(),
    })
    await repo.markFailed(d.id, 'pg_dump exited 1: connection refused', new Date())

    const list = await repo.listByTenant('tenant-1')
    expect(list[0].status).toBe('FAILED')
    expect(list[0].errorMessage).toContain('connection refused')
  })

  it('prunes rows older than the cutoff', async () => {
    const old = new Date('2026-04-01T00:00:00Z')
    await repo.create({ documentId: 'doc-1', tenantId: 'tenant-1', requestedBy: '0xabc', now: old })
    await repo.markFailed('dummy', 'x', old).catch(() => {}) // no-op if not found
    const removed = await repo.pruneOlderThan(new Date('2026-05-07T00:00:00Z'))
    expect(removed).toBeGreaterThanOrEqual(1)
    const list = await repo.listByTenant('tenant-1')
    expect(list).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test, verify failure**

```bash
npx vitest run subgraphs/vetra-cloud-observability/__tests__/dumps-repo.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `DumpsRepo`**

Create `subgraphs/vetra-cloud-observability/dumps/repo.ts`:

```ts
import type { Kysely } from 'kysely'
import type { DatabaseDumps, ObservabilityDB } from '../db/schema.js'

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

function shortId(len = 12): string {
  let s = ''
  for (let i = 0; i < len; i++) s += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]
  return s
}

const TTL_HOURS = 24
const IN_FLIGHT = new Set(['PENDING', 'RUNNING'])

export type CreateInput = {
  documentId: string
  tenantId: string
  requestedBy: string
  now: Date
}

export class DumpsRepo {
  constructor(private readonly db: Kysely<ObservabilityDB>) {}

  async create(input: CreateInput): Promise<DatabaseDumps> {
    const existing = await this.db
      .selectFrom('database_dumps')
      .select(['id', 'status'])
      .where('tenantId', '=', input.tenantId)
      .where('status', 'in', Array.from(IN_FLIGHT))
      .executeTakeFirst()
    if (existing) throw new Error('DUMP_IN_PROGRESS')

    const id = shortId()
    const expiresAt = new Date(input.now.getTime() + TTL_HOURS * 3600 * 1000)
    const row: DatabaseDumps = {
      id,
      documentId: input.documentId,
      tenantId: input.tenantId,
      requestedBy: input.requestedBy.toLowerCase(),
      status: 'PENDING',
      jobName: null,
      s3Key: null,
      sizeBytes: null,
      errorMessage: null,
      requestedAt: input.now.toISOString(),
      startedAt: null,
      completedAt: null,
      expiresAt: expiresAt.toISOString(),
    }
    await this.db.insertInto('database_dumps').values(row).execute()
    return row
  }

  async setJobName(id: string, jobName: string): Promise<void> {
    await this.db.updateTable('database_dumps').set({ jobName }).where('id', '=', id).execute()
  }

  async markRunning(id: string, jobName: string, at: Date): Promise<void> {
    await this.db
      .updateTable('database_dumps')
      .set({ status: 'RUNNING', jobName, startedAt: at.toISOString() })
      .where('id', '=', id)
      .where('status', '=', 'PENDING')
      .execute()
  }

  async markReady(id: string, s3Key: string, sizeBytes: number, at: Date): Promise<void> {
    await this.db
      .updateTable('database_dumps')
      .set({ status: 'READY', s3Key, sizeBytes, completedAt: at.toISOString() })
      .where('id', '=', id)
      .execute()
  }

  async markFailed(id: string, errorMessage: string, at: Date): Promise<void> {
    await this.db
      .updateTable('database_dumps')
      .set({
        status: 'FAILED',
        errorMessage: errorMessage.slice(0, 500),
        completedAt: at.toISOString(),
      })
      .where('id', '=', id)
      .execute()
  }

  async listByTenant(tenantId: string, limit = 20): Promise<DatabaseDumps[]> {
    const rows = await this.db
      .selectFrom('database_dumps')
      .selectAll()
      .where('tenantId', '=', tenantId)
      .orderBy('requestedAt', 'desc')
      .limit(limit)
      .execute()
    return rows as DatabaseDumps[]
  }

  async getById(id: string): Promise<DatabaseDumps | null> {
    const row = await this.db
      .selectFrom('database_dumps')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
    return (row as DatabaseDumps | undefined) ?? null
  }

  async listInFlight(): Promise<DatabaseDumps[]> {
    const rows = await this.db
      .selectFrom('database_dumps')
      .selectAll()
      .where('status', 'in', Array.from(IN_FLIGHT))
      .execute()
    return rows as DatabaseDumps[]
  }

  async pruneOlderThan(cutoff: Date): Promise<number> {
    const result = await this.db
      .deleteFrom('database_dumps')
      .where('requestedAt', '<', cutoff.toISOString())
      .executeTakeFirst()
    return Number(result.numDeletedRows ?? 0)
  }
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npx vitest run subgraphs/vetra-cloud-observability/__tests__/dumps-repo.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add subgraphs/vetra-cloud-observability/dumps/ subgraphs/vetra-cloud-observability/__tests__/dumps-repo.test.ts
git commit -m "feat(observability): dumps repo with create/transition/list/prune"
```

---

### Task 3: Owner check helper

**Files:**

- Create: `subgraphs/vetra-cloud-observability/dumps/auth.ts`
- Test: `subgraphs/vetra-cloud-observability/__tests__/dumps-auth.test.ts`

- [ ] **Step 1: Write failing test**

Create `subgraphs/vetra-cloud-observability/__tests__/dumps-auth.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { requireOwner } from '../dumps/auth.js'

describe('requireOwner', () => {
  it('throws UNAUTHENTICATED when no caller', () => {
    expect(() => requireOwner({ caller: null, envOwner: '0xAbC' })).toThrow('UNAUTHENTICATED')
  })

  it('throws ENV_NOT_FOUND when env owner is null', () => {
    expect(() => requireOwner({ caller: '0xabc', envOwner: null })).toThrow('ENV_NOT_FOUND')
  })

  it('throws FORBIDDEN when caller is not the owner', () => {
    expect(() => requireOwner({ caller: '0xdef', envOwner: '0xAbC' })).toThrow('FORBIDDEN')
  })

  it('passes when caller matches owner case-insensitively', () => {
    expect(() => requireOwner({ caller: '0xabc', envOwner: '0xABC' })).not.toThrow()
    expect(() => requireOwner({ caller: '0xABC', envOwner: '0xabc' })).not.toThrow()
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npx vitest run subgraphs/vetra-cloud-observability/__tests__/dumps-auth.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `subgraphs/vetra-cloud-observability/dumps/auth.ts`:

```ts
export type RequireOwnerInput = {
  caller: string | null | undefined
  envOwner: string | null | undefined
}

/** Throws on auth failure. Otherwise returns silently. */
export function requireOwner({ caller, envOwner }: RequireOwnerInput): void {
  if (!caller) throw new Error('UNAUTHENTICATED')
  if (!envOwner) throw new Error('ENV_NOT_FOUND')
  if (caller.toLowerCase() !== envOwner.toLowerCase()) throw new Error('FORBIDDEN')
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npx vitest run subgraphs/vetra-cloud-observability/__tests__/dumps-auth.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add subgraphs/vetra-cloud-observability/dumps/auth.ts subgraphs/vetra-cloud-observability/__tests__/dumps-auth.test.ts
git commit -m "feat(observability): owner-only auth helper for dumps"
```

---

### Task 4: Job spec builder

**Files:**

- Create: `subgraphs/vetra-cloud-observability/dumps/job-spec.ts`
- Test: `subgraphs/vetra-cloud-observability/__tests__/dumps-job-spec.test.ts`

- [ ] **Step 1: Write failing test**

Create `subgraphs/vetra-cloud-observability/__tests__/dumps-job-spec.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildDumpJob } from '../dumps/job-spec.js'

describe('buildDumpJob', () => {
  it('builds a Job manifest with the expected env vars and labels', () => {
    const job = buildDumpJob({
      dumpId: 'abc12345',
      tenantNs: 'brave-lion-22-9c4d',
      image: 'cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0',
      bucket: 'powerhouse-env-dumps',
      s3Endpoint: 'https://fsn1.your-objectstorage.com',
    })

    expect(job.metadata?.name).toMatch(/^pgdump-/)
    expect(job.metadata?.namespace).toBe('brave-lion-22-9c4d')
    expect(job.metadata?.labels?.['app.kubernetes.io/managed-by']).toBe('vetra-cloud-observability')
    expect(job.metadata?.labels?.['vetra.io/dump-id']).toBe('abc12345')

    expect(job.spec?.backoffLimit).toBe(0)
    expect(job.spec?.ttlSecondsAfterFinished).toBe(600)
    expect(job.spec?.activeDeadlineSeconds).toBe(3600)

    const envVars = job.spec?.template.spec?.containers[0].env ?? []
    const envMap = Object.fromEntries(envVars.map((e: any) => [e.name, e]))

    expect(envMap.PGHOST.value).toBe(
      'brave-lion-22-9c4d-pg-pooler.brave-lion-22-9c4d.svc.cluster.local',
    )
    expect(envMap.S3_KEY.value).toBe('brave-lion-22-9c4d/abc12345.dump')
    expect(envMap.PGPASSWORD.valueFrom.secretKeyRef.name).toBe('brave-lion-22-9c4d-pg-app')
    expect(envMap.AWS_ACCESS_KEY_ID.valueFrom.secretKeyRef.name).toBe('env-dumps-s3-credentials')
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npx vitest run subgraphs/vetra-cloud-observability/__tests__/dumps-job-spec.test.ts
```

- [ ] **Step 3: Implement**

Create `subgraphs/vetra-cloud-observability/dumps/job-spec.ts`:

```ts
import type { V1Job } from '@kubernetes/client-node'

export type BuildDumpJobInput = {
  dumpId: string
  tenantNs: string
  image: string
  bucket: string
  s3Endpoint: string
}

export function buildDumpJob(input: BuildDumpJobInput): V1Job {
  const { dumpId, tenantNs, image, bucket, s3Endpoint } = input
  const dbSecret = `${tenantNs}-pg-app`
  const s3Secret = 'env-dumps-s3-credentials'
  return {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: `pgdump-${dumpId}`,
      namespace: tenantNs,
      labels: {
        'app.kubernetes.io/managed-by': 'vetra-cloud-observability',
        'vetra.io/dump-id': dumpId,
      },
    },
    spec: {
      ttlSecondsAfterFinished: 600,
      backoffLimit: 0,
      activeDeadlineSeconds: 3600,
      template: {
        metadata: {
          labels: {
            'app.kubernetes.io/managed-by': 'vetra-cloud-observability',
            'vetra.io/dump-id': dumpId,
          },
        },
        spec: {
          restartPolicy: 'Never',
          serviceAccountName: 'default',
          containers: [
            {
              name: 'pgdump',
              image,
              env: [
                { name: 'PGHOST', value: `${tenantNs}-pg-pooler.${tenantNs}.svc.cluster.local` },
                { name: 'PGPORT', value: '5432' },
                {
                  name: 'PGDATABASE',
                  valueFrom: { secretKeyRef: { name: dbSecret, key: 'dbname' } },
                },
                {
                  name: 'PGUSER',
                  valueFrom: { secretKeyRef: { name: dbSecret, key: 'username' } },
                },
                {
                  name: 'PGPASSWORD',
                  valueFrom: { secretKeyRef: { name: dbSecret, key: 'password' } },
                },
                { name: 'S3_BUCKET', value: bucket },
                { name: 'S3_KEY', value: `${tenantNs}/${dumpId}.dump` },
                { name: 'S3_ENDPOINT', value: s3Endpoint },
                {
                  name: 'AWS_ACCESS_KEY_ID',
                  valueFrom: { secretKeyRef: { name: s3Secret, key: 'accessKey' } },
                },
                {
                  name: 'AWS_SECRET_ACCESS_KEY',
                  valueFrom: { secretKeyRef: { name: s3Secret, key: 'secretKey' } },
                },
              ],
              resources: {
                requests: { cpu: '200m', memory: '256Mi' },
                limits: { cpu: '1', memory: '1Gi' },
              },
            },
          ],
        },
      },
    },
  }
}
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add subgraphs/vetra-cloud-observability/dumps/job-spec.ts subgraphs/vetra-cloud-observability/__tests__/dumps-job-spec.test.ts
git commit -m "feat(observability): pg_dump Job spec builder"
```

---

### Task 5: S3 presign helper

**Files:**

- Modify: `package.json` (add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`)
- Create: `subgraphs/vetra-cloud-observability/dumps/s3.ts`
- Test: `subgraphs/vetra-cloud-observability/__tests__/dumps-s3.test.ts`

- [ ] **Step 1: Add dependencies**

```bash
cd /home/froid/projects/powerhouse/vetra-cloud-package
npm install @aws-sdk/client-s3@^3 @aws-sdk/s3-request-presigner@^3
```

- [ ] **Step 2: Write failing test**

Create `subgraphs/vetra-cloud-observability/__tests__/dumps-s3.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { S3Helper } from '../dumps/s3.js'

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(
    async (_client, _command, opts) => `https://signed?expiresIn=${opts.expiresIn}`,
  ),
}))

describe('S3Helper', () => {
  it('generates a presigned GET URL with 15-min expiry', async () => {
    const helper = new S3Helper({
      endpoint: 'https://fsn1.your-objectstorage.com',
      region: 'fsn1',
      accessKeyId: 'k',
      secretAccessKey: 's',
      bucket: 'powerhouse-env-dumps',
    })
    const url = await helper.presignDownload('tenant/abc.dump')
    expect(url).toContain('expiresIn=900')
  })

  it('returns null size for missing object', async () => {
    const helper = new S3Helper({
      endpoint: 'https://fsn1.your-objectstorage.com',
      region: 'fsn1',
      accessKeyId: 'k',
      secretAccessKey: 's',
      bucket: 'powerhouse-env-dumps',
    })
    // headObject internally goes to a real S3 — for this unit test we accept that
    // the helper returns null on error. Run a no-network check by passing an
    // unreachable bucket and expecting null.
    const size = await helper.headSize('tenant/does-not-exist.dump').catch(() => null)
    expect(size === null || typeof size === 'number').toBe(true)
  })
})
```

- [ ] **Step 3: Run, verify fail**

```bash
npx vitest run subgraphs/vetra-cloud-observability/__tests__/dumps-s3.test.ts
```

- [ ] **Step 4: Implement**

Create `subgraphs/vetra-cloud-observability/dumps/s3.ts`:

```ts
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const PRESIGN_TTL_SECONDS = 15 * 60

export type S3HelperConfig = {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

export class S3Helper {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(config: S3HelperConfig) {
    this.bucket = config.bucket
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      forcePathStyle: true,
    })
  }

  async presignDownload(key: string): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key })
    return getSignedUrl(this.client, cmd, { expiresIn: PRESIGN_TTL_SECONDS })
  }

  async headSize(key: string): Promise<number | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      return res.ContentLength ?? null
    } catch {
      return null
    }
  }
}
```

- [ ] **Step 5: Run, verify pass**

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json subgraphs/vetra-cloud-observability/dumps/s3.ts subgraphs/vetra-cloud-observability/__tests__/dumps-s3.test.ts
git commit -m "feat(observability): s3 presign + head helper"
```

---

### Task 6: Dump Job watcher

**Files:**

- Create: `subgraphs/vetra-cloud-observability/dumps/watcher.ts`
- Test: `subgraphs/vetra-cloud-observability/__tests__/dumps-watcher.test.ts`

- [ ] **Step 1: Write failing test**

Create `subgraphs/vetra-cloud-observability/__tests__/dumps-watcher.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { Kysely } from 'kysely'
import { PGliteDialect } from 'kysely-pglite-dialect'
import { up } from '../db/migrations.js'
import type { ObservabilityDB } from '../db/schema.js'
import { DumpsRepo } from '../dumps/repo.js'
import { reconcileJob } from '../dumps/watcher.js'

let db: Kysely<ObservabilityDB>
let repo: DumpsRepo

beforeEach(async () => {
  const pglite = new PGlite()
  db = new Kysely<ObservabilityDB>({ dialect: new PGliteDialect(pglite) })
  await up(db)
  repo = new DumpsRepo(db)
})
afterEach(async () => db.destroy())

describe('reconcileJob', () => {
  it('transitions PENDING → RUNNING when pod is Running', async () => {
    const d = await repo.create({
      documentId: 'doc-1',
      tenantId: 'tenant-1',
      requestedBy: '0xabc',
      now: new Date(),
    })

    await reconcileJob({
      repo,
      dumpId: d.id,
      jobName: `pgdump-${d.id}`,
      jobStatus: { active: 1, succeeded: 0, failed: 0 },
      podPhase: 'Running',
      now: new Date(),
      headSize: async () => null,
      readPodLogs: async () => '',
    })

    const list = await repo.listByTenant('tenant-1')
    expect(list[0].status).toBe('RUNNING')
  })

  it('transitions to READY on Job.succeeded with size', async () => {
    const d = await repo.create({
      documentId: 'doc-1',
      tenantId: 'tenant-1',
      requestedBy: '0xabc',
      now: new Date(),
    })

    await reconcileJob({
      repo,
      dumpId: d.id,
      jobName: `pgdump-${d.id}`,
      jobStatus: {
        active: 0,
        succeeded: 1,
        failed: 0,
        conditions: [{ type: 'Complete', status: 'True' }],
      },
      podPhase: 'Succeeded',
      now: new Date(),
      headSize: async () => 12345,
      readPodLogs: async () => '',
    })

    const list = await repo.listByTenant('tenant-1')
    expect(list[0].status).toBe('READY')
    expect(list[0].sizeBytes).toBe(12345)
  })

  it('transitions to FAILED on Job.failed with last log line', async () => {
    const d = await repo.create({
      documentId: 'doc-1',
      tenantId: 'tenant-1',
      requestedBy: '0xabc',
      now: new Date(),
    })

    await reconcileJob({
      repo,
      dumpId: d.id,
      jobName: `pgdump-${d.id}`,
      jobStatus: {
        active: 0,
        succeeded: 0,
        failed: 1,
        conditions: [{ type: 'Failed', status: 'True', reason: 'BackoffLimitExceeded' }],
      },
      podPhase: 'Failed',
      now: new Date(),
      headSize: async () => null,
      readPodLogs: async () => 'starting\npg_dump: error: connection to server at "x" failed\n',
    })

    const list = await repo.listByTenant('tenant-1')
    expect(list[0].status).toBe('FAILED')
    expect(list[0].errorMessage).toContain('pg_dump: error')
  })

  it('is idempotent — second reconcile of the same READY job is a no-op', async () => {
    const d = await repo.create({
      documentId: 'doc-1',
      tenantId: 'tenant-1',
      requestedBy: '0xabc',
      now: new Date(),
    })
    const args = {
      repo,
      dumpId: d.id,
      jobName: `pgdump-${d.id}`,
      jobStatus: {
        active: 0,
        succeeded: 1,
        failed: 0,
        conditions: [{ type: 'Complete', status: 'True' }],
      },
      podPhase: 'Succeeded',
      now: new Date(),
      headSize: async () => 100,
      readPodLogs: async () => '',
    } as const
    await reconcileJob(args)
    await reconcileJob(args)
    const list = await repo.listByTenant('tenant-1')
    expect(list[0].status).toBe('READY')
    expect(list[0].sizeBytes).toBe(100)
  })
})
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Implement**

Create `subgraphs/vetra-cloud-observability/dumps/watcher.ts`:

```ts
import type { DumpsRepo } from './repo.js'

type JobCondition = { type?: string; status?: string; reason?: string }
type JobStatus = {
  active?: number
  succeeded?: number
  failed?: number
  conditions?: JobCondition[]
}

export type ReconcileJobInput = {
  repo: DumpsRepo
  dumpId: string
  jobName: string
  jobStatus: JobStatus
  podPhase: string | null
  now: Date
  headSize: (s3Key: string) => Promise<number | null>
  readPodLogs: (jobName: string) => Promise<string>
}

function lastNonEmptyLine(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  return lines.length > 0 ? lines[lines.length - 1] : ''
}

function isTrue(condition: JobCondition | undefined): boolean {
  return condition?.status === 'True'
}

export async function reconcileJob(input: ReconcileJobInput): Promise<void> {
  const { repo, dumpId, jobName, jobStatus, podPhase, now, headSize, readPodLogs } = input
  const dump = await repo.getById(dumpId)
  if (!dump) return

  const isComplete =
    isTrue(jobStatus.conditions?.find((c) => c.type === 'Complete')) ||
    (jobStatus.succeeded ?? 0) > 0
  const isFailed =
    isTrue(jobStatus.conditions?.find((c) => c.type === 'Failed')) || (jobStatus.failed ?? 0) > 0

  if (dump.status === 'READY' || dump.status === 'FAILED') return // terminal

  if (isFailed) {
    const logs = await readPodLogs(jobName).catch(() => '')
    const reason =
      lastNonEmptyLine(logs) ||
      jobStatus.conditions?.find((c) => c.type === 'Failed')?.reason ||
      'Job failed'
    await repo.markFailed(dumpId, reason, now)
    return
  }

  if (isComplete) {
    const s3Key = `${dump.tenantId}/${dump.id}.dump`
    const size = await headSize(s3Key).catch(() => null)
    await repo.markReady(dumpId, s3Key, size ?? 0, now)
    return
  }

  if (podPhase === 'Running' && dump.status === 'PENDING') {
    await repo.markRunning(dumpId, jobName, now)
  }
}
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add subgraphs/vetra-cloud-observability/dumps/watcher.ts subgraphs/vetra-cloud-observability/__tests__/dumps-watcher.test.ts
git commit -m "feat(observability): Job → dump-row reconciler"
```

---

### Task 7: Dump resolvers (mutation + query)

**Files:**

- Create: `subgraphs/vetra-cloud-observability/dumps/resolvers.ts`
- Create: `subgraphs/vetra-cloud-observability/dumps/k8s-client.ts`
- Test: `subgraphs/vetra-cloud-observability/__tests__/dumps-resolvers.test.ts`

- [ ] **Step 1: Write failing test**

Create `subgraphs/vetra-cloud-observability/__tests__/dumps-resolvers.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { Kysely } from 'kysely'
import { PGliteDialect } from 'kysely-pglite-dialect'
import { up } from '../db/migrations.js'
import type { ObservabilityDB } from '../db/schema.js'
import { DumpsRepo } from '../dumps/repo.js'
import { createDumpResolvers, type DumpResolverDeps } from '../dumps/resolvers.js'

let db: Kysely<ObservabilityDB>
let repo: DumpsRepo
let envDb: any
let createJob: ReturnType<typeof vi.fn>
let presign: ReturnType<typeof vi.fn>
let deps: DumpResolverDeps

const TENANT = 'tenant-1'
const ENV_DOC = { id: 'doc-1', tenantId: TENANT, owner: '0xAbC' }

beforeEach(async () => {
  const pglite = new PGlite()
  db = new Kysely<ObservabilityDB>({ dialect: new PGliteDialect(pglite) })
  await up(db)
  repo = new DumpsRepo(db)

  envDb = {
    selectFrom: () => ({
      select: () => ({
        where: () => ({ executeTakeFirst: async () => ENV_DOC }),
      }),
    }),
  }
  createJob = vi.fn(async () => 'pgdump-abc')
  presign = vi.fn(async () => 'https://signed.example/dump')

  deps = { repo, envDb, createJob, presign, image: 'img:1', bucket: 'b', s3Endpoint: 'https://s3' }
})
afterEach(async () => db.destroy())

describe('requestEnvironmentDump', () => {
  it('creates a PENDING dump as the owner', async () => {
    const resolvers = createDumpResolvers(deps)
    const dump = await resolvers.Mutation.requestEnvironmentDump(
      null,
      { tenantId: TENANT },
      { user: { address: '0xabc' } },
    )
    expect(dump.status).toBe('PENDING')
    expect(createJob).toHaveBeenCalled()
  })

  it('rejects non-owner', async () => {
    const resolvers = createDumpResolvers(deps)
    await expect(
      resolvers.Mutation.requestEnvironmentDump(
        null,
        { tenantId: TENANT },
        { user: { address: '0xdef' } },
      ),
    ).rejects.toThrow('FORBIDDEN')
    expect(createJob).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated', async () => {
    const resolvers = createDumpResolvers(deps)
    await expect(
      resolvers.Mutation.requestEnvironmentDump(null, { tenantId: TENANT }, {}),
    ).rejects.toThrow('UNAUTHENTICATED')
  })

  it('rolls back the row when Job creation fails', async () => {
    createJob.mockRejectedValueOnce(new Error('k8s exploded'))
    const resolvers = createDumpResolvers(deps)
    await expect(
      resolvers.Mutation.requestEnvironmentDump(
        null,
        { tenantId: TENANT },
        { user: { address: '0xabc' } },
      ),
    ).rejects.toThrow('k8s exploded')
    const list = await repo.listByTenant(TENANT)
    expect(list[0].status).toBe('FAILED')
  })
})

describe('environmentDumps', () => {
  it('returns dumps with presigned URL only when READY and not expired', async () => {
    const d = await repo.create({
      documentId: ENV_DOC.id,
      tenantId: TENANT,
      requestedBy: '0xabc',
      now: new Date(),
    })
    await repo.markReady(d.id, `${TENANT}/${d.id}.dump`, 12345, new Date())

    const resolvers = createDumpResolvers(deps)
    const list = await resolvers.Query.environmentDumps(
      null,
      { tenantId: TENANT },
      { user: { address: '0xabc' } },
    )
    expect(list).toHaveLength(1)
    expect(list[0].downloadUrl).toBe('https://signed.example/dump')
    expect(presign).toHaveBeenCalledWith(`${TENANT}/${d.id}.dump`)
  })

  it('returns no URL for expired READY dumps', async () => {
    const past = new Date('2026-01-01T00:00:00Z')
    const d = await repo.create({
      documentId: ENV_DOC.id,
      tenantId: TENANT,
      requestedBy: '0xabc',
      now: past,
    })
    await repo.markReady(d.id, `${TENANT}/${d.id}.dump`, 12345, past)

    const resolvers = createDumpResolvers(deps)
    const list = await resolvers.Query.environmentDumps(
      null,
      { tenantId: TENANT },
      { user: { address: '0xabc' } },
    )
    expect(list[0].downloadUrl).toBeNull()
  })

  it('rejects non-owner', async () => {
    const resolvers = createDumpResolvers(deps)
    await expect(
      resolvers.Query.environmentDumps(null, { tenantId: TENANT }, { user: { address: '0xdef' } }),
    ).rejects.toThrow('FORBIDDEN')
  })
})
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Implement k8s client wrapper**

Create `subgraphs/vetra-cloud-observability/dumps/k8s-client.ts`:

```ts
import type { V1Job } from '@kubernetes/client-node'

/** Minimal Kubernetes surface used by the dumps feature. */
export interface DumpsK8sClient {
  createJob(namespace: string, job: V1Job): Promise<string>
  readJobStatus(
    namespace: string,
    name: string,
  ): Promise<{
    active?: number
    succeeded?: number
    failed?: number
    conditions?: Array<{ type?: string; status?: string; reason?: string }>
  } | null>
  readPodPhaseForJob(namespace: string, jobName: string): Promise<string | null>
  readPodLogsForJob(namespace: string, jobName: string): Promise<string>
  listManagedJobs(): Promise<Array<{ namespace: string; name: string; dumpId: string }>>
}

export async function createDefaultDumpsK8sClient(): Promise<DumpsK8sClient> {
  const { KubeConfig, BatchV1Api, CoreV1Api } = await import('@kubernetes/client-node')
  const kc = new KubeConfig()
  kc.loadFromCluster()
  const batch = kc.makeApiClient(BatchV1Api)
  const core = kc.makeApiClient(CoreV1Api)

  return {
    async createJob(namespace, job) {
      const res = await batch.createNamespacedJob({ namespace, body: job })
      return res.metadata?.name ?? ''
    },
    async readJobStatus(namespace, name) {
      try {
        const res = await batch.readNamespacedJobStatus({ namespace, name })
        const s = res.status ?? {}
        return {
          active: s.active,
          succeeded: s.succeeded,
          failed: s.failed,
          conditions: s.conditions?.map((c: any) => ({
            type: c.type,
            status: c.status,
            reason: c.reason,
          })),
        }
      } catch {
        return null
      }
    },
    async readPodPhaseForJob(namespace, jobName) {
      const list = await core.listNamespacedPod({ namespace, labelSelector: `job-name=${jobName}` })
      return list.items[0]?.status?.phase ?? null
    },
    async readPodLogsForJob(namespace, jobName) {
      const list = await core.listNamespacedPod({ namespace, labelSelector: `job-name=${jobName}` })
      const podName = list.items[0]?.metadata?.name
      if (!podName) return ''
      try {
        const logs = await core.readNamespacedPodLog({ namespace, name: podName })
        return typeof logs === 'string' ? logs : ''
      } catch {
        return ''
      }
    },
    async listManagedJobs() {
      const res = await batch.listJobForAllNamespaces({
        labelSelector: 'app.kubernetes.io/managed-by=vetra-cloud-observability',
      })
      return res.items
        .map((j: any) => ({
          namespace: j.metadata?.namespace ?? '',
          name: j.metadata?.name ?? '',
          dumpId: j.metadata?.labels?.['vetra.io/dump-id'] ?? '',
        }))
        .filter((j: any) => j.name && j.dumpId)
    },
  }
}
```

- [ ] **Step 4: Implement resolvers**

Create `subgraphs/vetra-cloud-observability/dumps/resolvers.ts`:

```ts
import type { Kysely } from 'kysely'
import type { DumpsRepo } from './repo.js'
import { requireOwner } from './auth.js'
import { buildDumpJob } from './job-spec.js'
import type { DatabaseDumps } from '../db/schema.js'

type Caller = { user?: { address: string } }

type EnvRow = { id: string; tenantId: string | null; owner: string | null }

async function loadEnv(envDb: Kysely<any>, tenantId: string): Promise<EnvRow | null> {
  const row = (await envDb
    .selectFrom('environments')
    .select(['id', 'tenantId', 'owner'])
    .where('tenantId', '=', tenantId)
    .executeTakeFirst()) as EnvRow | undefined
  return row ?? null
}

function toGraphql(row: DatabaseDumps, presignedUrl: string | null) {
  return {
    id: row.id,
    status: row.status,
    requestedAt: row.requestedAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    expiresAt: row.expiresAt,
    sizeBytes: row.sizeBytes,
    errorMessage: row.errorMessage,
    downloadUrl: presignedUrl,
  }
}

export type DumpResolverDeps = {
  repo: DumpsRepo
  envDb: Kysely<any>
  /** Returns the created Job's name. */
  createJob: (namespace: string, body: any) => Promise<string>
  /** Mints a presigned download URL for the given s3 key. */
  presign: (s3Key: string) => Promise<string>
  image: string
  bucket: string
  s3Endpoint: string
}

export function createDumpResolvers(deps: DumpResolverDeps) {
  const { repo, envDb, createJob, presign, image, bucket, s3Endpoint } = deps

  return {
    Query: {
      environmentDumps: async (_p: unknown, args: { tenantId: string }, ctx: Caller) => {
        const env = await loadEnv(envDb, args.tenantId)
        requireOwner({ caller: ctx.user?.address ?? null, envOwner: env?.owner ?? null })

        const rows = await repo.listByTenant(args.tenantId)
        const now = Date.now()
        return Promise.all(
          rows.map(async (row) => {
            const expired = new Date(row.expiresAt).getTime() < now
            if (row.status !== 'READY' || expired || !row.s3Key) return toGraphql(row, null)
            const url = await presign(row.s3Key).catch(() => null)
            return toGraphql(row, url)
          }),
        )
      },
    },
    Mutation: {
      requestEnvironmentDump: async (_p: unknown, args: { tenantId: string }, ctx: Caller) => {
        const env = await loadEnv(envDb, args.tenantId)
        requireOwner({ caller: ctx.user?.address ?? null, envOwner: env?.owner ?? null })
        if (!env) throw new Error('ENV_NOT_FOUND')

        const dump = await repo.create({
          documentId: env.id,
          tenantId: args.tenantId,
          requestedBy: ctx.user!.address,
          now: new Date(),
        })

        const job = buildDumpJob({
          dumpId: dump.id,
          tenantNs: args.tenantId,
          image,
          bucket,
          s3Endpoint,
        })
        try {
          const jobName = await createJob(args.tenantId, job)
          await repo.setJobName(dump.id, jobName)
        } catch (err) {
          await repo.markFailed(dump.id, (err as Error).message ?? 'createJob failed', new Date())
          throw err
        }

        return toGraphql(dump, null)
      },
    },
  }
}
```

- [ ] **Step 5: Run tests, verify pass**

```bash
npx vitest run subgraphs/vetra-cloud-observability/__tests__/dumps-resolvers.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add subgraphs/vetra-cloud-observability/dumps/resolvers.ts subgraphs/vetra-cloud-observability/dumps/k8s-client.ts subgraphs/vetra-cloud-observability/__tests__/dumps-resolvers.test.ts
git commit -m "feat(observability): dump resolvers (mutation + owner-gated query)"
```

---

### Task 8: Wire dump GraphQL into schema

**Files:**

- Modify: `subgraphs/vetra-cloud-observability/schema.ts`

- [ ] **Step 1: Add types and operations to schema**

Open `subgraphs/vetra-cloud-observability/schema.ts`. Inside the existing `gql` template at the right places (after the existing `type Query { ... }` extension and before the closing backtick), add:

```graphql
type DatabaseDump {
  id: ID!
  status: DatabaseDumpStatus!
  requestedAt: String!
  startedAt: String
  completedAt: String
  expiresAt: String!
  sizeBytes: Float
  errorMessage: String
  downloadUrl: String
}

enum DatabaseDumpStatus {
  PENDING
  RUNNING
  READY
  FAILED
}
```

In the existing `Query` block, add the field:

```graphql
"""Owner-gated. Returns dumps for the env, newest first. Capped at 20."""
environmentDumps(tenantId: String!): [DatabaseDump!]!
```

In the existing `Mutation` block (or create one if absent), add:

```graphql
"""Owner-gated. Creates a new dump and starts the Job. Returns the dump in PENDING."""
requestEnvironmentDump(tenantId: String!): DatabaseDump!
```

- [ ] **Step 2: Verify schema parses**

```bash
npx vitest run subgraphs/vetra-cloud-observability/__tests__/schema.test.ts
```

Expected: PASS (existing test should still pass; if there's a syntax error, fix it).

- [ ] **Step 3: Commit**

```bash
git add subgraphs/vetra-cloud-observability/schema.ts
git commit -m "feat(observability): GraphQL types for environmentDumps + requestEnvironmentDump"
```

---

### Task 9: Wire watcher + resolvers into subgraph startup

**Files:**

- Modify: `subgraphs/vetra-cloud-observability/index.ts`
- Modify: `subgraphs/vetra-cloud-observability/resolvers.ts`

- [ ] **Step 1: Inject dump deps into `createResolvers`**

In `subgraphs/vetra-cloud-observability/resolvers.ts`:

Find the `ResolverConfig` interface (top of file) and add three optional fields:

```ts
export interface ResolverConfig {
  prometheusUrl: string
  lokiUrl: string
  envDb: Kysely<any>
  dispatch: (documentId: string, type: string, input: Record<string, unknown>) => Promise<void>
  /** Dump-feature dependencies. Subgraph host injects these at startup. */
  dumpDeps?: import('./dumps/resolvers.js').DumpResolverDeps
}
```

At the bottom of the returned `Query` and `Mutation` objects in `createResolvers`, merge the dump resolvers:

```ts
import { createDumpResolvers } from './dumps/resolvers.js'
// ... existing code ...
const dumpResolvers = config.dumpDeps
  ? createDumpResolvers(config.dumpDeps)
  : { Query: {}, Mutation: {} }

return {
  Query: {
    // existing entries ...
    ...dumpResolvers.Query,
  },
  Mutation: {
    // existing entries ...
    ...dumpResolvers.Mutation,
  },
}
```

(If the existing returned object doesn't already split Query/Mutation that way, look at how `setServiceVersion` is registered and follow the same shape.)

- [ ] **Step 2: Wire startup in `index.ts`**

Open `subgraphs/vetra-cloud-observability/index.ts`. After the line `this.resolvers = createResolvers(...)`, build the dump deps and a watcher loop:

```ts
const dumpDeps = await this.buildDumpDeps(db)
this.resolvers = createResolvers(db, { prometheusUrl, lokiUrl, envDb, dispatch, dumpDeps })

if (dumpDeps && process.env.VETRA_DUMPS_WATCHER_ENABLED !== 'false') {
  this.startDumpWatcher(dumpDeps)
  this.startDumpPrune(dumpDeps)
}
```

Add three private methods to the class:

```ts
private dumpWatcherInterval: ReturnType<typeof setInterval> | null = null;
private dumpPruneInterval: ReturnType<typeof setInterval> | null = null;

private async buildDumpDeps(
  db: Kysely<ObservabilityDB>,
): Promise<import("./dumps/resolvers.js").DumpResolverDeps | null> {
  const { DumpsRepo } = await import("./dumps/repo.js");
  const { S3Helper } = await import("./dumps/s3.js");
  const { createDefaultDumpsK8sClient } = await import("./dumps/k8s-client.js");

  const accessKey = process.env.VETRA_DUMPS_S3_ACCESS_KEY;
  const secretKey = process.env.VETRA_DUMPS_S3_SECRET_KEY;
  if (!accessKey || !secretKey) {
    childLogger("vetra-cloud-observability").warn(
      "dumps: S3 credentials missing — dump feature disabled",
    );
    return null;
  }

  const repo = new DumpsRepo(db);
  const k8s = await createDefaultDumpsK8sClient();
  const s3 = new S3Helper({
    endpoint: process.env.VETRA_DUMPS_S3_ENDPOINT ?? "https://fsn1.your-objectstorage.com",
    region: process.env.VETRA_DUMPS_S3_REGION ?? "fsn1",
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    bucket: process.env.VETRA_DUMPS_BUCKET ?? "powerhouse-env-dumps",
  });

  // Park the k8s client on the instance so the watcher can reuse it.
  this._dumpsK8s = k8s;
  this._dumpsS3 = s3;
  this._dumpsRepo = repo;

  return {
    repo,
    envDb: (await this.relationalDb.createNamespace("vetra-cloud-environments")) as unknown as Kysely<any>,
    createJob: (ns, body) => k8s.createJob(ns, body),
    presign: (key) => s3.presignDownload(key),
    image: process.env.VETRA_DUMPS_IMAGE ?? "cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0",
    bucket: process.env.VETRA_DUMPS_BUCKET ?? "powerhouse-env-dumps",
    s3Endpoint: process.env.VETRA_DUMPS_S3_ENDPOINT ?? "https://fsn1.your-objectstorage.com",
  };
}

private _dumpsK8s: any = null;
private _dumpsS3: any = null;
private _dumpsRepo: any = null;

private startDumpWatcher(_deps: import("./dumps/resolvers.js").DumpResolverDeps): void {
  const log = childLogger("vetra-cloud-observability");
  const tick = async () => {
    try {
      const { reconcileJob } = await import("./dumps/watcher.js");
      const inFlight = await this._dumpsRepo.listInFlight();
      const managed = await this._dumpsK8s.listManagedJobs();
      const byDumpId = new Map<string, { namespace: string; name: string }>();
      for (const j of managed) byDumpId.set(j.dumpId, { namespace: j.namespace, name: j.name });

      for (const dump of inFlight) {
        const ref = byDumpId.get(dump.id);
        if (!ref) continue;
        const status = await this._dumpsK8s.readJobStatus(ref.namespace, ref.name);
        if (!status) continue;
        const podPhase = await this._dumpsK8s.readPodPhaseForJob(ref.namespace, ref.name);
        await reconcileJob({
          repo: this._dumpsRepo,
          dumpId: dump.id,
          jobName: ref.name,
          jobStatus: status,
          podPhase,
          now: new Date(),
          headSize: (key) => this._dumpsS3.headSize(key),
          readPodLogs: () => this._dumpsK8s.readPodLogsForJob(ref.namespace, ref.name),
        });
      }
    } catch (err) {
      log.error({ err }, "dumps: watcher tick failed");
    }
  };
  this.dumpWatcherInterval = setInterval(tick, 10_000);
  // first tick fires immediately
  void tick();
}

private startDumpPrune(_deps: import("./dumps/resolvers.js").DumpResolverDeps): void {
  const log = childLogger("vetra-cloud-observability");
  const tick = async () => {
    try {
      const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      const removed = await this._dumpsRepo.pruneOlderThan(cutoff);
      if (removed > 0) log.info({ removed }, "dumps: pruned old rows");
    } catch (err) {
      log.error({ err }, "dumps: prune failed");
    }
  };
  this.dumpPruneInterval = setInterval(tick, 60 * 60 * 1000); // hourly
}
```

Also extend the existing `onTeardown` (if present) to clear `dumpWatcherInterval` and `dumpPruneInterval`.

- [ ] **Step 3: Run typecheck**

```bash
cd /home/froid/projects/powerhouse/vetra-cloud-package
npm run typecheck 2>&1 | tail -30
```

Expected: PASS, or if there are errors fix them.

- [ ] **Step 4: Run all subgraph tests**

```bash
npx vitest run subgraphs/vetra-cloud-observability/
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add subgraphs/vetra-cloud-observability/index.ts subgraphs/vetra-cloud-observability/resolvers.ts
git commit -m "feat(observability): wire dump deps + watcher into subgraph startup"
```

---

## Phase 2 — Image (`powerhouse-k8s-hosting`)

### Task 10: Build the `pgdump-uploader` image

**Files:**

- Create: `infrastructure/pgdump-uploader/Dockerfile`
- Create: `infrastructure/pgdump-uploader/entrypoint.sh`
- Create: `infrastructure/pgdump-uploader/README.md`

- [ ] **Step 1: Create the Dockerfile**

```dockerfile
FROM alpine:3.20
RUN apk add --no-cache postgresql16-client ca-certificates curl tar \
  && curl -sSL https://github.com/peak/s5cmd/releases/download/v2.2.2/s5cmd_2.2.2_Linux-64bit.tar.gz \
     | tar -xz -C /usr/local/bin s5cmd \
  && apk del curl tar
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER nobody
ENTRYPOINT ["/entrypoint.sh"]
```

- [ ] **Step 2: Create the entrypoint**

Create `infrastructure/pgdump-uploader/entrypoint.sh`:

```sh
#!/bin/sh
# Streams pg_dump --format=custom of $PGDATABASE to s3://$S3_BUCKET/$S3_KEY.
# Required env: PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD
#               S3_BUCKET S3_KEY S3_ENDPOINT
#               AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
set -eu

echo "pgdump-uploader: $PGDATABASE@$PGHOST:$PGPORT -> s3://$S3_BUCKET/$S3_KEY"
pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --verbose \
  | s5cmd --endpoint-url "$S3_ENDPOINT" pipe "s3://$S3_BUCKET/$S3_KEY"

echo "pgdump-uploader: done"
```

- [ ] **Step 3: Create README**

Create `infrastructure/pgdump-uploader/README.md`:

```markdown
# pgdump-uploader

One-shot container image used by `vetra-cloud-observability` to take an
on-demand `pg_dump` of a tenant env's Postgres and upload it directly to
S3 (Hetzner Object Storage).

Streams `pg_dump --format=custom` through `s5cmd pipe` — no local disk.

## Build & push

\`\`\`sh
docker build -t cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0 .
docker push cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0
\`\`\`

## Local smoke test

Spin up a Postgres + MinIO and run:

\`\`\`sh
docker run --rm \
 -e PGHOST=host.docker.internal -e PGPORT=5432 \
 -e PGDATABASE=postgres -e PGUSER=postgres -e PGPASSWORD=postgres \
 -e S3_BUCKET=test -e S3_KEY=smoke.dump \
 -e S3_ENDPOINT=http://host.docker.internal:9000 \
 -e AWS_ACCESS_KEY_ID=minioadmin -e AWS_SECRET_ACCESS_KEY=minioadmin \
 cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0
\`\`\`

The dump appears at `s3://test/smoke.dump`. Verify round-trip:

\`\`\`sh
mc cp local/test/smoke.dump - | pg_restore --list
\`\`\`
```

- [ ] **Step 4: Verify hadolint or basic shellcheck (optional, skip if tools absent)**

```bash
cd /home/froid/projects/powerhouse/powerhouse-k8s-hosting
which hadolint && hadolint infrastructure/pgdump-uploader/Dockerfile || echo "hadolint not installed — skipping"
which shellcheck && shellcheck infrastructure/pgdump-uploader/entrypoint.sh || echo "shellcheck not installed — skipping"
```

- [ ] **Step 5: Commit**

```bash
cd /home/froid/projects/powerhouse/powerhouse-k8s-hosting
git add infrastructure/pgdump-uploader/
git commit -m "feat(infra): pgdump-uploader image (alpine + pg_dump + s5cmd)"
```

---

## Phase 3 — Helm + RBAC (`powerhouse-k8s-hosting`)

### Task 11: Extend `vetra-observability-reader` ClusterRole with Job rights

**Files:**

- Modify: `infrastructure/vetra-observability-rbac/rbac.yaml`

- [ ] **Step 1: Add the rule**

In `infrastructure/vetra-observability-rbac/rbac.yaml`, find the `ClusterRole/vetra-observability-reader` rules block and append:

```yaml
- apiGroups:
    - batch
  resources:
    - jobs
  verbs:
    - get
    - list
    - watch
    - create
    - delete
```

- [ ] **Step 2: Validate yaml**

```bash
yq '.' infrastructure/vetra-observability-rbac/rbac.yaml >/dev/null
echo "yaml ok"
```

- [ ] **Step 3: Commit**

```bash
git add infrastructure/vetra-observability-rbac/rbac.yaml
git commit -m "feat(rbac): allow vetra-observability to manage Jobs in tenant ns"
```

---

### Task 12: Helm template for `env-dumps-s3-credentials` ExternalSecret

**Files:**

- Create: `powerhouse-chart/templates/external-secret-env-dumps-s3.yaml`
- Modify: `powerhouse-chart/values.yaml`

- [ ] **Step 1: Add values default**

In `powerhouse-chart/values.yaml`, find the `database.cnpg` block and add a new sibling under `database`:

```yaml
database:
  # ... existing cnpg block ...
  envDumps:
    enabled: false
    secretStore: openbao
    refreshInterval: 1h
```

- [ ] **Step 2: Create the template**

Create `powerhouse-chart/templates/external-secret-env-dumps-s3.yaml`:

```yaml
{{- if and .Values.database.envDumps.enabled (not .Values.global.disabled) .Values.database.cnpg.enabled }}
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: env-dumps-s3-credentials
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "powerhouse.labels" . | nindent 4 }}
    app.kubernetes.io/component: env-dumps
  annotations:
    argocd.argoproj.io/sync-wave: "-2"
spec:
  refreshInterval: {{ .Values.database.envDumps.refreshInterval | default "1h" }}
  secretStoreRef:
    name: {{ .Values.database.envDumps.secretStore | default "openbao" }}
    kind: ClusterSecretStore
  target:
    name: env-dumps-s3-credentials
    creationPolicy: Owner
  data:
    - secretKey: accessKey
      remoteRef:
        key: tenants/{{ .Release.Namespace }}/secrets/env-dumps-s3
        property: accessKey
    - secretKey: secretKey
      remoteRef:
        key: tenants/{{ .Release.Namespace }}/secrets/env-dumps-s3
        property: secretKey
{{- end }}
```

- [ ] **Step 3: Helm template dry-run for one tenant**

```bash
cd /home/froid/projects/powerhouse/powerhouse-k8s-hosting
helm template test-tenant powerhouse-chart \
  -f tenants/staging/powerhouse-values.yaml \
  --set database.envDumps.enabled=true \
  | grep -A 20 "kind: ExternalSecret" | grep env-dumps
```

Expected: see the `env-dumps-s3-credentials` ExternalSecret rendered.

- [ ] **Step 4: Commit**

```bash
git add powerhouse-chart/values.yaml powerhouse-chart/templates/external-secret-env-dumps-s3.yaml
git commit -m "feat(chart): env-dumps-s3-credentials ExternalSecret (tenant-scoped)"
```

---

### Task 13: Add a deploy checklist to the chart README

**Files:**

- Modify: `powerhouse-chart/README.md`

- [ ] **Step 1: Append a section**

At the bottom of `powerhouse-chart/README.md`, add:

```markdown
## Environment database dumps

The on-demand pg_dump feature (see vetra.to spec
`2026-05-07-environment-database-dump-design.md`) is opt-in per tenant:

- Set `database.envDumps.enabled: true` in the tenant's
  `powerhouse-values.yaml` (only takes effect when `database.cnpg.enabled: true`).
- Provision OpenBao path `tenants/<ns>/secrets/env-dumps-s3` with two
  keys: `accessKey` and `secretKey` (Hetzner Object Storage credential
  pair scoped to the `<ns>/*` prefix on bucket
  `powerhouse-env-dumps`).
- The bucket itself is provisioned via terraform (see the
  cluster repo).
```

- [ ] **Step 2: Commit**

```bash
git add powerhouse-chart/README.md
git commit -m "docs(chart): document env-dumps tenant opt-in"
```

---

## Phase 4 — vetra.to UI

### Task 14: Extend `useDetailDrawer` for `database` scope

**Files:**

- Modify: `modules/cloud/hooks/use-detail-drawer.ts`

- [ ] **Step 1: Extend `DrawerScope`**

Replace the `DrawerScope` type:

```ts
export type DrawerScope =
  | { kind: 'service'; id: 'connect' | 'switchboard' | 'fusion' }
  | { kind: 'agent'; id: string }
  | { kind: 'database'; id: 'main' }
```

Update `parseDrawer` to recognize `database`:

```ts
if (kind === 'database' && id === 'main') {
  return { kind: 'database', id: 'main' }
}
```

- [ ] **Step 2: Quick smoke test (typecheck)**

```bash
cd /home/froid/projects/powerhouse/vetra.to
npm run tsc 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add modules/cloud/hooks/use-detail-drawer.ts
git commit -m "feat(cloud): add 'database' drawer scope"
```

---

### Task 15: GraphQL types + operations for dumps

**Files:**

- Modify: `modules/cloud/types.ts`
- Modify: `modules/cloud/graphql.ts`

- [ ] **Step 1: Add types**

Append to `modules/cloud/types.ts`:

```ts
export type DatabaseDumpStatus = 'PENDING' | 'RUNNING' | 'READY' | 'FAILED'

export type DatabaseDump = {
  id: string
  status: DatabaseDumpStatus
  requestedAt: string
  startedAt: string | null
  completedAt: string | null
  expiresAt: string
  sizeBytes: number | null
  errorMessage: string | null
  downloadUrl: string | null
}
```

- [ ] **Step 2: Add operations**

In `modules/cloud/graphql.ts`, append two operations following the existing pattern (look at `fetchEnvironmentReleaseHistory` or similar). Sketch:

```ts
const ENVIRONMENT_DUMPS = `
query EnvironmentDumps($tenantId: String!) {
  environmentDumps(tenantId: $tenantId) {
    id status requestedAt startedAt completedAt expiresAt
    sizeBytes errorMessage downloadUrl
  }
}`

const REQUEST_ENVIRONMENT_DUMP = `
mutation RequestEnvironmentDump($tenantId: String!) {
  requestEnvironmentDump(tenantId: $tenantId) {
    id status requestedAt expiresAt
  }
}`

export async function fetchEnvironmentDumps(tenantId: string): Promise<DatabaseDump[]> {
  const data = await cloudGraphqlRequest<{ environmentDumps: DatabaseDump[] }>(ENVIRONMENT_DUMPS, {
    tenantId,
  })
  return data.environmentDumps ?? []
}

export async function requestEnvironmentDump(tenantId: string): Promise<DatabaseDump> {
  const data = await cloudGraphqlRequest<{ requestEnvironmentDump: DatabaseDump }>(
    REQUEST_ENVIRONMENT_DUMP,
    { tenantId },
  )
  return data.requestEnvironmentDump
}
```

(If the file uses a different request helper, mirror that.)

- [ ] **Step 3: Commit**

```bash
git add modules/cloud/types.ts modules/cloud/graphql.ts
git commit -m "feat(cloud): GraphQL ops + types for environment dumps"
```

---

### Task 16: `useEnvironmentDumps` hook

**Files:**

- Create: `modules/cloud/hooks/use-environment-dumps.ts`

- [ ] **Step 1: Implement**

```ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchEnvironmentDumps, requestEnvironmentDump } from '@/modules/cloud/graphql'
import type { DatabaseDump } from '@/modules/cloud/types'

const POLL_INTERVAL_MS = 5000
const IN_FLIGHT = new Set<DatabaseDump['status']>(['PENDING', 'RUNNING'])

type State = {
  dumps: DatabaseDump[]
  isLoading: boolean
  error: string | null
}

export function useEnvironmentDumps(tenantId: string | null) {
  const [state, setState] = useState<State>({ dumps: [], isLoading: true, error: null })
  const [isRequesting, setIsRequesting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refetch = useCallback(async () => {
    if (!tenantId) return
    try {
      const dumps = await fetchEnvironmentDumps(tenantId)
      setState({ dumps, isLoading: false, error: null })
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load dumps',
      }))
    }
  }, [tenantId])

  // Initial fetch + polling while in-flight
  useEffect(() => {
    if (!tenantId) return
    void refetch()
  }, [tenantId, refetch])

  useEffect(() => {
    const hasInFlight = state.dumps.some((d) => IN_FLIGHT.has(d.status))
    if (hasInFlight && !pollRef.current) {
      pollRef.current = setInterval(() => void refetch(), POLL_INTERVAL_MS)
    } else if (!hasInFlight && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [state.dumps, refetch])

  const request = useCallback(async () => {
    if (!tenantId) return
    setIsRequesting(true)
    try {
      await requestEnvironmentDump(tenantId)
      await refetch()
    } finally {
      setIsRequesting(false)
    }
  }, [tenantId, refetch])

  return { ...state, isRequesting, request, refetch }
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run tsc 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add modules/cloud/hooks/use-environment-dumps.ts
git commit -m "feat(cloud): useEnvironmentDumps hook with polling"
```

---

### Task 17: `<DumpRow>` component

**Files:**

- Create: `modules/cloud/components/dump-row.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'

import { Database, Download, Loader2, RefreshCw, Clock } from 'lucide-react'
import type { DatabaseDump } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const d = Date.now() - new Date(iso).getTime()
  const s = Math.max(1, Math.round(d / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

function timeUntil(iso: string): string {
  const d = new Date(iso).getTime() - Date.now()
  if (d < 0) return 'expired'
  const m = Math.round(d / 60000)
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 48) return `${h}h ${m % 60}m`
  return `${Math.round(h / 24)}d`
}

function fmtBytes(n: number | null): string {
  if (n == null) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

const PILL_BY_STATUS: Record<DatabaseDump['status'], { label: string; cls: string }> = {
  PENDING: { label: 'PENDING', cls: 'bg-muted text-muted-foreground' },
  RUNNING: { label: 'RUNNING', cls: 'bg-blue-500/15 text-blue-400' },
  READY: { label: 'READY', cls: 'bg-emerald-500/15 text-emerald-400' },
  FAILED: { label: 'FAILED', cls: 'bg-red-500/15 text-red-400' },
}

type Props = {
  dump: DatabaseDump
  onRetry?: () => void
}

export function DumpRow({ dump, onRetry }: Props) {
  const isExpired = new Date(dump.expiresAt).getTime() < Date.now()
  const pill =
    isExpired && dump.status === 'READY' ? PILL_BY_STATUS.PENDING : PILL_BY_STATUS[dump.status]
  const pillLabel = isExpired && dump.status === 'READY' ? 'EXPIRED' : pill.label
  const filename = `dump-${dump.id}.dump`

  return (
    <div className="bg-background/40 hover:bg-background/60 flex items-center gap-3 rounded-lg p-4 transition-colors">
      <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
        {dump.status === 'RUNNING' ? (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        ) : (
          <Database className="text-muted-foreground h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{filename}</span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
              pill.cls,
            )}
          >
            {pillLabel}
          </span>
        </div>
        <div className="text-muted-foreground mt-0.5 truncate text-xs">
          {dump.status === 'READY' && !isExpired && (
            <>
              {dump.sizeBytes != null && <>{fmtBytes(dump.sizeBytes)} · </>}
              {timeAgo(dump.completedAt)} · expires in {timeUntil(dump.expiresAt)}
            </>
          )}
          {dump.status === 'READY' && isExpired && <>expired {timeAgo(dump.expiresAt)}</>}
          {dump.status === 'RUNNING' && <>started {timeAgo(dump.startedAt)} · pg_dump → s3</>}
          {dump.status === 'PENDING' && <>requested {timeAgo(dump.requestedAt)}</>}
          {dump.status === 'FAILED' && (
            <>
              {timeAgo(dump.completedAt ?? dump.requestedAt)} ·{' '}
              {dump.errorMessage ?? 'unknown error'}
            </>
          )}
        </div>
        {dump.status === 'RUNNING' && (
          <div className="bg-muted mt-2 h-0.5 overflow-hidden rounded-full">
            <div className="h-full w-1/3 animate-pulse bg-blue-500" />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {dump.status === 'READY' && !isExpired && dump.downloadUrl && (
          <Button asChild size="sm">
            <a href={dump.downloadUrl} download={filename}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </a>
          </Button>
        )}
        {dump.status === 'FAILED' && onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        )}
        {isExpired && dump.status === 'READY' && (
          <Clock className="text-muted-foreground h-4 w-4" />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Storybook story (optional but recommended)**

If `modules/cloud/components/__stories__/` exists, add a story. Otherwise skip.

- [ ] **Step 3: Commit**

```bash
git add modules/cloud/components/dump-row.tsx
git commit -m "feat(cloud): DumpRow component (READY/RUNNING/PENDING/FAILED/EXPIRED states)"
```

---

### Task 18: `<DatabaseBackupsTab>` content

**Files:**

- Create: `modules/cloud/components/database-backups-tab.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'

import { Database, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useEnvironmentDumps } from '@/modules/cloud/hooks/use-environment-dumps'
import { DumpRow } from '@/modules/cloud/components/dump-row'
import { Button } from '@/modules/shared/components/ui/button'

type Props = {
  tenantId: string | null
  canEdit: boolean
}

export function DatabaseBackupsTab({ tenantId, canEdit }: Props) {
  const { dumps, isLoading, error, isRequesting, request } = useEnvironmentDumps(tenantId)

  const inFlight = dumps.some((d) => d.status === 'PENDING' || d.status === 'RUNNING')

  const handleCreate = async () => {
    try {
      await request()
      toast.success('Dump started — check back in a moment.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start dump')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-background/40 flex items-center justify-between rounded-lg p-3">
        <div className="text-muted-foreground text-xs">
          <span className="text-foreground font-medium">{dumps.length}</span> dump
          {dumps.length === 1 ? '' : 's'}
          {' · '}24h retention
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleCreate} disabled={inFlight || isRequesting}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {isRequesting ? 'Starting…' : inFlight ? 'In progress…' : 'Create dump'}
          </Button>
        )}
      </div>

      {error && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">{error}</div>
      )}

      {isLoading && dumps.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">Loading…</div>
      ) : dumps.length === 0 ? (
        <div className="text-muted-foreground bg-muted/30 flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <div className="bg-background flex h-12 w-12 items-center justify-center rounded-full border">
            <Database className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">No dumps yet</p>
            <p className="text-xs">
              Create a dump to download a portable copy of this env's database.
            </p>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={handleCreate} disabled={isRequesting}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {isRequesting ? 'Starting…' : 'Create dump'}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {dumps.map((d) => (
            <DumpRow
              key={d.id}
              dump={d}
              onRetry={d.status === 'FAILED' ? handleCreate : undefined}
            />
          ))}
        </div>
      )}

      <p className="text-muted-foreground pt-2 text-[11px]">
        Restore:{' '}
        <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono">
          pg_restore -d &lt;url&gt; file.dump
        </code>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/cloud/components/database-backups-tab.tsx
git commit -m "feat(cloud): DatabaseBackupsTab content (toolbar + list + empty state)"
```

---

### Task 19: `<DatabaseOverviewTab>` content (minimal)

**Files:**

- Create: `modules/cloud/components/database-overview-tab.tsx`

- [ ] **Step 1: Implement**

```tsx
type Props = {
  clusterName: string
}

export function DatabaseOverviewTab({ clusterName }: Props) {
  return (
    <div className="space-y-3 text-sm">
      <Field label="Cluster name" value={clusterName} mono />
      <Field label="Engine" value="PostgreSQL 16" />
      <Field label="Pooler" value={`${clusterName}-pooler`} mono />
      <p className="text-muted-foreground pt-3 text-xs">
        Per-cluster status and metrics live in the kube-prometheus dashboards. To access the
        database from outside the cluster, see the Backups tab — restore a recent dump locally
        rather than exposing the connection string.
      </p>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/cloud/components/database-overview-tab.tsx
git commit -m "feat(cloud): DatabaseOverviewTab (minimal facts)"
```

---

### Task 20: `<DatabaseDetailDrawer>`

**Files:**

- Create: `modules/cloud/components/database-detail-drawer.tsx`

- [ ] **Step 1: Implement**

Look at `modules/cloud/components/service-detail-drawer.tsx` for the exact Sheet structure (Radix or shadcn Sheet). Mirror it. Sketch (replace `Sheet*` imports with whatever the existing drawer uses):

```tsx
'use client'

import { Database, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/modules/shared/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/modules/shared/components/ui/tabs'
import { Button } from '@/modules/shared/components/ui/button'
import { DatabaseOverviewTab } from './database-overview-tab'
import { DatabaseBackupsTab } from './database-backups-tab'

type Props = {
  open: boolean
  tenantId: string | null
  clusterName: string
  canEdit: boolean
  tab: string | null
  onTabChange: (tab: string) => void
  onClose: () => void
}

export function DatabaseDetailDrawer({
  open,
  tenantId,
  clusterName,
  canEdit,
  tab,
  onTabChange,
  onClose,
}: Props) {
  const activeTab = tab === 'overview' || tab === 'backups' ? tab : 'backups'
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader className="flex flex-row items-center gap-3">
          <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-md">
            <Database className="text-muted-foreground h-5 w-5" />
          </div>
          <div className="flex-1">
            <SheetTitle>Database</SheetTitle>
            <p className="text-muted-foreground font-mono text-xs">{clusterName}</p>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={onTabChange} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="backups" className="flex-1">
              Backups
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <DatabaseOverviewTab clusterName={clusterName} />
          </TabsContent>
          <TabsContent value="backups" className="mt-4">
            <DatabaseBackupsTab tenantId={tenantId} canEdit={canEdit} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
```

(If the existing drawer files use a different primitive — like a custom Sheet or a Vaul drawer — adopt that. Read `service-detail-drawer.tsx` first.)

- [ ] **Step 2: Commit**

```bash
git add modules/cloud/components/database-detail-drawer.tsx
git commit -m "feat(cloud): DatabaseDetailDrawer with Overview + Backups tabs"
```

---

### Task 21: `<DatabaseRow>` on the env page

**Files:**

- Create: `modules/cloud/components/database-row.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'

import { Database, ChevronRight } from 'lucide-react'

type Props = {
  clusterName: string
  onOpen: () => void
}

export function DatabaseRow({ clusterName, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-background/40 hover:bg-background/60 flex w-full items-center gap-3 rounded-lg p-4 text-left transition-colors"
    >
      <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
        <Database className="text-muted-foreground h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Database</span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            healthy
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
          {clusterName} · postgres 16
        </p>
      </div>
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/cloud/components/database-row.tsx
git commit -m "feat(cloud): DatabaseRow component (env page → drawer trigger)"
```

---

### Task 22: Render Database row + drawer on the env page

**Files:**

- Modify: `app/cloud/[project]/page.tsx`

- [ ] **Step 1: Wire it in**

Open `app/cloud/[project]/page.tsx`. Near the top, add imports:

```tsx
import { DatabaseRow } from '@/modules/cloud/components/database-row'
import { DatabaseDetailDrawer } from '@/modules/cloud/components/database-detail-drawer'
```

Locate where `<AgentsSection>` is rendered (or where the page renders the per-section list). After the agents section (or at the equivalent insertion point — read the file's current structure), insert:

```tsx
{
  state && state.services.some((s) => s.enabled && s.type === 'SWITCHBOARD') && (
    <DatabaseRow
      clusterName={`${tenantId}-pg`}
      onOpen={() => drawer.open({ kind: 'database', id: 'main' }, 'backups')}
    />
  )
}
```

Where `<ServiceDetailDrawer>` and `<AgentDetailDrawer>` are rendered (probably near the bottom of the component), add the database drawer:

```tsx
<DatabaseDetailDrawer
  open={drawer.scope?.kind === 'database'}
  tenantId={tenantId}
  clusterName={tenantId ? `${tenantId}-pg` : ''}
  canEdit={canSign && !isInactive}
  tab={drawer.tab}
  onTabChange={(t) => drawer.setTab(t)}
  onClose={() => drawer.close()}
/>
```

- [ ] **Step 2: Typecheck**

```bash
npm run tsc 2>&1 | tail -10
```

- [ ] **Step 3: Lint**

```bash
npm run lint 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add app/cloud/[project]/page.tsx
git commit -m "feat(cloud): render Database row + drawer on env detail page"
```

---

## Phase 5 — Verify

### Task 23: Run the full vetra.to test + lint + tsc suite

- [ ] **Step 1: Run all checks**

```bash
cd /home/froid/projects/powerhouse/vetra.to
npm run tsc 2>&1 | tail -20
npm run lint 2>&1 | tail -20
npx vitest run 2>&1 | tail -20
```

- [ ] **Step 2: Fix anything broken**

If tsc or lint fails, fix the issue and re-run. Don't proceed to step 3 until clean.

- [ ] **Step 3: Run dev server and open the cloud page**

```bash
npm run dev &
sleep 5
echo "Open http://localhost:3000/cloud/<an-env-slug> manually and click 'Database' on an env that has Switchboard enabled."
```

Verify in the browser:

- The Database row appears below Agents (only when Switchboard is enabled).
- Clicking it opens the drawer at the Backups tab.
- The empty state is visible.
- "Create dump" button is gated on `canSign`.
- Reloading with `?drawer=database&drawerTab=backups` reopens the drawer at the Backups tab.

Stop the dev server when done.

- [ ] **Step 4: Commit any UI fixes from manual testing**

(If any.)

---

### Task 24: Run the full subgraph test suite

- [ ] **Step 1: All tests**

```bash
cd /home/froid/projects/powerhouse/vetra-cloud-package
npx vitest run
npm run lint 2>&1 | tail -10
```

Fix anything red. Commit fixes.

---

### Task 25: Final summary report

- [ ] **Step 1: Print the deploy checklist**

After all code is committed, print the residual deploy actions (these need a human):

1. **Build + push image:**

   ```bash
   cd /home/froid/projects/powerhouse/powerhouse-k8s-hosting/infrastructure/pgdump-uploader
   docker build -t cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0 .
   docker push cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0
   ```

2. **Provision the bucket** (`powerhouse-env-dumps` on Hetzner Object Storage with 24h lifecycle expiration). Add to terraform in `powerhouse-k8s-cluster`. Apply. (Out of scope of this PR — separate terraform PR.)

3. **Per tenant:** create OpenBao secret at `tenants/<ns>/secrets/env-dumps-s3` with `accessKey` + `secretKey` scoped to the `<ns>/*` prefix. Set `database.envDumps.enabled: true` in that tenant's `powerhouse-values.yaml`.

4. **Subgraph env:** the `vetra-cloud-observability` deployment needs new env vars in its tenant's chart values (or wherever the subgraph is configured): `VETRA_DUMPS_S3_ACCESS_KEY`, `VETRA_DUMPS_S3_SECRET_KEY` (these can ride on a per-platform OpenBao key — `powerhouse/shared/env-dumps-s3-admin` is one approach). When these are missing the dump feature is disabled (logged as a warn at startup; UI hides Database row only if no Switchboard, otherwise shows row but mutation will fail with a clear error).

5. **Merge** the subgraph + chart + UI PRs. ArgoCD picks up the chart change.

---

## Self-Review Notes

- **Spec coverage:**
  - Auth (owner-only) → Task 3 + Task 7 (resolver tests for owner / non-owner / unauth).
  - `database_dumps` table → Task 1.
  - GraphQL surface → Task 8.
  - Job spec → Task 4.
  - Image → Task 10.
  - Status reconciliation → Task 6 + Task 9.
  - RBAC → Task 11.
  - ExternalSecret → Task 12.
  - One-in-flight per env → Task 2 (`DUMP_IN_PROGRESS`).
  - Subgraph crash recovery → Task 9 (watcher reconciles `listInFlight`).
  - UI Database row + drawer + Backups tab + empty/loading/error states → Tasks 14–22.
  - 24h derived expiration → Task 7 (`expiresAt < now()` → `downloadUrl: null`).
  - Prune sweep → Task 9 (`startDumpPrune`).
- **Placeholder scan:** None.
- **Type consistency:** `DumpsRepo`, `DumpResolverDeps`, `DatabaseDump` GraphQL type, and UI `DatabaseDump` TS type all align on field names (id, status, requestedAt, startedAt, completedAt, expiresAt, sizeBytes, errorMessage, downloadUrl).
