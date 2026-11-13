# SOULBOUND v0.48 — City HUD, Dedicated Shops, Boss Drop Tables

Based on `v0.47-interactive-capital`. No image uploads required for this update; existing v0.47 pixel-art capital is reused.

## Changes
- When in **city, regionClear, defeat, or shop** state, remove the duplicate lower command dock and hero attribute HUD. The city image and its clickable shop/crystal hotspots remain; a compact **Bag** and conditional **Return to City** control stay available.
- Combat HUD is **not hidden** in battle. Party/Chat/Log remain the existing separate floating panel.
- Three interactive storefronts use the authoritative existing merchant and buy actions:
  - Weapon Shop: only `weapon` category.
  - Armor Shop: only `armor` category.
  - Supplies Shop: `potion` and `food` categories.
- The party leader chooses a storefront for the shared party merchant. All members can purchase with their own gold. The server validates the selected store on each purchase.
- **Each main boss:** 2–4 fixed possible gear templates. **Each mini-boss:** 1–2. Tables are fixed to each boss so players can target-farm a particular item; drops themselves are randomized per victory.
- Late bosses 6, 7 and 8: Epic/Legendary only.
- Independent rarity-based per-item rolls, multi-item wins, 40-slot inventory cap and existing gear/canonical save compatibility are retained.
- `/api/index` builds loot lists from those same loot tables, so Index counts/percentages match the actual server.

## Tests
GitHub Actions runs JS syntax checks and `npm test`; 59 tests passed at 43410524214.
Browser visual testing has not been completed against Render.

## Deployment
1. Render → Web Service `soulbound_online` → Settings → Branch.
2. Select `v0.48-city-shops-loot-balance` and save.
3. Auto Deploy or Manual Deploy → Deploy latest commit.
4. Refresh with Ctrl+F5.
5. In the city, verify lower HUD disappears while store hotspots + crystal and Bag still work.
6. Test Weapon, Armor and Supplies stores, and a party with multiple players.
7. Enter a dungeon; confirm combat HUD is restored and boss Index entries show new counts.

**Do not use this branch for production before verifying the real browser layout and inventory popup.**
