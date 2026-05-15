# Environment Database Dump — Design

**Status:** spec, not implemented
**Driver:** users have asked to be able to download a portable copy of their environment's Postgres data — for local debugging, off-platform analysis, schema inspection, and a "we hold our own data" reassurance.
**Scope:** on-demand `pg_dump` of a tenant env's Postgres, surfaced behind an owner-gated UI in vetra.to. Existing automated CNPG/Barman backups are out of scope and stay invisible to end users.

## Mental model

Each tenant env (`tenants/<slug>/`) runs its own CNPG cluster `<slug>-pg` in its own namespace, with the application connecting via PgBouncer at `<slug>-pg-pooler.<ns>:5432`. CNPG already takes scheduled base backups to `s3://powerhouse-cnpg-backups/<tenant>/` for disaster recovery — those are Barman-format and only useful via CNPG itself, so we leave them alone.

The new feature is **independent** and produces a portable PostgreSQL dump file:

- The env owner clicks "Create dump" in vetra.to.
- The cloud GraphQL surface (`vetra-cloud-observability` subgraph) creates a one-shot `Job` in the tenant namespace.
- The Job runs `pg_dump --format=custom` against the pooler and uploads the result to `s3://powerhouse-env-dumps/<tenant>/<dumpId>.dump` on Hetzner Object Storage.
- The bucket has a 24-hour lifecycle expiration. While the dump is alive, the UI surfaces a presigned download URL (15-min validity, minted at query time, owner-gated).

The list of dumps is **transient operational state**, kept in the subgraph's `obsDb` next to `environment_pods`, `environment_release_history`, etc. It does **not** flow through the env document model.

## Auth

| Endpoint                                    | Who can call                                                       |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `requestEnvironmentDump(tenantId)` mutation | env owner (signer of action whose address matches `state.owner`)   |
| `environmentDumps(tenantId)` query          | env owner                                                          |
| Presigned download URL                      | minted only when the query passes the owner check; 15-min validity |

The check follows the pattern already used by `setServiceVersion` (resolvers.ts L365, L534): load the env row by `tenantId`, compare `envRow.owner.toLowerCase()` to the verified Renown bearer's address, raise `ForbiddenError` otherwise.

The presigned URL is **not** stored anywhere. We store the s3 key in the DB and sign on every read. This means a leaked URL has at most 15 min of authority, and re-listing the dumps re-verifies ownership.

**Known gap (out of scope):** the existing `logs`, `environmentPods`, `cpuUsage`, etc. queries trust `tenantId` blindly — any authenticated caller who knows a tenantId can read pods/logs/metrics. That's a separate hardening pass and not part of this feature. Documented here so the reviewer doesn't conflate the new dump auth with the existing observability auth.

## Data model — `obsDb.database_dumps`

New migration in `subgraphs/vetra-cloud-observability/db/migrations.ts`:

```sql
CREATE TABLE database_dumps (
  id              TEXT PRIMARY KEY,                -- nanoid; also dump filename
  document_id     TEXT NOT NULL,                   -- env doc id
  tenant_id       TEXT NOT NULL,
  requested_by    TEXT NOT NULL,                   -- caller eth address (lowercase)
  status          TEXT NOT NULL,                   -- PENDING | RUNNING | READY | FAILED
  job_name        TEXT,                            -- k8s Job name (null until created)
  s3_key          TEXT,                            -- e.g. <tenant>/<id>.dump (null until ready)
  size_bytes      BIGINT,                          -- null until READY
  error_message   TEXT,                            -- null unless FAILED
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL             -- requested_at + 24h
);
CREATE INDEX database_dumps_tenant_idx ON database_dumps (tenant_id, requested_at DESC);
```

**Status lifecycle:** `PENDING → RUNNING → READY` (happy path); `PENDING → FAILED` if Job creation fails; `RUNNING → FAILED` if the Job itself fails. There is no `EXPIRED` row state — the resolver derives expiration at read time (`now() > expires_at`) and stops returning a presigned URL. Rows older than 7 days are pruned by a periodic sweep so the table doesn't grow unbounded.

**Why no doc-model integration?** Dump records are 24-hour-TTL ephemera. The env doc is meant for "what should this env look like" (signed, replicated, versioned) — not for "what jobs ran against it". This matches `environment_release_history` which is also kept in `obsDb`, not in the doc model.

## GraphQL surface

Added to `subgraphs/vetra-cloud-observability/schema.ts`:

