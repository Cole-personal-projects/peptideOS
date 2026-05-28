# MVP Readiness Checkpoint

This checkpoint validates that PeptideOS is ready for realistic local-first tester sessions before adding new product scope.

## Core Smoke Path

- First-run onboarding can be completed in researcher mode.
- Inventory can create a named vial with a date added.
- Stacks can be created, started, and converted into due doses.
- A due dose can be completed with vial and site selection.
- Completed doses appear in the dose log with native units.
- Settings can export local user data as JSON.

## Validation

- Unit and integration coverage: `pnpm test:coverage`
- Browser coverage: `pnpm test:e2e`
- Focused smoke: `pnpm build && pnpm playwright test tests/e2e/mvp-walkthrough.spec.ts`
- PWA/offline check: `pnpm build && pnpm playwright test tests/e2e/pwa.spec.ts`

## PWA Offline Scope

- The app shell, manifest, and icons are precached by the service worker.
- Visited navigation routes are cached and can be reloaded while offline.
- Unvisited navigation routes show the branded offline fallback.
- Local user data remains IndexedDB-backed; cloud sync, push reminders, and cross-device restore are outside this checkpoint.

## Deferred

- Reminder assessment and notification behavior.
- Cloud sync, auth, and encrypted backup.
- Additional reference-library expansion beyond the 40 reviewed bundled entries.
