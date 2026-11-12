# SOULBOUND v0.39 — Boss Normal / Damage Images

Based on **v0.38-thai-english-language**, preserving Thai/English UI, v0.37 loot/Wiki changes and all earlier saves and multiplayer rules.

## Implemented code
- All eight original game boss stages map to an original **Normal + Hit** image pair.
- When the **server-reported monster HP decreases**, the existing browser battle renderer changes to `_hit.png` for **540 milliseconds**, then returns to `_normal.png`. A later hit restarts the damage display; healing, re-rendering, stage changes or normal enemies do not trigger the hit pose.
- Images are preloaded and **both files have to load** before the boss replaces its old SVG. If either is missing, the boss remains on its original SVG, without breaking gameplay.
- Boss images are transparent 640×640 PNG and scale to fit the arena while retaining pixel edges.
- The Adventure Index boss profile also uses the boss's Normal PNG when present, falling back to the prior SVG.
- Files: `public/boss-sprites-v039.js`, `public/v039.css`, modified `public/game.js`, `public/index.html`, `public/adventure-index-v035.js`, package version and regression tests.
- **No server.js changes, Supabase migration, save changes, item/loot changes or combat rule changes.**

## Asset installation

The 16 files were prepared in a separate downloadable archive: **SOULBOUND_v0.39_BossSprites_READY.zip**.
Extract the ZIP. The archive already contains:

`public/assets/bosses/v039/`

with 16 exact PNG names (two for each boss) and a manifest. Upload the PNG files into the same GitHub folder on **v0.39-boss-two-state-sprites** using Add file → Upload files, and commit.

Important: **The image files are not in the GitHub branch yet.** The GitHub connector here can modify source files but cannot transfer these locally generated binary PNGs. Until uploaded, the game will keep showing the old SVG bosses. Do not upload the ZIP without extracting it.

| Stage | Boss | Normal | Hit |
|---:|---|---|---|
| 3 | The Briarfang Alpha | briarfang_alpha_normal.png | briarfang_alpha_hit.png |
| 6 | Dreadforge Champion | dreadforge_champion_normal.png | dreadforge_champion_hit.png |
| 9 | Ember Tyrant | ember_tyrant_normal.png | ember_tyrant_hit.png |
| 12 | The Hollow Oracle | hollow_oracle_normal.png | hollow_oracle_hit.png |
| 15 | Glacier Warden | glacier_warden_normal.png | glacier_warden_hit.png |
| 18 | Ancient World-Eater | ancient_world_eater_normal.png | ancient_world_eater_hit.png |
| 21 | The Void Reaper | void_reaper_normal.png | void_reaper_hit.png |
| 24 | Eclipse Sovereign | eclipse_sovereign_normal.png | eclipse_sovereign_hit.png |

The art identities for stage 18 and 21 are original concept variations: a hulking fortress warlord and a void sorceress respectively; their in-game names and stats remain unchanged.

## Quick testing
1. Upload all 16 PNGs to the feature branch. Check at least one PNG opens directly on GitHub.
2. Deploy **v0.39-boss-two-state-sprites** on Render. Hard-refresh with Ctrl+F5.
3. Go to stage 3, where the Briarfang Alpha now has a detailed transparent pink forest beast sprite.
4. Deal damage: should briefly show the hurt/rearing pose, then return to normal automatically.
5. Open Adventure Index → Bosses → Briarfang Alpha: normal art should appear there.
6. Test a regular monster: it should remain on its original SVG.
7. Remove or rename one PNG only in a *test* branch to confirm SVG fallback.
8. Verify damage numbers, turn order, loot, equipment, multiplayer and save remain unchanged.

## Checks and limitations
- The new sprite module parses as valid JavaScript, includes a fallback for absent PNGs and has test coverage in `tests/v039.test.js`.
- Direct scripted simulation confirmed normal→hit→normal on damage; healing did not trigger the hit pose.
- Image files verified locally: 8 normal + 8 hit RGBA PNGs at 640×640.
- **Live Render testing has not been completed, and the assets are not yet in GitHub.**
