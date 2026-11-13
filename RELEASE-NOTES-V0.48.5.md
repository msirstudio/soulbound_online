# SOULBOUND v0.48.5 — Boss Reward Display Fix & Inventory Character Overview

## Fixed
- Main boss wins transition from battle to `regionClear`. The reward component formerly mounted on the hidden **Central City** DOM element for `regionClear`, so rewards weren't visible. It now mounts on the visible **battle arena** for both `victory` and `regionClear`.
- Reward UI computes GOLD, EXP (including level-up EXP consumption), and newly acquired equipment from the before/after **authoritative per-player** room snapshots; independent loot rolls and the server's loot tables are unchanged.
- On a boss defeat with no equipment won, the reward UI displays **"No equipment drop this time"**; it does not invent drops.
- Boss / mini-boss reward overlays remain on screen 6.5 seconds; other battle rewards 3.8 seconds.
- Regression tests simulate a main-boss win with 2 drops, level-up and no-drop cases, and verify reward rendering onto the arena rather than the hidden city.

## Inventory / Hero Overview
- Added a compact responsive Character Overview above the existing equipment paper doll and 40-slot inventory grid, preserving all Equip, Unequip and Discard logic.
- Hero identity: character name, main class, optional class specialization (or unlock info at Level 15), race/ancestry name, rarity, passive, bonuses.
- HP, MP and EXP progress bars with numeric current/maximum; current Level.
- Battle stats: ATK, DEF, SPD.
- Compact growth stats: STR, VIT, INT, AGI and unspent Stat Points.
- Gold, bag usage and Race Points.
- Uses existing player snapshot fields only; no save schema, stat formula, loot probabilities or combat mechanics modified.
- Resizes for smaller desktops and mobile; CSS is scoped to the inventory modal.

## Testing
- GitHub Actions validates JavaScript syntax and all existing/new regression tests. Tests include 2-item boss rewards, no-drop, normal/mini rewards, per-player attribution, and inventory data binding.
- Live browser layout and online party tests **not yet performed**; verify after deploying the test branch.

## How to deploy
1. Render `soulbound_online` → Settings → Branch → `v0.48.5-boss-rewards-character-overview` → Save Changes.
2. Auto Deploy or Manual Deploy → Deploy latest commit.
3. Once Live, press Ctrl+F5.
4. Inspect Equipment & Inventory: hero identity, real race/passive, class path, HP/MP/EXP meters, ATK/DEF/SPD and growth stats; test Equip/Unequip/Discard.
5. Kill main boss in any region (stage 5/10/.../40): look for Gold/EXP and item names or no-drop in the battle scene before opening the atlas.
6. If in a party, compare drops on different players; each player should receive only their own rolled gear.

**No asset uploads required. No schema or save reset.**
