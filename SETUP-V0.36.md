# SOULBOUND v0.36 — Curated Boss Drops & Cleaner Adventure Index

Branch: `v0.36-curated-boss-drops-wiki-layout`  
Base: `v0.35-adventure-index-wiki`

## Fixed — The boss item explosion

Previous v0.35 Wiki listed 360 dynamically generated boss item permutations (8 bosses × 9 slots × 5 rarity levels). This was misleading: now **every boss has exactly 2 unique, fixed-rarity possible equipment drops** (16 items across the whole campaign), each with a published chance. A boss performs **one independent percentage roll for each hero**, yielding either *one* of its 2 specific items or **no equipment**. Normal enemies drop no equipment.

| Boss / Stage | Drop A | Chance | Drop B | Chance | No drop |
|---|---|---:|---|---:|---:|
| Briarfang Alpha (3) | Briarfang Saber · Rare | 20% | Alpha Fang Ring · Uncommon | 35% | 45% |
| Dreadforge Champion (6) | Dreadforge Plate · Rare | 30% | Forgeguard Shield · Rare | 20% | 50% |
| Ember Tyrant (9) | Emberweave Staff · Epic (Mage) | 20% | Ashwalker Boots · Rare | 30% | 50% |
| Hollow Oracle (12) | Oracle's Eye Pendant · Epic | 28% | Diviner's Leggings · Rare | 25% | 47% |
| Glacier Warden (15) | Glacier Crown · Epic | 30% | Frozen Oath Ring · Epic | 20% | 50% |
| Ancient World-Eater (18) | World-Eater Carapace · Legendary | 12% | Ancient Stoneguard · Epic | 32% | 56% |
| Void Reaper (21) | Voidreaper Scythe · Legendary | 15% | Voidbound Amulet · Epic | 28% | 57% |
| Eclipse Sovereign (24) | Sovereign's Eclipse Blade · Legendary | 20% | Eclipse Royal Signet · Legendary | 12% | 68% |

All item stats are fixed by boss, equipment type and rarity. No item is generated at multiple rarity levels **as a new drop**. More difficult bosses offer rarer gear.

## Wiki and HUD improvements
- Wiki list now contains only the 16 actual boss-exclusive items, plus the existing **shop gear, foods and potions**. Old legacy loot varieties are not falsely advertised as still droppable.
- Each item detail states **drop percentage and source boss**, with a clickable **VIEW BOSS** button that opens the corresponding entry in the Bosses tab.
- Each boss detail lists **its exact two item drops and percentages**, each clickable to the item details; shows total no-drop chance.
- Index launch button is now a standalone full-width **📖 ADVENTURE INDEX** button immediately above **CHARACTER STATUS** in the left HUD column. It is no longer next to the Equipment & Bag button.
- The obsolete visible **EQUIPMENT · LOADOUT** and **HERO INVENTORY** HUD sections are **removed from the HTML**, not merely hidden by CSS.
- All bag and gear features are still accessed via **EQUIPMENT & BAG**. Camp Food controls have moved *inside* that same inventory dialog.
- Underlying game `myGear`, `inventorySummary`, `inventoryItems`, `foodInventory` DOM IDs remain alive (hidden or moved), so legacy update code keeps working.
- The character icon, sprites and battle scenery are not changed.

## Save compatibility
- Prior v0.34 boss loot still loads even if its old boss/slot/rarity combination no longer drops in v0.36.
- Prior item names such as `Ember Blade [EPIC]` are preserved where they match the old automatically generated formula; they are **not** silently renamed into new unique gear or restricted to another class.
- No Supabase schema, profile format, or existing battle turn rules changed.
- Bag maximum remains 40 loose items; equipped gear stays separate.

## Deployment and checks
1. Set Render deployment branch to `v0.36-curated-boss-drops-wiki-layout`. Leave `main` unchanged.
2. Once live, Ctrl+F5 on the game. Confirm bottom HUD only shows Quick Potions, Skills and Party info, not duplicated Inventory/Equipment panels.
3. Find the 📖 ADVENTURE INDEX button above Character Status, open the Wiki.
4. Open **Bosses > The Briarfang Alpha** and confirm 20% Rare Saber and 35% Uncommon Ring; click each drop to navigate to that item.
5. In the **Weapons** category click Briarfang Saber, then **VIEW BOSS**, and confirm navigation back to Briarfang's page.
6. Search for `Emberweave Staff` and ensure **Epic** only. Check final bosses offer Epic/Legendary loot, not Common gear.
7. Open Equipment & Bag, verify existing items (including any formerly random boss variants) remain present. Confirm Camp Food controls are available *inside the bag*.
8. Test a defeat of Stage 3 repeatedly; drop probabilities may give no loot, and successful drops must match one of the two listed items. Multiplayer participants roll separately.
9. Log out and Continue, confirming previous save and inventory.
10. Run `npm test` for local automated suites.

## Caveats
- This version updates item drop logic and Wiki navigation. It does **not** remove legitimate previously owned legacy gear, rework all shop inventory, or add new graphical assets.
- Live gameplay on Render and Supabase persistence must be verified manually; editing the GitHub feature branch is not a production deployment.
