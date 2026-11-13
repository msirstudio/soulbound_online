# SOULBOUND v0.46 — Generated Pixel-Art World Map

## Ready in GitHub — no manual image upload required

The game now uses the actual image generated in the ChatGPT conversation, converted from the original PNG to a high-quality **raster WebP**. It is **not an SVG**. The main artwork has no burned-in UI labels; eight interactive HTML pins and a Central Safe City pin are positioned on top.

**Uploaded artwork:** `public/assets/world/world-map-v046.webp`
**Image size:** 1448 × 1086 pixels (4:3), generated pixel-art continent.

**Branch:** `v0.46-generated-pixel-map`

### How to play
1. Open Render Dashboard → `soulbound_online` → Settings → Branch.
2. Select `v0.46-generated-pixel-map`, save and deploy latest commit.
3. Wait until status is **Live**, then refresh game with **Ctrl+F5**.
4. Enter a party → Central City → World Map.
5. Click one of eight pins. All travel restrictions and party leadership rules remain unchanged.

The original programmatic map SVG was removed from this branch. The right-side preview uses the real arena background art per region. All image assets are already inside GitHub; no PNG upload, ZIP extraction, or CSS copy/paste is required.

GitHub Actions checks the WebP file signature and native dimensions plus JavaScript syntax and tests. Browser visuals should still be checked on the actual target display.
