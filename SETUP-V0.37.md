# SOULBOUND v0.37 — Curated Boss Loot & Wiki Cleanup

Branch: `v0.37-curated-boss-loot-wiki-cleanup`  
Base: v0.35 Adventure Index (no v0.36 branch exists in the repository).  
No deployment or main-branch merge was performed.

## What changed

1. Bosses drop **only 2 predetermined items each**, and **each item has exactly one rarity**. There are **16 boss-drop templates** total (previously 360). The same item no longer appears in five rarity variants in the Wiki.
2. Each boss victory makes one independent roll **per party member**. The roll may yield one of that boss's items or **nothing**. This preserves per-player rewards without generating extra equipment.
3. The Wiki lists the **actual item-specific drop percentages**, clickable boss rewards, and a **clickable source boss** from every boss item.
4. The Adventure Index button is separated from Equipment & Bag and floats on the left side of the screen (bottom-left on small screens).
5. The redundant **Hero Inventory** HUD panel is hidden. Equipment & Bag remains the single place to inspect/manage gear. **Camp Food** controls move to Quick Potions so food can still be consumed.
6. Previously owned items, including old v0.34 loot variants, are **not deleted or converted**. They remain available in saved inventory and can still be equipped; only **new** boss drops follow the curated tables.
7. No changes to combat damage, saved profile schema, player turn order or character progression.

## Curated boss drop table

All listed chances are absolute per-player per-kill percentages; the remaining probability is **no item**.

| Boss stage | Item A | Chance | Item B | Chance | No drop |
|---|---|---:|---|---:|---:|
| 3 | Briarfang Blade — Rare | 12% | Briarfang Ring — Uncommon | 38% | 50% |
| 6 | Dreadforge Armor — Uncommon | 35% | Dreadforge Boots — Rare | 20% | 45% |
| 9 | Ember Staff — Epic | 12% | Ember Amulet — Rare | 32% | 56% |
| 12 | Hollow Helm — Rare | 35% | Hollow Guard — Epic | 18% | 47% |
| 15 | Glacier Greaves — Epic | 25% | Glacier Ring — Rare | 38% | 37% |
| 18 | World-Eater Staff — Epic | 30% | World-Eater Amulet — Legendary | 7% | 63% |
| 21 | Void Armor — Legendary | 12% | Void Boots — Epic | 32% | 56% |
| 24 | Eclipse Blade — Legendary | 18% | Eclipse Ring — Legendary | 12% | 70% |

**Important:** no guarantee of a drop; repeated kills may give no gear. No random equipment drops from regular monsters.

## Testing completed

- Parsed JavaScript source for server, loot engine, Wiki and test suites.
- Executed the Wiki API in an isolated JS environment and verified **8 bosses, 16 fixed-rarity boss drops, 24 stage records, 3 food entries**.
- Simulated RNG boundaries for stage 3: 0–12% sword, 12–50% ring, 50–100% no drop.
- Verified new source-link and boss-to-item navigation handlers are present.
- Confirmed CSS syntax balance and food control relocation code.

**Not yet tested:** a real Render deployment, interactive browser behavior, persistent Supabase saves and mobile drag/drop. Test the branch before merging into main.

## Deployment

In Render, set the branch to `v0.37-curated-boss-loot-wiki-cleanup`, deploy and hard-refresh (Ctrl+F5). Enter a game and check the independent floating Wiki button, missing duplicate Hero Inventory panel, and food controls inside Quick Potions.

Test stage 3: the Wiki should show only Briarfang Blade [RARE] at 12% and Briarfang Ring [UNCOMMON] at 38%. Click an item to view its details, then click the source boss to return to the boss page. Confirm that gear previously acquired from older versions is still in Equipment & Bag.
