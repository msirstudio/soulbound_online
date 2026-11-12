# SOULBOUND Online — v0.22 (Viewport HUD + Living Wilderness)

This branch starts from v0.21; it does not change the database or combat protocol.

## What changed

- Rebuilt the game HUD markup into three independent vertical stacks: character/status, skills/equipment, potions/inventory. The sidebar remains party/chat and battle log.
- Moved START ADVENTURE, NEXT STAGE, VISIT MERCHANT, EQUIPMENT and INVENTORY into a dedicated sticky action dock **immediately below the battle scene**, so a tall information panel cannot push these controls below the page fold.
- Added `public/v022.css`, loaded after the existing stylesheet. This is a deliberately clean override rather than another set of negative-margin panel offsets.
- The Cursed Wilds now uses six separate SVG layers (sky, clouds, landscape, river-wave animation, tree trunk/foreground, and swaying blossoms), plus animated petals. Assets live in `public/assets/scenes/v22-*.svg`. Other stage scene classes keep their existing assets.
- Equipment and Inventory buttons open readable overlay panels. Escape or clicking outside closes an overlay.
- `prefers-reduced-motion` disables decorative motion.

## Testing checklist after Render deploy

1. Switch **Settings → Branch** to `v0.22-viewport-living-scene`. Save and allow a deploy, then open the game and press Ctrl+F5.
2. At **100% zoom** check that the main action dock (START/NEXT/SHOP + EQUIPMENT/INVENTORY) is visible immediately below the battle scene on a 1366×768 or larger desktop browser. On shorter screens the rest of the page may scroll; the action dock remains sticky.
3. Verify Character Status, Race Summon, level 5 specialization, potion usage, the inventory item list, party chat and battle log.
4. Click EQUIPMENT and INVENTORY. Verify their modal surfaces open and close on Escape/outside click. No gear should disappear or be unequipped.
5. Start a game, finish a battle, advance a stage, visit a merchant and test two players in a party. Recheck save/load.
6. Look for cloud drift, blossom sway, water sheen and falling petals on **The Cursed Wilds**. With system reduced-motion enabled, the background should become static.

## Release scope / limitations

This is a code and asset integration update. A live Render/browser, mobile layout, save/load and multiplayer test has **not** been run by the assistant. The hand-authored, layered SVG scene is not the same as a high-detail AI-generated raster background; it is the functional layered prototype and can be upgraded to painted sprite layers later. No new SQL migration is needed.