```graphql
type DatabaseDump {
  id: ID!
  status: DatabaseDumpStatus!
  requestedAt: String!
  startedAt: String
  completedAt: String
  expiresAt: String!
  sizeBytes: Float # null until READY
  errorMessage: String # null unless FAILED
  downloadUrl: String # presigned, null unless READY and not expired
}

enum DatabaseDumpStatus {
  PENDING
  RUNNING
  READY
  FAILED
}

extend type Query {
  """
  Owner-gated. Returns dumps for the env, newest first. Capped at 20.
  """
  environmentDumps(tenantId: String!): [DatabaseDump!]!
}

extend type Mutation {
  """
  Owner-gated. Returns the new dump in PENDING status. Caller polls
  environmentDumps to observe state transitions. Limit: one in-flight
  (PENDING|RUNNING) dump per env at a time.
  """
  requestEnvironmentDump(tenantId: String!): DatabaseDump!
}
```

## Job spec (rendered by the subgraph)

The subgraph constructs the Job via `@kubernetes/client-node`'s `BatchV1Api.createNamespacedJob`. The shape:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: pgdump-{{shortId}} # 8-char nanoid suffix
  namespace: { { tenantNs } }
  labels:
    app.kubernetes.io/managed-by: vetra-cloud-observability
    vetra.io/dump-id: { { dumpId } }
spec:
  ttlSecondsAfterFinished: 600 # k8s removes Job 10 min after finish
  backoffLimit: 0 # one shot — failure is exposed to the user as FAILED
  activeDeadlineSeconds: 3600 # 1h hard kill
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: default
      containers:
        - name: pgdump
          image: cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0
          env: # populated by the subgraph at create time
            - { name: PGHOST, value: '{{tenantNs}}-pg-pooler.{{tenantNs}}.svc.cluster.local' }
            - { name: PGPORT, value: '5432' }
            - {
                name: PGDATABASE,
                valueFrom: { secretKeyRef: { name: '{{tenantNs}}-pg-app', key: dbname } },
              }
            - {
                name: PGUSER,
                valueFrom: { secretKeyRef: { name: '{{tenantNs}}-pg-app', key: username } },
              }
            - {
                name: PGPASSWORD,
                valueFrom: { secretKeyRef: { name: '{{tenantNs}}-pg-app', key: password } },
              }
            - { name: S3_BUCKET, value: 'powerhouse-env-dumps' }
            - { name: S3_KEY, value: '{{tenantNs}}/{{dumpId}}.dump' }
            - { name: S3_ENDPOINT, value: 'https://fsn1.your-objectstorage.com' }
            - {
                name: AWS_ACCESS_KEY_ID,
                valueFrom: { secretKeyRef: { name: env-dumps-s3-credentials, key: accessKey } },
              }
            - {
                name: AWS_SECRET_ACCESS_KEY,
                valueFrom: { secretKeyRef: { name: env-dumps-s3-credentials, key: secretKey } },
              }
          resources:
            requests: { cpu: 200m, memory: 256Mi }
            limits: { cpu: 1, memory: 1Gi }
```

**Decisions:**

- `pg_dump` runs against the pooler, not the primary. Same path the app uses; if the pooler is broken the env is broken anyway.
- `--format=custom`. Compressed by default, supports `pg_restore -j`, restorable with one command (`pg_restore -d <url> file.dump`).
- `--no-owner --no-acl`. The dump should restore cleanly into a fresh database without role-existence dependencies.
- `backoffLimit: 0`. One shot. The UI surfaces "Retry" as a _new_ dump, not a retry of the same dumpId.
- `pg_dump` is piped directly to `s5cmd pipe` — no on-disk intermediate, so the Job needs no PVC and 1 GiB memory is enough for any reasonable env.

## The `pgdump-uploader` image

New directory `infrastructure/pgdump-uploader/` in `powerhouse-k8s-hosting`:

```dockerfile
FROM alpine:3.20
RUN apk add --no-cache postgresql16-client \
  && wget -qO- https://github.com/peak/s5cmd/releases/download/v2.2.2/s5cmd_2.2.2_Linux-64bit.tar.gz \
     | tar -xz -C /usr/local/bin s5cmd
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

```sh
#!/bin/sh
# entrypoint.sh
set -euo pipefail
echo "pgdump-uploader: dumping $PGDATABASE@$PGHOST → s3://$S3_BUCKET/$S3_KEY"
pg_dump --format=custom --no-owner --no-acl \
  | s5cmd --endpoint-url "$S3_ENDPOINT" pipe "s3://$S3_BUCKET/$S3_KEY"
echo "pgdump-uploader: done"
```

Built and pushed to `cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0`. ~30 MB.

## Status reconciliation (watcher)

Add `dumpJobWatcher` to `subgraphs/vetra-cloud-observability/watchers.ts`. Same pattern as `environmentPods`: cluster-wide informer on Jobs labeled `app.kubernetes.io/managed-by=vetra-cloud-observability`. Translates Job state to `database_dumps` rows:

