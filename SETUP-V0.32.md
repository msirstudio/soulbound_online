# SOULBOUND v0.32 — Unified Equipment & Inventory

Base: `v0.31.1-swordsman-sprite-animations` (all four v0.31.1 PNG sprite sheets retained).

## Delivered
- New **Equipment & Bag** button opens/closes a central overlay without permanently displaying the old inline Equipment/Inventory panels.
- Center character preview uses the existing v0.31.1 animated Swordsman sprites where available (or prior class art fallback).
- Nine visible locations: helmet, necklace, chest armor, pants, boots, main weapon, off-hand, left ring, right ring.
- Inventory grid supports mouse drag/drop to a compatible gear slot, **or tap an item then tap a slot** on touch devices.
- Only **main weapon** and **chest armor** currently have actual items and authoritative equip actions in this version; client always calls the existing `equipItem` server action for those slots. Other locations are honest placeholders until items, stat effects, and server rules are added in a future release.
- The server still prohibits gear changes during combat; the modal shows this restriction and does not bypass it.
- Improved desktop one-screen layout: game stays viewport-height, battleground shrinks at short screen heights, individual status/panels scroll internally instead of the whole HUD disappearing beneath the viewport. Narrow/mobile screens retain regular scrolling.
- Escape / outside-click closes the dialog, controls remain keyboard accessible.
- Retains all character creation, stats, battle, save, shop, audio and v0.31.1 image assets.

## Changed files
- Added `public/equipment-inventory-v032.js`
- Added `public/v032.css`
- Updated `public/index.html` (version, script/style includes)
- Updated `public/game.js` (live-state callback into new UI)
- Updated `package.json` (0.32.0)
- No change to `server.js` or Supabase schema/save code.

## How to test
1. Deploy the **feature branch** (not main) in Render, then Ctrl+F5.
2. Use a desktop window around 1440×900, 1600×900, and 1366×768. The entire combat HUD should occupy one browser viewport. Scroll *inside* longer Character Status panels; the page itself should not extend beneath the window.
3. Click Equipment & Bag; confirm it opens as an overlay and closes with X/Escape/outside-click.
4. Choose a hero who owns a purchased sword or armor. Drag a weapon to **Main Weapon**, chest armor to **Chest Armor**; after server approval the equipped label and ATK/DEF reflect the game state.
5. Try dropping armor into the sword slot: it should refuse. Try equipping during combat: should refuse.
6. Verify tapping an item then its matching slot works on touch devices.
7. Reconnect/reload: existing equipped stats, saves, inventory, and battle rules should be unchanged.
8. Mage/Tank, inventory/potions, skills, shop, party chat and v0.31.1 sprites should continue to function.

## Known limits
The six additional item types (helmet, pants, boots, necklace, rings, off-hand) do **not** exist in current game economy/equipment backend; showing a visual slot must **not** be confused with introducing items or stat bonuses. Separate slot-specific inventory items and server-side equip/unequip would be required. The character art may also show fixed armor, even if its equipment stats change (v0.31.1 sprites are baked, not layered gear). Runtime browser/Render tests have not been completed in this tool session.

The new branch is intentionally not merged or deployed to production automatically.
