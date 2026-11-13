# SOULBOUND v0.46 — Generated Pixel-Art World Map (PNG)

**Status: Source code ready; the generated raster image must be uploaded before this branch is deployed.**

This branch intentionally removes the hand-drawn SVG world atlas. It uses an actual generated pixel-art **PNG** of the connected continent. All map markers and travel actions remain separate, interactive HTML elements.

## One required image file

- Relative repository path: `public/assets/world/world-map-v046.png`
- Format: PNG (not SVG)
- Dimensions: **1448 × 1086**
- Source: latest image generated in the ChatGPT discussion (the continent with a safe city, forest, ice, old titan, sanctum, forge, lava, abyss and eclipse).

Because the connected GitHub write action is text-only, that generated binary image is not included in the branch automatically. **Do not deploy this branch until the image is uploaded to the path above.**

To upload:
1. Download `world-map-v046.png` from the ChatGPT conversation.
2. Open `https://github.com/msirstudio/soulbound_online/upload/v0.46-generated-pixel-map/public/assets/world`.
3. Drag the PNG into the GitHub uploader and click **Commit changes**. No other manual edits are needed.
4. Confirm `https://github.com/msirstudio/soulbound_online/blob/v0.46-generated-pixel-map/public/assets/world/world-map-v046.png` opens the pixel-art map (not SVG).
5. GitHub Actions verifies the PNG signature/dimensions and the rest of the game tests.
6. In Render → soulbound_online → Settings → Branch, switch to `v0.46-generated-pixel-map`; deploy the newest commit and press Ctrl+F5.

The 8 clickable pins and central safe-city pin are positioned for the image's actual geography. The right-hand region preview uses existing battle backgrounds.
