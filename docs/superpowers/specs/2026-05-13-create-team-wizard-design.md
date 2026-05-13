# Create Team Wizard (Slice E) — Design

**Date:** 2026-05-13
**Author:** @froid1911
**Status:** Draft
**Slice of:** Builder teams + packages profile integration

## Roadmap Context

This is **Slice E** from the broader roadmap defined in `2026-05-13-profile-shell-and-dashboards-design.md`. Depends on Slice A (shipped today — `/profile?tab=teams` shell with the new `fetchBuilderTeamsByMember` resolver).

## Goal

Add an in-app multi-step wizard at `/profile/create-team` that lets any Renown-authenticated user mint a new `BuilderTeam` document with full profile info (name, slug, description, logo, socials) and optional member invites. The creator is automatically added as the first member. On success the user is redirected to the new team's public page at `/builders/[slug]`.

## Non-Goals (Slice E)

- Editing an existing team's profile (Slice B).
- Add/remove members after creation (Slice C).
- Spaces & packages curation on a team (Slice D).
- Join-via-invite-link (Slice F).
- File uploads for logos (deferred — URL-only in this slice; needs an upload-component refactor across surfaces).
- Renown DID → multi-wallet identity (deferred).
- Drive selection. The hardcoded drive id from `vetra-builder-package`'s `powerhouse.config.json` is used (`vetra-builder-package` on staging).

## Architecture

vetra.to-only. No backend changes. Uses primitives already available:

```
vetra.to (new)                           vetra-builder-package (existing)
─────────────                            ─────────────
app/profile/create-team/                 document-models/builder-team/v1/gen/
  page.tsx                                 profile/creators.ts → setProfileName, setProfileSlug, ...
  components/                              member/creators.ts  → addMember
    stepper.tsx
    step-identity.tsx                    @powerhousedao/reactor-browser
    step-brand.tsx                         addDocument()       → mint a new BuilderTeam doc
    step-socials.tsx                       useDispatch()       → batched action dispatch
    step-members.tsx                       useRenownAuth()     → creator's address
    submit-bar.tsx

modules/profile/lib/
  use-create-team.ts                       — orchestrates addDocument + dispatchActions
  use-slug-availability.ts                 — live `fetchBuilderTeam(slug)` check
  use-ens-resolver.ts                      — viem reverse ENS lookup for member step
  validations.ts                           — slug regex, eth-address regex, URL regex

modules/profile/__tests__/
  validations.test.ts
  use-create-team.test.tsx

app/profile/create-team/components/__tests__/
  step-identity.test.tsx
  step-members.test.tsx
```

### Data flow

1. User clicks "Create team" on `/profile?tab=teams` → navigates to `/profile/create-team?step=1`.
2. User fills 4 steps (back/next + step-deep-linkable URL state).
3. On submit, `useCreateTeam`:
   - calls `addDocument(driveId, name, "powerhouse/builder-team")` → returns the new `documentId`,
   - composes the action batch (one entry per non-empty field plus one `addMember` per address),
   - dispatches the whole batch in one signing event,
   - polls `fetchBuilderTeam(slug)` for up to 5s to let the read-side processor catch up,
   - `router.push("/builders/[slug]")` + toast "Team created".

## CTA entry points

Both entry points open `/profile/create-team`:

1. **Header button** on `/profile?tab=teams`: primary `+ Create team` aligned right of the "My profile" h1. Visible only when `auth.status === 'authorized'`.
2. **Empty-state CTA**: the existing "You're not in any builder team yet" card gets a secondary `Create your first team` button beside the existing "Browse builders" link.

## Route & layout

`app/profile/create-team/page.tsx`. Auth-gated identically to `/profile` (`<LoginPrompt>` if unauthorized; spinner during `loading`/`checking`). Layout:

- Container: `mx-auto max-w-2xl px-4 py-8`
- Header: `h1` "Create new team" + subtitle "Set up your team's profile and invite your first members."
- `<Stepper>` (4 dots, current highlighted, completed checkmarked).
- Step content (one of four).
- `<SubmitBar>` at bottom: `Back` (disabled on step 1) + primary `Next` (steps 1–3) / `Create team` (step 4).
- URL state: `?step=1|2|3|4`, default `1`, invalid → `1`. Browser back goes one step. Form state held in React state at the page level (not in URL); refresh = state lost (acceptable for a single session).

## Step 1 — Identity

Fields:

