# Reference Library Records

PeptideOS now treats each compound research artifact as one editable YAML record:

```text
reference-library/compounds/<compound-id>.yml
```

This directory is the local database source for curated compound records. Agents can create or revise these files directly. The app consumes generated snapshots, not the raw YAML.

## Local Workflow

1. Run a research agent with `reference-library/research-compound.md`.
2. Save its structured output as `reference-library/compounds/<compound-id>.yml`.
3. Inspect and edit the YAML directly.
4. Keep `status: draft` until the record is ready.
5. Change `status: approved`.
6. Validate records:

```bash
pnpm library:validate-records
```

7. Build the app snapshot:

```bash
pnpm library:build-records
```

Only direct `*.yml` and `*.yaml` children of `reference-library/compounds` are consumed. Older multi-stage workflow folders under this tree are ignored by these commands.

## Status Rules

- `draft`: validates, but is not published into the generated app snapshot.
- `approved`: validates and is included in the generated app snapshot.
- `rejected`: validates, but is not published into the generated app snapshot.

## Quality Rules

- Claims should include `source_ids` when a durable source supports them.
- Claims may omit `source_ids` only when `evidence_level` is `unknown`/`theoretical`, or when `confidence` is `low` and `limitations` explicitly explain the uncertainty.
- `app_profile.summary` should tell a human why the compound is tracked: common biohacker context, useful PeptideOS logs, verification needs, and uncertainty.
- No dose, frequency, duration, treatment, or personal-use recommendations.
- Route-specific risks belong under `risks.by_route.<route>`.
- Unsupported routes belong only under `forms.excluded_routes`.
- Prefer concise, useful, source-backed app data over broad filler.
