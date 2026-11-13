# SOULBOUND v0.44 — Rare Loot, Party Difficulty & Collection UI

Built on **v0.43-miniboss-art**. No existing save tables or progression are removed.

## Included
- **Bosses:** 1–4 different potential gear rewards per boss; total item-drop chance per clear is **6–14%**, not a guaranteed bundle.
- **Mini-bosses:** 1–2 different potential gear rewards each; total drop chance **3–8%**.
- Each player gets one independent roll per boss/mini-boss victory, **maximum one item**, and usually none. Bag full (40 unequipped items) prevents collecting drops.
- Group difficulty increases HP and ATK as the party grows from 1 to 4. Bosses have increased baseline difficulty even solo; stage rewards are unchanged.
- Adventure INDEX includes 10 bloodlines (rarity, rates, passives, buffs), mini-boss drop tables and **green discovered** entries.
- Discovered drop IDs / racial IDs are tracked in the existing `world_progress` JSON and in the existing guest/browser progress cache. Items owned before the update are backfilled when the character restores.
- Inventory shows 40 bag cells, class/level compatibility coloring, direct **EQUIP / UNEQUIP** controls, drag-and-drop and larger HP/MP/ATK/DEF/SPD/Level stats. Legacy bags larger than 40 remain visible.
- PARTY / CHAT / LOG use a single floating panel. Where there's no external gutter, the panel is confined to the battle-scene area to avoid covering the lower HUD.

## Compatibility notes
- Pre-v0.44 items already in the bag, equipped gear, class specialization, races and world progress are retained.
- Items **discarded before v0.44** cannot be reconstructed from an old save. Their acquired history begins once an item is observed or newly obtained.
- Cloud discovery sync uses the existing `world_progress` column from v0.40. If that migration is missing, the game falls back to a **browser-local progress cache**; cloud discovery sync requires v0.40 SQL to be installed.
- Items can only be equipped/unequipped outside active battles; mismatched-class and locked-level items remain visible but are not wearable.

## Verify before production rollout
1. `npm install` then `npm test` (44 tests) and `node --check server.js`.
2. Start a new/old character and verify bag + INDEX; discard a new item then re-open Index to see discovered marker.
3. Confirm each of the 8 mini-bosses and main bosses has correct stage-specific drop pool; inspect 1-player and 4-player HP/ATK.
4. Check party/chat/log at 1920×1080, 1366×768, and narrower windows; only one panel should open and the lower HUD should remain usable.
5. Save, exit, reload from Supabase or guest mode; verify acquired histories and equipment.
6. Compare old save gear stats before/after equipping to catch unwanted stat changes.

## Deployment
Render currently tracks branch `v0.43-miniboss-art`. To test v0.44 on Render, switch its **Settings → Branch** to **`v0.44-loot-inventory-index-hud`** and deploy the latest commit. Do **not** upload ZIP or merge into old `main`.
