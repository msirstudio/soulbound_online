# SOULBOUND v0.24 — Ornate Realm UI

**Branch:** `v0.24-ornate-hud-merchant-layout` (based on `v0.23-biome-art-merchant-fix`).

## What actually changed on GitHub

- The Traveling Merchant DOM element (`#shopPanel`) was moved outside the Battle Log sidebar to a direct child of `#game`. This eliminates the nested sidebar clipping and stacking-context conflict in v0.23.
- The shop is a separately scrollable, high-z-index fixed window, with a sticky CLOSE button and item category navigation. Existing category switching, buy handlers and server-side validation remain unchanged.
- The battlefield has a taller responsive viewport and keeps the source background's aspect ratio (`cover`). Oversized art may still crop at the edges rather than distort. If exact full-art display is needed, art must be authored to match the game's wide battle viewport.
- Added an original decorative vector asset `public/assets/ui/v24-filigree.svg` and `public/v024.css` for gilded foliage corners, dark ornamented outer space, fantasy headers, panel edges, premium buttons and a clearer action dock.
- Existing art layers, image uploads, rain/petals, 6 biomes, gameplay logic and database schema are carried over from v0.23.
- The version string is set to v0.24 in the header and package.

## Deploy & test

1. In Render, switch branch to `v0.24-ornate-hud-merchant-layout` and deploy. Do not merge into main until testing succeeds.
2. Hard refresh with Ctrl+F5 and use browser zoom 100%.
3. At stage 4 merchant, open shop, scroll to the last item, change WEAPONS / ARMOR / POTIONS / FOOD, buy an eligible item, close and reopen with SHOP. Check that the command dock does not draw in front of the shop.
4. Check stage 5 onward for separate biome backgrounds and battle viewport cropping. Use the viewport at multiple desktop window sizes.
5. Test inventory/equipment popups, character attributes, class skills, party chat, player saves and multiplayer.

## Important caveat

This is a code and CSS implementation, **not** a browser-verified Render deployment. It does not upload new ImageGen screenshots, because screenshots containing UI should never be used as a live HUD/background asset. The detailed AI wilds/ruins backdrops, if already uploaded as `ai-wilds.webp` and `ai-ruins.webp`, are retained unchanged.