| Job condition                 | Action on row                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Job created, no pod yet       | row stays `PENDING`                                                             |
| Pod transitions to `Running`  | `RUNNING` + `started_at = now()`                                                |
| Job condition `Complete=true` | `READY` + `completed_at = now()`; HEAD the s3 object to fill `size_bytes`       |
| Job condition `Failed=true`   | `FAILED` + `error_message = last 500 chars of pod logs`; `completed_at = now()` |

The watcher is idempotent — it diffs current row state before writing. On subgraph restart it reconciles all in-flight rows by re-listing Jobs.

A separate **prune sweep** (cron, every hour) deletes rows older than 7 days. Object expiration is enforced by the bucket lifecycle rule, not the sweep.

## RBAC + secrets

Two changes to `powerhouse-k8s-hosting`:

1. **`vetra-observability` ClusterRole** — extend the existing rule set to allow Job CRUD in tenant namespaces. The role already has `pods`, `events`, `pods/log` cluster-wide; add:

   ```yaml
   - apiGroups: ['batch']
     resources: ['jobs']
     verbs: ['get', 'list', 'watch', 'create', 'delete']
   ```

   This goes in `infrastructure/vetra-observability-rbac/` (existing dir).

2. **`env-dumps-s3-credentials` ExternalSecret** — new template in `powerhouse-chart/templates/external-secret-env-dumps-s3.yaml` that pulls per-tenant S3 credentials from `tenants/<name>/secrets/env-dumps-s3` in OpenBao. Each tenant gets a credential pair scoped to its own bucket prefix (`<tenant>/*`), enforced by Hetzner Object Storage bucket policy. The chart only renders the ExternalSecret when `database.cnpg.enabled: true`.

   We deliberately use **per-tenant** credentials, not the existing shared `s3-credentials`, to avoid the tenant-isolation gap flagged in `docs/security-audit-2026-04-20.md`.

## S3 / object storage

New bucket `powerhouse-env-dumps` on Hetzner Object Storage:

- Region: `fsn1` (same as backups bucket)
- Lifecycle rule: expire objects older than 24 h
- Bucket policy: per-tenant credential pairs scoped to `<tenant>/*` prefix
- Versioning: off
- Public access: off (presigned URLs only)

Provisioned via terraform in `powerhouse-k8s-cluster/terraform/20-k8s/` — it's where Hetzner Object Storage buckets are already declared.

## UI integration (vetra.to)

The recent IA refactor (commit `6fad087`) dropped env-level tabs in favor of a single-column env page with side drawers per object. The dump feature plugs into that grain.

### New surface 1 — Database row on the env page

A new `<DatabaseRow>` component renders below `<AgentsSection>` only when the env has a Postgres cluster — concretely, when `state.services.some(s => s.enabled && s.type === 'SWITCHBOARD')` (Switchboard is the only service that gates `database.cnpg.enabled` in the chart, see `powerhouse-chart/templates/postgres-cluster.yaml`). Visual style copies `<ServiceCard>`: 36×36 icon tile, name, live status pill, meta. Click opens the **Database drawer**.

```
┌──────────────────────────────────────────────────────────────┐
│ [DB icon] Database                                healthy │ │ <-- click
│           brave-lion-22-9c4d-pg · postgres 16 · 12 GB        │
└──────────────────────────────────────────────────────────────┘
```

### New surface 2 — Database drawer

New `<DatabaseDetailDrawer>` analogous to `<ServiceDetailDrawer>`. URL state extends `useDetailDrawer`: `?drawer=database&tab=backups`. Tabs:

- **Overview** — basic facts (cluster name, version, instances, primary pod, "healthy/degraded" derived from CNPG conditions). Read-only. Hits a new `environmentDatabase(tenantId)` resolver that wraps the CNPG `Cluster` CR. **In v1, this tab is minimal — three lines of facts.** It exists to anchor the drawer.
- **Backups** _(the feature)_ — toolbar (`N dumps · 24h retention` + `Create dump` button) and a list of dump rows with status pills, timestamps, file size, and per-row actions (Download for `READY`, Cancel for `RUNNING`, Retry for `FAILED`). Empty state: dashed-border card with the existing "no X yet" pattern.
- **Connection** — _out of scope for v1._ Tab is not rendered.

### Dump row component

Three visual states, matching `<ServiceCard>` row style (`bg-background/40 hover:bg-background/60 rounded-lg p-4`):

