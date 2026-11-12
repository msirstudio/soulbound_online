# SOULBOUND Online v0.23 — Biome Art & Traveling Merchant Fix

## Branch
`v0.23-biome-art-merchant-fix` is based on `v0.22-viewport-living-scene`.
This version does **not** update `main` or change Supabase schema.

## Six environment themes (24 stages)

| Stages | Server scene class | Installed fallback background |
|---|---|---|
| 1–4 | `wilds` | existing layered Cursed Wilds SVG and particle/water animation |
| 5–8 | `ruins` | `assets/scenes/v23-ruins.svg` |
| 9–12 | `cavern` | `assets/scenes/v23-cavern.svg` |
| 13–16 | `frost` | `assets/scenes/v23-frost.svg` |
| 17–20 | `abyss` | `assets/scenes/v23-abyss.svg` |
| 21–24 | `castle` | `assets/scenes/v23-castle.svg` |

The backend already maps these classes with `sceneFor(stage)` every four stages, so no backend rewrite is required. `public/v023.css` sets explicit images for each, loaded *after* `style.css` and `v022.css`, to fix the blank later-stage background.

## High-quality ImageGen optional replacements

Two independent original landscape images have been generated (without HUD or characters), but **the rendered image binaries were not transferred through the GitHub text-file connector**. For them to appear in the live game, upload these filenames to the branch's `public/assets/scenes/` folder:

- `ai-wilds.webp` — Stages 1–4
- `ai-ruins.webp` — Stages 5–8

The corresponding images are available as a separate downloadable art package in ChatGPT. When a filename exists, the CSS displays it over the installed fallback without any JavaScript edits. Unuploaded files fall through to the SVG art. There are currently no ImageGen WebP replacements for the other four zones; they use installed SVG art.

## Merchant fix

- When the room enters shop state, `#shopPanel` displays as a scrollable, **fixed merchant window** inside the viewport, instead of below chat where the item grid was cut off.
- `SHOP` appears in the command dock during shop state, and can reopen the merchant after **CLOSE**.
- Category selection, buy buttons, currency checks, and server `buyItem` actions remain unchanged.
- ESC closes the shop window; purchases continue to update normally during shop state.

## Testing on Render

1. In Render, set the service branch to `v0.23-biome-art-merchant-fix`, save and deploy. Refresh browser using Ctrl+F5.
2. At 100% zoom, check stage 1 then stage 5, 9, 13, 17 and 21 have **different backgrounds**. The server switches biome every four stages; stage 5 is Ruins.
3. At the stage 4 merchant, confirm Shop opens in a floating panel and all item categories and buttons can be scrolled. Click CLOSE, then reopen using SHOP in the dock.
4. Complete battles, use the equipment/inventory drawers, buy gear and potions, and advance out of the merchant.
5. Check with two players in a party, plus guest and Supabase-linked saves.

## Validation and caveats

JavaScript syntax and DOM identifiers can be checked from the repository, but the assistant has **not** run a real-browser/Render, multiplayer, or purchasing integration test here. The shop remains secure through existing server-authoritative purchasing. The SVG zones are independent original scenery assets with subtle CSS particles; the full high-detail AI rasters require the separate upload described above.
