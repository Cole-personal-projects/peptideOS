# Supabase Reference Registry

PeptideOS uses Supabase/Postgres as the planned curation source of truth for the reference library. The PWA does not query Supabase at runtime for MVP. Reviewed registry rows are exported into a validated local snapshot that the app can bundle and run offline.

## Required Local Tools

- Supabase CLI
- Node.js and pnpm from the repo toolchain

## Environment Variables

Use these only in local shell sessions or CI secret storage:

- `SUPABASE_PROJECT_REF`: Supabase project reference for the curation registry.
- `SUPABASE_ACCESS_TOKEN`: Personal access token used by the Supabase CLI.
- `SUPABASE_DB_PASSWORD`: Database password when required by the CLI.
- `SUPABASE_SERVICE_ROLE_KEY`: Future export-script credential for server-side or CI-only registry reads.

Service role keys must not be exposed to the browser, committed to the repo, or prefixed with `NEXT_PUBLIC_`.

## Local Migration Workflow

```bash
supabase login
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase db push
```

For local Supabase development:

```bash
supabase start
supabase db reset
```

## Access Model

The migration enables Row Level Security on every reference registry table. Current policies grant management access to the `service_role` role only. Browser runtime code should not receive direct read/write policies for these tables.

Future app consumption should use this flow:

1. Curators edit rows in Supabase.
2. A local or CI export job reads reviewed entries with server-side credentials.
3. The export writes a versioned reference snapshot.
4. Snapshot validation runs.
5. The app bundles the reviewed snapshot as read-only reference data.

## Remote Change Discipline

Schema changes should be committed as SQL migration files under `supabase/migrations`. Avoid changing the remote schema directly in the Supabase dashboard once migrations are active; use the dashboard for inspection and data curation, not untracked schema drift.
