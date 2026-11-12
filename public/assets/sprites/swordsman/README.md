# v0.31.1 Swordsman sprite assets

Place the following **binary PNG files** here (not SVG, not JSON):

- `male_idle.png` — 1152 × 256 pixels, 6 × 192 × 256 frames.
- `male_attack.png` — 1536 × 256 pixels, 8 × 192 × 256 frames.
- `female_idle.png` — 1152 × 256 pixels, 6 × 192 × 256 frames.
- `female_attack.png` — 1536 × 256 pixels, 8 × 192 × 256 frames.

The assistant produced these files in `SOULBOUND_v0.31.1_Sprites.zip` (provided as a ChatGPT download) but **could not upload the binary PNGs through the currently connected GitHub text-file integration**. The sprite player is installed in this branch and will automatically use the files when uploaded here.

Until a gender's *both* Idle and Attack PNG are available, the game shows its existing v0.30 SVG art, without breaking save data or combat.

Frame positions are ordered left-to-right; background fully transparent; no labels/headers in the PNG assets. ImageGen source artwork can contain frame inconsistencies: inspect the included contact sheet before deploying.
