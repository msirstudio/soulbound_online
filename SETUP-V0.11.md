# SOULBOUND Online v0.11 setup

Branch: `v0.11-class-passives-clean-ui`

## What changed

- Compact desktop-first battle layout: the large title header is hidden while playing, the battle arena is shorter, and party/chat/log use a compact side column.
- Character stats and specialization are grouped into compact panels.
- Battle skills, health/mana potions, and equipment now have separate windows.
- Weapon and armor have separate equipped-item cards with hover details.
- Hover over either level-5 specialization choice to see its permanent stat bonuses and passive effect. The selected path's passive is also displayed in the character panel.
- Added tank weapon progression: Iron Mace (Lv 1), Warhammer (Lv 3), Titan Maul (Lv 8).
- Implemented the class passives in combat:
  - Berserker — 10% more damage at or below 50% HP.
  - Knight — takes 10% less damage.
  - Archmage — damaging skills deal 10% more damage.
  - Warlock — each damaging skill restores 5% Max MP.
  - Guardian — takes 12% less damage.
  - Paladin — each damaging skill restores 5% Max HP.

## Database

No new database columns are required for v0.11. It uses the existing `class_path` and potion columns added in v0.10.

If v0.10 migration has not been run yet, run these in order in Supabase SQL Editor:
1. `supabase-v0.9-upgrade.sql`
2. `supabase-v0.10-upgrade.sql`

## Deploy to Render

1. Open the Render dashboard and select the `soulbound_online` service.
2. Open Settings → Build & Deploy.
3. Change the branch to `v0.11-class-passives-clean-ui`.
4. Save and deploy.

Do not change the production branch unless you intend to publish this version.

## Verification

JavaScript syntax, DOM ID references, and UI structure should be checked before deployment. A real browser, mobile layout, live Supabase save, and multiplayer battle test are still required.
