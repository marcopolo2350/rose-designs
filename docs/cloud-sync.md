# Cloud Sync

Status: Experimental.

Local browser storage is still the primary source of truth for normal work, and JSON export remains the safer backup path.

## Current Boundary

- Implementation lives in `scripts/cloud/supabase.js`.
- The boundary exposes only `window.openCloudSyncSettings` and `window.cloudSync` as compatibility globals.
- Supabase is lazy-loaded only after cloud sync is configured and enabled.
- Cloud configuration is stored under registered app storage keys.
- Project payloads are validated before push and after pull.
- Cloud sync must not mutate `projects` or `curRoom` directly.

## Supabase Setup

Use `docs/cloud-schema.sql` in the Supabase SQL editor. It creates the `rose_projects` table, owner stamping, indexes, and Row Level Security policies.

The app expects these columns:

- `id` - project identifier
- `profile` - profile namespace
- `payload` - validated project JSON
- `updated_at` - timestamp used for simple merge decisions
- `deleted` - soft-delete flag for future handling
- `owner` - authenticated Supabase user id

Anonymous auth can work for personal device sync when Supabase anonymous sign-ins are enabled. The anon key is public by design, but the project URL and anon key still belong in the cloud sync settings screen rather than hardcoded source.

## Conflict Policy

Conflict handling is timestamp-based. When local and remote projects share an id, the newer `updatedAt` payload wins. This is not robust collaborative editing, and it should not be represented as such in UI copy or docs.

## Verification

```bash
npm run validate:cloud-boundary
```

This validator checks the experimental warning, RLS documentation, lazy Supabase loading, validation hook, compatibility globals, and the rule that cloud sync cannot directly overwrite global project state.
