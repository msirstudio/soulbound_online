# SOULBOUND — Foundation & Single Source of Truth (v0.62 foundation pass)

> **Status:** Source refactor and automated regressions; no production Render deployment or database migration.
>
> **Based on:** `v0.62-female-knight-idle-12fps`, preserving the existing 12-FPS art fallback.

## Why this pass exists

Previously, `server.js` embedded race, item, enemy, and INDEX response tables; `public/game.js` repeated skill multipliers/cooldowns/MP costs and even shop item stat descriptions. This creates stale descriptions that may disagree with the actual combat calculations.

## New authoritative routes

| Fact | Only source of truth | How game and INDEX receive it |
|---|---|---|
| Base enemy/boss templates | `data/game-catalog-v062.js` | `world.encounter(stage,normal,bosses)` |
| Spawn HP/ATK/DEF/XP/Gold | `encounter-pack-v0562.js#makeGroup` | Live battles use `makeGroup`. INDEX calls `encounterPreview`, which also calls `makeGroup` |
| Region, normal, mini and boss names | `world-v040.js` + canonical boss templates | Both encounter and INDEX |
| Shop equipment/price/unlock/passive | `data/game-catalog-v062.js` importing `items/*shop*.js` | Live shop, INDEX, hero equipment tooltip |
| Skill damage multiplier/MP/unlock/cooldown | `combat/skills.js`, Archer catalog | `combat/public-skill-catalog-v062.js` feeds both `publicRoom(...).skillBook` and INDEX Skills |
| Final damage and reactions | `combat/formulas.js`, `combat-v055.js`, `server.js` | **Server ONLY**; UI displays read-only values and results |

**INDEX HP / ATK / DEF are spawn stats** for each selected party size, not final damage inflicted on a specific hero. Normal encounters can have alternate enemy counts, and the INDEX shows both possible variants. Damage from an individual attack is not a fixed number independent of the hero's DEF, Guard, buffs, status, element and random rolls; the INDEX explicitly documents this distinction.

## Files

- `data/game-catalog-v062.js` — moved base enemy/boss/shop/race definitions unchanged from `server.js`.
- `api/adventure-index-v062.js` — extracted read-only endpoint data builder. `GET /api/index` keeps `Cache-Control: no-store`, schema compatibility, and new `skills` category.
- `combat/public-skill-catalog-v062.js` — projection for 4 playable classes, with numeric values pulled from the executable skill definitions; qualitative descriptions are not independent balance inputs.
- `public/skill-view-v062.js` — reads `player.skillBook` for labels, mana, unlock, cooldown and tooltips. `public/game.js` no longer carries a second skill table; unavailable or locked skills remain disabled.
- `public/adventure-index-v0552.js` — adds read-only Class Skills tab; still uses live encounter projections for HP/ATK/DEF.
- `public/game.js` — replaces hardcoded weapon and armor bonus strings with equipment metadata already sent from the server, or canonical owned-item details.
- `tests/foundation-single-source.test.js` — validates all 40 stages, 1–4 party members, extreme random rolls, shop parity, skill parity and UI projection.
- `npm run verify:catalog` — run focused parity tests; `npm test` — entire existing regression suite.

## What intentionally did NOT change

- No SQL migrations, Save Slot IDs, user profiles, inventory item IDs, rarity tables or quest progression were altered.
- No skill damage, enemy difficulty, boss scaling, price, or drop probabilities were rebalanced.
- No socket event names or client action inputs were changed.
- Existing multiplayer turn validation, deduplicated action IDs, reconnect logic and damage formulas remain in the live server.
- 12-FPS Female Knight PNG is an optional asset on the base branch; if the image has not been uploaded it still falls back to previous art.

## Still to modularize safely in later passes

The stateful `server.js` Socket action executor, session lifecycle, and battle-turn scheduler remain together because extracting them requires careful integration testing of simultaneous actions, room reconnects, once-only rewards and save-write ordering. `public/game.js` still includes a large HUD/battle renderer and will need a dedicated UI extraction with DOM regression tests. This pass is **not** a claim that all architectural debt has been removed.

## Deployment advice

This branch is intended for staging first, not an automatic production swap. Verify the INDEX for mini-bosses (stages 4/9/14/19/24/29/34/39), normal encounters with 1–4 heroes, equipment purchase and old-save restores. Compare UI skill costs and cooldowns with actual mana used in combat. Only promote the tested branch deliberately; merge downstream draft branches in order rather than selecting `main` accidentally.
