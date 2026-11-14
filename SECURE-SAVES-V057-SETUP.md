# SOULBOUND 0.57 — Secure Save activation checklist

**Do NOT deploy or switch production branch until all prerequisite steps pass.**

## 1. Back up before migration

Export or back up **public.profiles** and **public.hero_save_slots** (including metadata) from your original Supabase project. Keep the backup off-site. A Git branch rollback does not restore database contents.

## 2. Run migration

Open Supabase SQL Editor, paste \`SUPABASE-SECURE-SAVES-V057.sql\` and run it in your test project first. It creates \`public.hero_secure_saves\`, imports three existing slots without changing the legacy rows, revokes browser write access to the new table and allows server-side service-role access.

## 3. Set Render secret environment variables

In your *test* Render Web Service > Environment, add:

- \`SUPABASE_URL\`: your Supabase project URL
- \`SUPABASE_PUBLISHABLE_KEY\`: the existing public project key (not secret)
- \`SUPABASE_SECRET_KEY\`: a server-only secret key with database access; never place it in frontend code or commit it

When **all three are set**, Secure Save mode is enabled in the 0.57 backend. The server verifies signed-in Supabase JWTs, ignores user-submitted Level/ATK/DEF/Gold and reads trusted character data from \`hero_secure_saves\`. It writes game progress from authoritative server state using a revision-checked compare-and-swap operation.

Without these variables, legacy behavior remains active for rollback, **and is NOT protected against character stat spoofing**. Check \`/health\` for \`secureSavesEnabled: true\` before publicly claiming anti-cheat protection.

## 4. Test account and guest behavior

Test existing Slot 1–3 load, Create New Game, delete, concurrent tabs, high-latency and reconnect. Confirm the server reports Save Conflicts rather than silently overwriting newer saves.

Guest mode is by design **local-only and not anti-cheat authoritative**. Do not mix Guest with ranked public leaderboards or valuable transferable economies.

## 5. Deploy/rollback

Branch \`v0.57-core-hardening\` is a staging branch. Retain 0.56.4 and legacy Supabase rows as a rollback. **Important:** once players progress in Secure Save mode, switching back to 0.56.4 will show the older legacy records. To roll back without losing newer progress, the authoritative rows must first be exported and reconciled carefully by an administrator. Do not simply switch branches expecting cloud saves to migrate backward. Test the client, Socket and API integration in an isolated Render test service first.

## 6. Known remaining risks

- Full authenticated gameplay must be smoke-tested against real Render and Supabase. Repository CI tests do not validate your live credentials or network.
- Legacy character stats imported in step 2 may already have been modified by a user in the old client, so import alone is not an anti-cheat audit.
- Guest saves are not secure; Guest mode is not appropriate for competitive economy.
- Slot 1–3 pre-change JSON export is still a manual backup; automated import restore is not yet exposed.
- Player reconnection mid-battle and resilient distributed session hand-off remain separate multiplayer tasks.

## Testing gates before production

- GitHub Actions unit/integration tests are necessary but insufficient: test a new authenticated account, migrated old account, Guest-only room, solo boss, 4-player battle, corrupted session, expired token, two browser tabs and a forced database outage.
- Confirm `/health` reports `secureSavesEnabled: true`. If false, **the old insecure restore path still exists and must not be described as anti-cheat protected**.
- Verify the first server save increments `hero_secure_saves.revision`; refresh and confirm HP/Gold/XP match. Verify a failed save produces a visible `saveError` warning, not a fake success.
- In Secure Save mode, Guest players cannot join a signed-in-only party, protecting account-backed progression from unverified Guest stats. Guest-only parties remain available.
- For production use, perform a staging cutover and keep backups. This PR does not itself apply SQL or change Render environment variables.

### Current API-key guidance (Nov 2026)

New Supabase server keys start with `sb_secret_` and MUST be sent in the **`apikey` header**, never as the JWT in `Authorization: Bearer`. The server has been updated to handle this correctly; it retains the legacy `service_role` JWT fallback only if needed. Use the new `SUPABASE_SECRET_KEY` key name in Render whenever possible. Never share the value in chat or screenshots.
