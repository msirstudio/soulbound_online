# SOULBOUND v0.69 — Safe Startup Audit and Manual QA Plan

Date: 2026-11-17. Based on `v0.68-ancient-forge`. This branch is **not a production deployment**.

## Safety boundaries
- **Do not merge to `main` or change the Render deploy branch during this audit.**
- **Never execute `SUPABASE-V065-ONE-TIME-RESET-ALL-PROGRESS.sql`** as part of v0.69.
- Do not delete, reset, or replace any real player's saves. Use **fresh disposable QA accounts/slots** only.
- Startup no longer removes older local Guest, character, world progress, or reconnect keys. Old-season saves remain hidden from the current season, but are retained.
- Before an intentional New Game on an older-season occupied slot, require an explicit old-season confirmation, a recoverable SaveGuard snapshot, and a distinct owner/slot/season-scoped archive. If either write fails, no New Game request proceeds.
- SaveGuard snapshots now include `season_id`, `character_id`, `gender`, `materials`, `forge_history`, and `gm_grants` in addition to prior character fields.
- Existing explicit Delete Slot actions remain user-controlled; **do not use them while testing with real data**.

## What is verified in source/CI
- `main` and `v0.68-ancient-forge` are separate branches. `package.json` in v0.68 reports `0.68.0`; `GET /health` reports the running version and `secureSavesEnabled`.
- Three Save Slots, slot-first creation/Continue, different Guest/account key namespaces, secure-save revision checks and explicit delete confirmations have pre-existing tests.
- Authenticated Forge purchases and item upgrades are server-authoritative; separate pre-existing tests cover cloud save success/failure, duplicate request IDs, and 1–4-player Guardian scaling.
- Reconnect ticket rotation, dropout pause, replay-safe battle actions and two-player Socket tests exist.
- All seven `public/assets/character-select/*-full.webp` and `*-portrait.webp` files plus the guild hall scene exist. This does not confirm visual alignment or that all class animations are finished.
- Existing boss balance tests check representative encounters, not a complete human playthrough of all 40 stages.

## Manual smoke-test matrix (must run against a separate staging deployment)
1. **Running branch and version**: In Render Dashboard open Web Service > Settings > Build & Deploy; record *Branch* and latest deployed commit. Open `https://soulbound-online.onrender.com/health` only for the current public deployment; record `version`, `secureSavesEnabled`, HTTP response and timestamp. **Do not alter those settings to perform this check.** For staging, use a separate service or an existing isolated preview deployment and confirm its `/health`.
2. **New Game / 3 Slots / Continue**: With a disposable Guest profile choose empty Slot 1, create hero, play one battle, close/reopen and Continue. Repeat for Slots 2 and 3. Verify names, identity, class, gold and EXP stay independent. Test overwriting ONLY with a disposable save, confirm backup/export and that Cancel preserves the original.
3. **Account vs Guest**: With a throwaway Supabase account, save to each of three slots. Sign out and use Guest, verify account slots never appear and Guest writes never affect account. Sign in again, confirm each account slot. Cross-device sync should be claimed only when `secureSavesEnabled: true` and schema has been configured.
4. **Forge persistence**: Buy basic stones and enhance one cheap item to +1 on a disposable hero; exit and reconnect; compare item UID, enhance level, Gold and material wallet. For secure-account test, deliberately simulate one failed cloud write **only in staging** and check rollback. Test higher-grade stone use and failure without item destruction.
5. **Multiplayer 2–4**: Join two clients, then 3 and 4. Test leader, target selection, enemy count and sequential turns. Disconnect one client, verify battle pauses, reconnect within the 120-second ticket lifetime and confirm turn, HP and equipment remain identical. Confirm no duplicate rewards after reconnect.
6. **UI and art**: At 100% desktop zoom verify seven identity hotspots, class chooser for each of the six classes, portraits, guild scene, Back/Continue/New Game, Forge and Inventory. Check broken image requests, screen overlap, keyboard selection and responsive sizes. Check the battle Idle/Attack/Hit art manually; the identity portraits alone are not proof of finished battle sprites.
7. **Boss balance**: On staging, sample early/mid/late bosses at party sizes 1, 2, and 4. Record average hits to kill, boss damage per player turn, healing and fight length; compare with desired difficulty and check whether +0/+5/+10 upgraded gear trivializes stages. Include both Guardians' 50% HP phase transitions.

## Known gaps — not declared fixed
- Actual Render branch and running version are **unverified** until Dashboard and the live health endpoint can be read.
- Automated tests do not prove real Supabase migrations, cloud outages, Render deployment, UI click accuracy or visual quality.
- Old-season saves are archived for intentional replacement, **not automatically migrated** to playable current-season characters.
- Legacy non-secure account saves cannot guarantee cross-device Forge materials/history; require secure-save backend before production use.
- Do not change version label to v0.69 or deploy this audit branch until staging manual QA passes.

## Commands for CI / local development
```sh
npm install --ignore-scripts --no-audit --no-fund
node --check public/game.js
node --check public/save-guard-v0564.js
npm test
```

This audit branch should be opened as a draft PR against `v0.68-ancient-forge`, **not `main`**.
