# SOULBOUND 0.58 — Unified Combat Core (Safe Refactor)

## Purpose

The first combat-engine extraction focuses on **one shared source of truth for numerical damage and skill metadata**, instead of adding new mechanics or rebalancing. It is a staging/draft release branching from **v0.57-core-hardening**.

## Implemented and wired into the actual game

- **combat/formulas.js:** pure, deterministic functions for regular hero attacks, skills, BREAK STRIKE, multi-target splash, enemy pre-mitigation damage and final damage after armour/Guard/ward/race modifiers.
- **combat/skills.js:** canonical class-specific skill multipliers, skill names, unlock levels, cooldowns, MP costs, AoE classification, and secondary AoE scaling.
- **server.js:** combat commands now delegate their damage to the shared formulas; skill definitions and AoE flags come from the catalog. No changes to player resource consumption, timing or rewards.
- **combat-v054.js:** all enemy hits use shared enemy-attack/mitigation functions.
- **combat-v055.js:** action validation reads the same canonical cost and unlock values used by the server.
- New automated **formula parity tests** compare 0.58 outputs against the 0.57 equations across all 8 region DEF bands, all 3 classes, fire/water/ice/arcane damage modifiers, party defence, Guard, and Break/AoE.
- `npm run audit:combat` inspects that server, combat modules, versioning and secure-save integration are wired.

## Explicitly unchanged

- Stage 1–40 progression, enemy count, boss HP/ATK balance, DEF reduction, skills, items, loot drop odds, EXP/Gold, crafting/shop inventory, graphics and WebAudio.
- Save schema and Secure Save migration from 0.57. **0.58 requires the same correct server-side Supabase configuration as 0.57**; this branch does not apply SQL or set Render environment variables.
- Visible version is **0.58**; internal npm package version is **0.58.0**, because npm uses three-digit semver.

## Still pending: NOT a fully unified combat engine yet

- AI attack selection, charge/phase rules, stun/DoT/status execution, and deterministic combat event logs remain in legacy combat modules.
- Server Socket turn orchestration and rewards still need their own carefully tested extractions.
- Real browser, 4-player latency/reconnect, and authenticated secure-save QA remain necessary.

## Before deployment

1. Confirm **v0.57 Secure Save** is operating correctly on a separate Render testing service and `/health` shows `secureSavesEnabled: true`.
2. Back up test save slots and use throwaway heroes; do not delete a main hero to test this release.
3. Deploy branch `v0.58-unified-combat-engine` to staging only, not the existing production URL.
4. Verify simple physical attacks, each of seven skills on every class, Mage multi-target spell, BREAK, 8 boss special types, Guard/high DEF, kill rewards and boss phases.
5. Test a solo and a 2-player fight, save, refresh, and verify inventory/Gold/XP and slots.
6. Run `npm test`, `npm run audit:combat`. If a mismatch appears, revert the staging branch; previous 0.57 remains intact.

## Next plan

**0.59 Multiplayer Stability** will prioritize deterministic action IDs, reconnect and idempotent rewards. A later combat follow-up should move status and boss AI to structured data and event records, but not in an untested all-at-once rewrite.
