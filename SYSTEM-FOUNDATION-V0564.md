# SOULBOUND v0.56.4 — System Foundation (Safe First Pass)

## Scope and safety

This branch is based on `v0.56.3-combat-rebalance-visible-packs` and is for **pre-production testing**. It makes no Supabase migrations and does not modify combat formulas, party rules, rewards or stored server-side items.

### What was implemented

1. `package.json` is the canonical current release version. The server reads it for `/health` and `/api/index`. On page load, the UI also checks `/health` to display the actual deployed version; HTML keeps a matching static fallback checked by CI.
2. The character selection screen contains **EXPORT HERO** (selected slot) and **LAST BACKUP** (most recent automatic local backup for selected slot). Both download JSON; no secrets or auth tokens are exported.
3. Deleting a populated slot or replacing it with NEW GAME saves a local recovery snapshot **first**. When localStorage cannot save, the destructive action aborts rather than silently losing data.
4. NEW GAME no longer erases the local world-progress cache before the Supabase write succeeds.
5. `npm run audit:foundation` performs read-only checks and explicitly reports remaining critical risks, while GitHub Actions runs the test suite.

### Important limitations

- **Export is not import.** The JSON is for emergency recordkeeping/manual recovery with care; this release does **not** implement in-game JSON restore. Treat a successful downloaded file as a backup copy, not a guaranteed restored save.
- Local snapshots are scoped to the account ID (or Guest) and slot in the **current browser**. Browser data clearing removes these copies; store downloaded JSON elsewhere.
- `restoreCharacter` still trusts some client-provided character stats and is **not anti-cheat secure**. The next release (v0.56.5) must make the server authoritative after verification against Supabase.
- Cloud Slot 2/3 writes still require `SUPABASE-SAVE-SLOTS-V0561.sql`. Revision conflict protection and stronger atomic writes are not yet implemented.
- This branch has **not been deployed** to Render nor independently validated against real production saves or devices.

## Required operator checklist

1. Keep the existing v0.56.3 Render branch live until regression testing passes.
2. Export the production `profiles` and `hero_save_slots` tables from Supabase; retain a secure backup outside the app before any destructive manual testing.
3. In a test account, verify all 3 slots, Save / Continue / New Game, and export current slot. Confirm that Slot 1 remains unchanged when Slot 2 is modified.
4. Test LAST BACKUP after New Game and Delete, verify the downloaded file. **Do not delete your only important character as a test.**
5. Test bad-network behavior: a failed Cloud New Game must not reset cached boss progress.
6. Try one solo and one multiplayer battle and save both clients, then refresh. Compare values.
7. Run `npm run audit:foundation` and `npm test`; check all required CI jobs.
8. Only then consider merging the PR and manually deploying on Render. Keep the prior branch for rollback.

## Exit criteria for v0.56.4

- All historical regression tests and new save-guard tests pass.
- Package, API and visible release version agree.
- Export JSON contains character information but **no auth fields**.
- Local backup failures block destructive operations.
- No migration or gameplay modification beyond delayed cache reset after successful New Game.

## Next step: v0.56.5 — Secure Saves

Prioritize server-side authentication for restored characters, whitelisted and validated persisted stats, slot-specific concurrency/version control, atomic progression updates and idempotent rewards. Current local snapshot/export features are a safety net only, not a substitute for a secure persistence service.

## v0.56.5 secure rollout supersedes legacy direct cloud saving

See `SECURE-FOUNDATION-V0565-SETUP.md` for migration, credentials and maintenance window. The previous export/rollback actions remain in place.
