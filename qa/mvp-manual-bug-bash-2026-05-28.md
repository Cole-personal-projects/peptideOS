# MVP Manual Bug Bash - 2026-05-28

Linear issue: PEP-49

## Scope

Focused MVP smoke path pass for local-first tester readiness after the MVP hardening checkpoint.

Covered on desktop and mobile viewport profiles:

- First-run onboarding in researcher mode.
- Inventory vial creation with a visible date added.
- Stack creation with BPC-157, daily schedule, and activation.
- Dashboard due-dose completion flow with vial and site selection.
- Dose Log confirmation for the completed dose.
- Settings export entry point.

## Evidence

Commands run before and during this pass:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:coverage`
- `pnpm test:e2e`
- Manual Playwright-driven desktop smoke path against `next start`.
- Manual Playwright-driven mobile smoke path against `next start`.

Automated validation result from this pass:

- Unit/integration coverage: 26 files, 131 tests passed.
- E2E: 74 tests passed across desktop and mobile projects.

## Findings

No new blocking product defects were confirmed during this pass.

The dashboard, stack activation, scheduled completion, dose log, inventory, PWA, and settings paths all passed the automated smoke coverage and the desktop/mobile manual pass.

## Follow-Up Issues Filed

None.

## Deferred Notes

- The manual smoke path creates a sealed vial, while scheduled-dose completion requires an active vial. Current seeded demo data includes active vials, and the separate reconstitution flow covers converting sealed vials to active inventory. No bug was filed because this matches the current inventory model.
- This pass did not add new product scope for reminders, cloud sync, auth, encrypted backup, or expanded reference-library curation.

## Checkpoint Status

PEP-49 can be closed once this note is linked on the Linear issue.
