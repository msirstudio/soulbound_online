# SOULBOUND v0.46 — Connected Continent World Atlas

## Implemented directly on GitHub
- `public/assets/world/world-map-v046.webp`: rasterized 1448×1086 generated Pixel Art world map (converted from the image produced in ChatGPT). No SVG.
- `public/world-ui-v040.js`: replaces the old symmetric two-polygon SVG, places all eight interactive region pins on matching landscapes, adds Central Safe City clickable pin.
- `public/v046-atlas.css`: responsive map layout and REAL pre-existing battle background images in the right-side region detail panel.
- Header, menu, package and update log now say v0.46.
- Keeps all server-side travel, player level gates, boss defeat records, saved inventories and combat mechanics unchanged.

## Region positions
1. Cursed Wilds — western forest
2. Dreadforge Bastion — south-central forge citadel
3. Ember Caverns — southeastern volcanic mountain
4. Hollow Sanctum — southwest ancient temple
5. Frostbound Peaks — northern snowy chain
6. Titanfall Ruins — northwest giant statue ruins
7. Abyssal Rift — eastern purple chasm
8. Eclipse Throne — northeast eclipse sanctuary
Central Safe City — center of main continent (click closes atlas and returns to the safe hub context).

## How to play it on Render
1. Open Render Dashboard → your Web Service `soulbound_online`.
2. Open **Settings → Branch**.
3. Select **v0.46-organic-world-atlas** and Save Changes.
4. Allow Auto Deploy (if enabled) or choose **Manual Deploy → Deploy latest commit**.
5. After the service shows **Live**, open the game and press Ctrl+F5.
6. Enter your hero/party → Central City → **WORLD MAP · เลือกแมพ**.
7. Click each of the eight pins to check actual region scenic preview, minimum level, bosses and travel.

No image upload or manual CSS edits are required when deploying this branch.
Note: GitHub CI validates SVG XML, source syntax, and regression tests, but actual browser layout must still be checked at your screen size. This is a source-code artwork, not a rendered image-generation screenshot.

## Raster artwork integration
The `v0.46-generated-pixel-map` branch contains the actual generated art file at `public/assets/world/world-map-v046.webp`; no manual upload is necessary. This file replaces the earlier SVG atlas on that branch.
