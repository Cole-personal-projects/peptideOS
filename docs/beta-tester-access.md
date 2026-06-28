# Beta Tester Access Handoff

## Goal

Make private beta entry boring and reliable:

- User sees only the beta access screen before the app.
- User enters an email and beta key.
- Button visibly enters a loading/pressed state.
- Successful key entry shows a confirmation state.
- The beta screen is not shown again after successful entry on that device.
- After success, the user lands in the normal PeptideOS welcome/onboarding flow.
- Default app mode remains local-only unless the user later enables cloud sync.

## Ground Truth

Treat `origin/main` as the source of truth. Older local planning docs and stale worktrees can be frozen far behind current production.

Current beta files:

- `components/beta-access-gate.tsx`
- `app/api/beta/redeem/route.ts`
- `lib/beta-access.ts`
- `lib/beta-session.ts`
- `lib/supabase-server.ts`
- `supabase/migrations/20260627000000_add_beta_invites_and_entitlements.sql`
- `supabase/migrations/20260627001000_add_email_beta_access_grants.sql`
- `supabase/migrations/20260627153000_fix_beta_invite_digest_search_path.sql`

## Known Failure

The live backend has successfully consumed at least one beta key while the Safari/PWA client did not visibly unlock. That means the important failure is not simply "RPC cannot redeem." It is a client/server handoff failure after redemption.

Likely causes:

- The signed httpOnly cookie and `localStorage` marker diverged.
- A native form redirect set the cookie but could not set `localStorage`.
- The gate trusted `localStorage` before verifying the cookie.
- Safari/PWA reload behavior exposed the split-brain state.

## Correct Design

The signed `peptideos_beta_access` cookie is the durable authority. `localStorage` key `peptideos.betaAccessPassed` is only a cache/hint for UX, never the final unlock authority.

Expected flow:

1. Initial gate state is `checking` when beta is enabled.
2. `GET /api/beta/redeem` verifies the signed cookie.
3. If `GET` returns `ok: true`, set the local marker and render the app.
4. If `GET` returns `ok: false`, clear the local marker and show the beta form.
5. JSON `POST` success shows the confirmation state, writes the local marker, and unlocks in place.
6. Native form `POST` success redirects to `/?beta=confirmed`; the client shows confirmation while it verifies the signed cookie, then opens the app.

## Backend Notes

The Supabase RPC originally failed because it called `digest(...)` while the function `search_path` was limited to `public`. On Supabase, `digest` lives in the `extensions` schema.

The fix is in `20260627153000_fix_beta_invite_digest_search_path.sql`:

```sql
set search_path = public, extensions
extensions.digest(normalized_code, 'sha256')
```

Do not re-debug the backend first unless a direct RPC smoke fails.

## Test Key Handling

Do not commit raw beta invite keys, code hashes, or private invite ids. The current one-use test key is stored outside the repo.

Known test invite label:

```text
Cole test beta key 2026-06-27
```

Before a live user retest, reset only that invite row by looking up the id from the label, then clearing matching grants and setting `redeemed_count = 0`.

Useful lookup:

```bash
supabase db query --linked "select id, label, max_redemptions, redeemed_count, active from public.beta_invite_codes where label = 'Cole test beta key 2026-06-27';" --output json
```

Reset template:

```sql
delete from public.beta_email_access_grants
where invite_code_id = '<invite-code-id>';

update public.beta_invite_codes
set redeemed_count = 0,
    max_redemptions = 1,
    active = true
where id = '<invite-code-id>'
returning id, label, max_redemptions, redeemed_count, active;
```

Rollback RPC smoke:

```bash
supabase db query --linked "begin; select public.redeem_beta_invite_by_email('<private-test-key>', 'rollback@example.com') as result; rollback;" --output json
```

Live API smoke, only when intentionally consuming or after reset:

```bash
curl -sS -D /tmp/beta-headers.txt -o /tmp/beta-body.txt \
  -X POST https://peptide-os.net/api/beta/redeem \
  -H 'content-type: application/json' \
  --data '{"email":"some-test@example.com","inviteCode":"<private-test-key>"}'
```

## Verification

Run at minimum:

```bash
pnpm typecheck
pnpm lint
pnpm test lib/beta-access.test.ts lib/beta-session.test.ts lib/beta-access-schema.test.ts lib/supabase-server.test.ts
pnpm build
```

If this fails live again, capture the browser path precisely:

- Safari web or installed PWA.
- Whether URL has `?beta=confirmed`.
- Whether `GET /api/beta/redeem` returns `ok: true` after the attempted unlock.
- Whether the `peptideos_beta_access` cookie exists for `peptide-os.net`.
