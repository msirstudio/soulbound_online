# SOULBOUND v0.63 — Assassin & Priest (six classes)

**Base:** `v0.62-foundation-single-source`; deployed game is unchanged until a deliberate Render branch switch or merge.

## New classes

| Stat / function | Assassin | Priest |
|---|---|---|
| Base HP | 120 | 145 |
| Base MP | 58 | 90 |
| ATK | 26 | 18 |
| DEF | 7 | 10 |
| Speed | 14 | 10 |
| Starter gear | Training Daggers / Rogue Tunic | Novice Scepter / Pilgrim Robe |
| Style | 13% critical chance at 1.30×, weaken / expose / execute | Light damage, single/all-target heal, cleanse and party wards |

### Levels and effects

| Unlock | Assassin | Priest |
|---|---|---|
| Lv1 | Shadow Cut — physical | Holy Bolt — Light |
| Lv3 | Blade Dance — AoE | Mending Prayer — heal lowest-HP living ally for 24% Max HP (max 115) |
| Lv5 | Crippling Strike — weaken next enemy hit | Radiant Wave — Light AoE |
| Lv5 | Expose Weakness — brief vulnerability | Purify — remove ailments and heal 8% (max 50) |
| Lv7 | Smoke Step — Void damage, defensive cover | Benediction — heal all living allies 12% Max HP each (max 75 per ally) |
| Lv8 | Execution — bonus below 40% HP, capped at 45 | Sanctuary — 25% party damage reduction for two enemy turns |
| Lv9 | Nightfall — single target Void | Judgment — single target Light |

**Balance:** Priest support skills have 0 damage and do **not** fire weapon on-hit passives or AoE damage. Healing excludes fallen players; revives still occur through the existing victory system. Assassin crit and execution bonuses are capped. Neither class bypasses existing MP, level, cooldown, action ID or turn validation. Four-player parties remain the same maximum size.

### Source of truth

- `classes/assassin-v063.js`, `classes/priest-v063.js` — exact starter stats and skill definitions, with pure utility effects.
- `combat/skills.js` and `combat-v055.js` — server validates **class-specific** cost/unlock/cooldown and elemental damage.
- `server.js` — live Socket actions, HP/MP mutations, crits, buffs, rewards and restore.
- `combat/public-skill-catalog-v062.js` — class skill book sent to each client and read-only INDEX (38 entries across six classes).
- `items/dual-class-shop-v063.js`, `data/game-catalog-v062.js` — new class-only weapons in the real merchant and INDEX.
- `persistence/secure-saves-v057.js` — allow new class IDs and correct starter fields without SQL migrations.
- `public/index.html`, `public/game.js`, `public/hero-art-v030.js`, `public/v063-classes.css` — six-class UI, local guest starter, temporary class-differentiated SVG art.
- `tests/v063-six-classes.test.js`, `tests/v063-socket-integration.test.js` — class stats, server validators, heal caps, boss/party safety, real Socket actions and equipment tests.

## Deferred (not claimed complete)

- Existing seven approved **character identities / independent appearance selection** are not implemented in this v0.63 update; it still uses class and gender for provisional UI art.
- Assassin and Priest have seven functional skills each, but no subclass specialization paths at Lv15 yet, and no final pixel-art/idle sprites.
- Multiplayer stress testing and manual visual checks on a staging Render instance must be done before switching production.
- New save records are backward-compatible by class ID and starter stats; no cloud save rows were deleted as part of this update.