- **READY (within TTL):** filename, green `READY` pill, meta (`12 MB · 8m ago · expires in 23h 52m`), primary `Download` button on the right.
- **READY (expired)** — derived from `expiresAt < now()`: same row, gray pill, meta reads `expired 4h ago`, no actions. Stays visible until the row is pruned (7 days) so the user has history.
- **RUNNING:** filename, blue `RUNNING` pill, meta (`12s ago · pg_dump → s3`), thin animated progress bar. **No cancel** — dumps are short-lived and `activeDeadlineSeconds: 3600` is the safety net. Adding cancel introduces a Job deletion path we don't need yet.
- **PENDING:** filename, gray `PENDING` pill, meta (`requested 3s ago`). Brief state — usually flips to RUNNING within seconds of the Job being scheduled.
- **FAILED:** filename, red `FAILED` pill, meta (`5h ago · pg_dump exited 1: <error>`), ghost `Retry` button. Click "Retry" creates a _new_ dump (new id); it does not re-run the failed Job.

Polling: while any row is `PENDING` or `RUNNING`, the drawer polls `environmentDumps` every 5 s. Otherwise no polling — opening the drawer always refetches.

### Hooks + GraphQL plumbing

- New hook `useEnvironmentDumps(tenantId)` — wraps the query, handles polling, exposes `requestDump()` mutation wrapper.
- New GraphQL operation files in `modules/cloud/graphql/`. Codegen generates types via `npm run codegen`.

## Concurrency, failure, edge cases

- **One in-flight per env.** `requestEnvironmentDump` rejects with `DUMP_IN_PROGRESS` if a `PENDING` or `RUNNING` row exists for the tenant. UI grays out "Create dump" while the most recent row is in-flight.
- **Subgraph crash mid-Job.** The watcher reconciles on startup by listing existing Jobs; rows resume their lifecycle. The Job itself is owned by k8s, so a subgraph crash doesn't lose the work.
- **Job created but pod never schedules** (e.g. resource exhaustion). `activeDeadlineSeconds: 3600` causes Job failure → row goes to `FAILED` with a meaningful error.
- **`pg_dump` succeeds but s3 upload fails.** Pipeline failure propagates through the entrypoint script (`set -euo pipefail`) → Job fails → row goes to `FAILED`.
- **Caller loses ownership mid-dump.** Resolver re-checks ownership on every `environmentDumps` query. A former owner who polls after transferring ownership will get an empty list.
- **Multiple tenants share a Hetzner endpoint.** Per-tenant S3 credentials with prefix scoping prevent cross-tenant access; the bucket policy is the enforcement boundary.

## Testing

- **Subgraph (`vetra-cloud-package`):**
  - Unit tests for the resolver auth predicate (owner check across present/missing/case-mismatched owner addresses).
  - Unit tests for the `database_dumps` migration (smoke).
  - Unit tests for the watcher's status reducer (Job condition → row transition matrix).
  - Integration test for the in-flight concurrency check (request twice in quick succession; second call rejects).
  - Mock `@kubernetes/client-node` and the s3 HEAD client.
- **Image (`pgdump-uploader`):**
  - Local smoke test: build image, point at a local Postgres, point at a local MinIO, verify a `.dump` lands in the bucket and `pg_restore` round-trips it.
- **vetra.to UI:**
  - Storybook stories for `<DumpRow>` in each of the three states and an empty list.
  - Component test for `useEnvironmentDumps` polling lifecycle (starts when in-flight exists, stops when all settled).
  - Manual end-to-end test against staging once the chart and image are deployed (covered in the deploy checklist below).

## Out of scope / non-goals

- **Restore from a dump.** v1 produces dumps; users restore on their own (`pg_restore`). A "Restore from dump" UI is a future feature.
- **Dump scheduling.** v1 is on-demand only. CNPG already does scheduled backups; a user-facing scheduled dump is a future feature.
- **Cross-tenant dump sharing.** No "share this dump with X" link.
- **Surfacing CNPG/Barman backups in the UI.** They remain an internal DR primitive.
- **Hardening of existing observability queries** (`logs`, `environmentPods`, `cpuUsage`) to enforce ownership. Separate concern, separate PR.
- **`Connection` tab in the Database drawer.** Future feature; would surface the connection string under a confirmation flow.

## Deploy checklist (the steps that need explicit deploy actions)

The code changes land in three repos. Three deploy actions need a human to flip:

1. **Build and push the `pgdump-uploader` image** to `cr.vetra.io/powerhouse-inc/pgdump-uploader:1.0.0`.
2. **Provision the `powerhouse-env-dumps` bucket** + lifecycle rule + per-tenant credential pairs (terraform in `powerhouse-k8s-cluster`).
3. **Add per-tenant `env-dumps-s3` secrets** to OpenBao at `tenants/<name>/secrets/env-dumps-s3` (one-time per tenant; backfill script in `scripts/`).

Then merging the helm + subgraph PRs is enough — ArgoCD picks them up.
