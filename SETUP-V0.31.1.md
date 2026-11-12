# SOULBOUND v0.31.1 — Frame-based Swordsman Animation

**Branch:** `v0.31.1-swordsman-sprite-animations` from `v0.30-character-creation-pixel-heroes`.

## What is already installed in GitHub
- `public/sprite-animation-v0311.js`: a real per-frame horizontal sprite-sheet player with 6-frame Idle (7 FPS, looping) and 8-frame Attack (12 FPS, non-looping) for male/female Swordsman.
- `public/v0311.css`: sizing at natural 3:4 aspect ratio; transparent animation overlays and fallbacks.
- `public/game.js`: uses sprite art only for Swordsman. Mage/Tank keep prior appearance; attacking calls the existing server action exactly as before.
- `public/index.html`: loads the animation engine before game.js; updates version.
- `public/assets/sprites/swordsman/manifest.json`: frames, dimensions, filenames.
- Existing v0.30 SVG fallback remains for **missing PNGs**, so deployment before uploading does not break character display.

## What is NOT uploaded to GitHub
The FOUR binary PNG sprite sheets are packaged in the ChatGPT download **SOULBOUND_v0.31.1_Sprites.zip**. GitHub text tools don't carry binary PNG files directly, so **the sprite engine is in the branch, but sprites are not in the branch** until these four files are added.

Upload these exact files into `public/assets/sprites/swordsman/` on the branch:

| File | Dimensions | Frames |
|---|---|---|
| male_idle.png | 1152 × 256 | 6 × (192 × 256) |
| male_attack.png | 1536 × 256 | 8 × (192 × 256) |
| female_idle.png | 1152 × 256 | 6 × (192 × 256) |
| female_attack.png | 1536 × 256 | 8 × (192 × 256) |

Do not upload the ZIP itself, or put the files in the root `public` folder. They must be extracted as .png files and uploaded into the folder above.

## Steps to install
1. Download `SOULBOUND_v0.31.1_Sprites.zip` from the ChatGPT answer and extract.
2. On GitHub select branch `v0.31.1-swordsman-sprite-animations`.
3. Browse to `public/assets/sprites/swordsman/` (README and manifest are already there).
4. Click **Add file → Upload files**. Drag the four PNGs from the extracted ZIP; click **Commit changes** to the **same branch**.
5. In Render manually switch to the same branch, deploy, then Ctrl+F5. Do not merge to main automatically.

## Testing
- At 100% zoom choose Swordsman female/male in Character Creation: preview should play 6 actual sprite frames.
- Create or continue a Swordsman and enter battle. Idle loops; an attack plays 8 different frames.
- Check character feet grounding, sword arcs, performance, PNG transparency, and that all party members still appear.
- Equip armor; the v0.30 gear-dependent SVG visuals will no longer be represented by the fixed Swordsman sprite sheets. Equipment *stats and saves* remain unchanged. Frame-specific equipment art requires a later separate overlay/rigged sprite upgrade.
- Try missing or renamed PNGs; v0.30 SVG fallback must show.
- Verify no regressions in Mage/Tank, saved games, party, chat, shop, gacha, skill damage or levels.

## Artwork QA / caveat
The AI generated coherent 6-frame Idle sheets with transparent backgrounds. The Attack frames were cropped from a separately generated AI atlas and the grayscale/white checkerboard was removed programmatically. These are **genuine 8 different illustrated poses**, not a CSS translation of one image. However they have remaining inconsistencies: the female Attack atlas has a lighter/blonder hair color than the female Idle atlas, and some Attack frames have imperfect cropping/details. The files are suitable for a prototype / playtest, not yet artist-quality production finalization. All sprite slots were verified non-empty, alpha transparent and adjacent frames distinct. An animation QA pass in a browser is still necessary.

## Runtime verification
JavaScript parsed in static checks. No screenshot test, live Render deployment, multiplayer session, or Supabase persistence test was performed. Only GitHub branch files above were modified. No server.js or database schemas were changed in this release.