- `name`: required, 1–60 chars, any unicode.
- `slug`: required. Auto-suggested from name (`slugify(name)`: lowercase, normalize unicode → ASCII, replace non-alphanumeric with `-`, collapse repeats, trim leading/trailing `-`). Editable. Validated against `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, 3–40 chars.
- Live availability via `useSlugAvailability(slug)`: debounced 300ms, calls `fetchBuilderTeam(slug:)`; renders inline status `…checking`, `✓ Available`, `✗ Taken`.

`Next` disabled until: both fields valid AND slug check resolves to "Available".

## Step 2 — Brand

Fields (all optional):

- `description`: textarea, 0–280 chars, live counter `127 / 280`.
- `profileLogo`: URL input, ≤500 chars. Live preview: `<Avatar>` chip beside the input updates as the user types. On image load error, falls back to initials avatar (no validation error shown — user might still be typing).

`Next` always enabled.

## Step 3 — Socials

Three optional URL fields with light client validation (must parse as a URL if non-empty):

- `profileSocialsX` — label "X (Twitter)", helper "e.g. https://x.com/your-team".
- `profileSocialsGithub` — label "GitHub", helper "e.g. https://github.com/your-team".
- `profileSocialsWebsite` — label "Website", helper "e.g. https://your-team.com".

`Next` always enabled.

## Step 4 — Members

Top: read-only "creator card" pinned with creator's display name + truncated address + label "You — admin". Not removable.

Below: dynamic list of invite rows. Each row:

- Eth-address input, validated as `/^0x[a-fA-F0-9]{40}$/`.
- ENS reverse lookup via `useEnsResolver(address)`: viem `mainnetClient.getEnsName(address)`, debounced 500ms; renders resolved name below the input ("→ vitalik.eth") when available.
- `×` remove button.

Bottom of list: `+ Add member` button (adds an empty row). Initial render: one empty row.

Validations:

- Empty rows are stripped on submit.
- Duplicate addresses across rows or with the creator's: inline error "Already invited."
- Invalid address: inline error "Must be a 0x… address."

`Create team` enabled when all non-empty rows are valid (or all empty).

## Submit flow

In `modules/profile/lib/use-create-team.ts`:

```ts
async function createTeam(form: CreateTeamForm) {
  const driveId = 'vetra-builder-package'

  // 1. Mint the document.
  const { documentId } = await addDocument(driveId, form.name, 'powerhouse/builder-team')

  // 2. Build the action batch.
  const actions = [
    setProfileName({ name: form.name }),
    setProfileSlug({ slug: form.slug }),
    ...(form.description ? [setProfileDescription({ description: form.description })] : []),
    ...(form.profileLogo ? [setProfileLogo({ logo: form.profileLogo })] : []),
    ...(form.profileSocialsX ? [setProfileSocialsX({ url: form.profileSocialsX })] : []),
    ...(form.profileSocialsGithub
      ? [setProfileSocialsGithub({ url: form.profileSocialsGithub })]
      : []),
    ...(form.profileSocialsWebsite
      ? [setProfileSocialsWebsite({ url: form.profileSocialsWebsite })]
      : []),
    addMember({ id: generateId(), ethAddress: creatorAddress }),
    ...form.members.map((m) => addMember({ id: generateId(), ethAddress: m.address })),
  ]

  // 3. Single signing event for the whole batch.
  await dispatch(documentId, actions)

  // 4. Wait for the read-side processor (up to 5s).
  await waitForSlug(form.slug, 5000)

  // 5. Redirect.
  router.push(`/builders/${form.slug}`)
  toast.success('Team created')
}
```

`waitForSlug(slug, timeoutMs)` polls `fetchBuilderTeam(slug)` every 500ms until non-null or timeout. On timeout it resolves anyway — the page itself shows an "almost there" placeholder if needed.

Action creators are imported from `@powerhousedao/vetra-builder-package/document-models/builder-team/v1`. Confirm export shape during implementation; if any creator is missing, fall back to writing the action object directly.

## Error handling

| Failure                               | UX                                                                                                                                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Slug taken (snuck through live-check) | Inline red error on slug field; auto-jump back to step 1 with focus on slug.                                                                                                                                                                     |
| `addDocument` rejected (auth)         | Toast "Sign in to create a team"; redirect to login.                                                                                                                                                                                             |
| Renown signing cancelled              | Toast "Cancelled — your team wasn't created"; stay on step 4 with form state intact.                                                                                                                                                             |
| Network error during dispatch         | Toast with "Retry" action: "Couldn't reach the switchboard." Form state preserved.                                                                                                                                                               |
| Slug propagation timeout (>5s)        | Redirect anyway. `/builders/[slug]` has a friendly "Almost there — your team is being indexed" with `<meta http-equiv="refresh" content="3">` for auto-retry. (Implemented in slice E for our new flow only; existing builder pages unaffected.) |

## Testing

### vitest (`modules/profile/__tests__/`, `app/profile/create-team/components/__tests__/`)

- `validations.test.ts`: slug regex, eth-address regex, URL validator, `slugify(name)` (10 cases incl. unicode, double dashes, leading punctuation, empty).
- `use-create-team.test.tsx`: happy path + each error path (mocked `addDocument`, `dispatch`); asserts the correct action batch is dispatched for partial inputs.
- `use-slug-availability.test.tsx`: debounced fetch, returns `available | taken | checking`; cancels in-flight requests on slug change.
- `step-identity.test.tsx`: renders all states (idle, checking, available, taken); Next-button gating.
- `step-members.test.tsx`: add/remove rows, dedupe with creator, ENS resolver mocked.

### Manual

- Dev-server walkthrough: log in via Renown on staging → header CTA → fill all 4 steps → submit → verify single Renown signing prompt → verify redirect to `/builders/[slug]` → verify team rendered with correct data.
- Edge: cancel signing midway → verify stay on step 4 with form intact.
- Edge: try a taken slug → verify inline error blocks Next.

## Rollout

Single vetra.to PR against `staging`. No backend changes, no chart/values changes. Docker build auto-fires on push to staging → k8s-hosting auto-bumped → Argo syncs.

## Out of scope / Future

- Drive selection (multi-drive support).
- File upload for logo (slice will be redone alongside a shared image-uploader component).
- ENS lookup chain selection (currently mainnet only).
- Permission gating (currently any Renown user can create).
- Member roles (admin vs regular). Currently all members are equal except the implicit "creator" label.
- Edit-after-create: covered by slice B.
