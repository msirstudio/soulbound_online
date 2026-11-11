# SOULBOUND Online v0.12 setup

Branch: `v0.12-inventory-shop-ui`

## What changed

- Reworked the desktop game layout to use the full available screen width and height.
- Removed the old fixed-height feeling: each panel now has its own natural height and the desktop dashboard uses a compact grid.
- On supported desktop screens (1000px+ wide and 720px+ high), the game view is designed to fit the viewport without page-level vertical scrolling. Smaller screens keep a normal responsive page layout.
- Merchant categories are separated into All, Weapons, Armor, Potions, and Food.
- Purchased weapons and armor go into the hero inventory instead of being equipped automatically.
- Inventory has Equip actions; equipping a weapon or armor swaps its stat bonuses instead of stacking bonuses.
- Added three foods:
  - Dragonpepper Roast — +15% damage for the next 3 attacks.
  - Guardian Herb Stew — reduce the next 3 incoming hits by 20%.
  - Moonberry Tart — restore 30% Max MP and boost the next 3 skills by 10%.
- Food can be consumed during the player's battle turn. Remaining food and gear inventory are included in profile saves.

## Supabase migration (required for signed-in profile saves)

Run `supabase-v0.12-upgrade.sql` once in Supabase Dashboard → SQL Editor → New query → Run.

This adds JSONB columns for inventory, equipped-item stat records, and food counts. Guest mode stores these in the browser and does not need the SQL migration.

## Deploy to Render

1. Open Render Dashboard → `soulbound_online`.
2. Settings → Build & Deploy.
3. Change Branch to `v0.12-inventory-shop-ui`.
4. Save and deploy.

Do not change the production branch unless you intend to publish this version.

## Verification

The branch was checked for JavaScript syntax and key UI/feature wiring. A live browser layout test, Supabase migration run, and multiplayer gameplay test are still required before treating the release as fully verified.
