# SOULBOUND v0.33 — Clean Equipment Layout

Branch: `v0.33-clean-equipment-layout` (based on `v0.32-equipment-inventory-modal-responsive-hud`).

- Removed the **second Inventory button entirely from HTML**; only **Equipment & Bag** remains in the HUD.
- Removed legacy v0.26.1 click handlers that opened inline gear panels, preventing event conflicts.
- Equipment modal groups the slots consistently:
  - **Left / ARMOR:** Helmet → Chest Armor → Pants → Boots.
  - **Right / WEAPONS & ACCESSORIES:** Main Weapon → Off-hand → Necklace → Left Ring → Right Ring.
  - **Center:** animated hero and basic stats.
- Maintains existing modal drag/drop, keyboard/touch selection, and compact combat HUD.
- Only Main Weapon and Chest Armor currently equip via the existing server `equipItem` command; the other slots are UI placeholders until server-side inventory/equip rules are introduced.
- No changes to Supabase saves, `server.js`, battle mechanics or sprite assets.

## Deploy
Select `v0.33-clean-equipment-layout` as Render branch, deploy, hard refresh (Ctrl+F5). Test both idle and combat HUD and open Equipment & Bag. Check desktop and mobile sizes.

## QA
JavaScript syntax and CSS brace checks passed; source code confirms exactly one loadout button in HTML and correct column positioning for all 9 slots. Real browser rendering and live deployment are not independently verified in this run.
