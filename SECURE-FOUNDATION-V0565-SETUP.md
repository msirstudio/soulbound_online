# SOULBOUND v0.56.5 — Secure Foundation Setup & Cutover

**Status: staging / draft. Do not blindly deploy over your live game.** The previous `v0.56.4-system-foundation` branch remains available.

## Features implemented in source

- Server verifies Supabase access tokens through `/auth/v1/user`, then queries the verified user's slot. Client-supplied Level/ATK/DEF/Gold are **not** accepted when restoring a signed-in hero in secure mode.
- Server reads legacy `profiles` Slot 1 and `hero_save_slots` Slots 2/3 **once**, imports them into `hero_state_v0565`, and never writes the old tables during secure play.
- New Game, Delete, List Slots, and Restore occur over verified Socket.IO calls. Deleting writes a tombstone with a new revision, so old legacy data cannot be silently resurrected.
- After battle/shop/equipment changes the server serializes its own hero state and writes with a PostgreSQL compare-and-swap revision. Conflicting tabs cannot overwrite one another without receiving a clear save-conflict error.
- Combat action requests now include unique request IDs; duplicate packets are ignored in secure mode.
- Victory rewards have a stage-scoped idempotency guard. Room snapshots expose monotonically increasing `eventSeq`; logs record stage, event type and save revision but NEVER tokens or service credentials.
- The previous Export Hero / Last Backup functions remain available.

## Before any production change

1. **Back up** both `public.profiles` and `public.hero_save_slots` (plus their schemas and related Supabase project settings) using your own Supabase dashboard/provider tools. Export the most valuable heroes as JSON from the existing UI, too.
2. Use a **non-production Supabase project and test account** to rehearse this migration. Do not delete your main hero.
3. In Supabase SQL Editor, run `SUPABASE-SECURE-SAVES-V0565.sql`. This creates the new `public.hero_state_v0565` table and a server-only, revision-checking RPC. It does not change existing rows or remove old RLS policies.
4. On the TEST Render service, configure these private environment variables:
   - `SOULBOUND_SECURE_SAVES_ENABLED=1`
   - `SUPABASE_URL=https://<your-project-ref>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=<legacy service_role JWT secret>`
   - `SUPABASE_ANON_KEY=<anon/publishable key>`
   
   **NEVER** add the service-role secret to GitHub, `public/config.js`, chat messages, logs, or client-side JavaScript. Set it only in Render's private environment settings. The server intentionally refuses to start if secure mode is enabled without the necessary credentials.
5. Deploy the `v0.56.5-secure-foundation` branch to TEST Render only. Confirm `/health` says `"secureSaves":true`. Sign in, verify each of the 3 slots, load Slot 1 and Slot 2, beat an easy stage, refresh and confirm level/items/progress persist.
6. Open the same account and slot in **two browsers**, modify one, and confirm the stale browser gets a save-conflict error instead of overwriting the newer data. Test New Game / Delete only on disposable characters.
7. Verify a guest-only game stays playable. In secure mode unverified guest progress must NOT mix with verified character progression; a mixed party is rejected. Guest saves remain local and untrusted.
8. Confirm all 165+ regression tests pass and browser layout/sprite/sound still work.

## Critical production cutover (requires maintenance window)

When the secure service has been tested and all users have reloaded the new game, revoke direct browser-writing permissions on the **legacy** tables, so old clients cannot forge data in them:

```sql
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.hero_save_slots FROM authenticated;
```

Existing `profiles` and `hero_save_slots` rows remain intact as rollback evidence and migration source. **Do not execute the revocation before testing.** Signed-in clients on older branches will then fail to save, as intended; schedule the change to avoid data loss. Do not leave the live website using old code with these revocations active.

**This security work is NOT fully enabled until the new SQL, private Render env vars, and the legacy-write cutover have all been completed and verified.**

## Rollback warning

Switching only the Render branch back is NOT a complete rollback: new progress after secure cutover lives in `hero_state_v0565`, not the legacy tables. To roll back, stop writes, export the secure table, create verified backups, migrate the relevant revisions carefully, and restore old access policies only as part of an intentionally controlled procedure. **Never overwrite the old profiles blindly.**

## Scope not yet complete

- Browser exports still lack a tested automatic import/restore feature.
- Combat formulas remain split between `server.js`, `combat-v054.js` and `combat-v055.js` and need a separate, regression-tested refactor.
- Multiplayer reconnect/session transfer, cross-device recovery, race-condition stress tests and all 40 stages still require actual browser tests.
- Multiple legacy UI CSS layers remain. Removing them without visual comparisons could damage responsive layout.
- The live Render and Supabase environments have **not** been changed by this code branch.

Next milestone after validating this secure foundation: `v0.56.6-combat-engine`, with shared data-driven damage, skill, status and elemental formulas plus deterministic balance simulation.
