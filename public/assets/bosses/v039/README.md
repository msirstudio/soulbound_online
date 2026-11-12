# SOULBOUND v0.39 Boss Sprites — Asset Upload Folder

Upload 16 PNG files from `SOULBOUND_v0.39_BossSprites_READY.zip` into this folder on the `v0.39-boss-two-state-sprites` branch.

| Stage | Boss | Asset prefix |
|---:|---|---|
| 3 | The Briarfang Alpha | `briarfang_alpha` |
| 6 | Dreadforge Champion | `dreadforge_champion` |
| 9 | Ember Tyrant | `ember_tyrant` |
| 12 | The Hollow Oracle | `hollow_oracle` |
| 15 | Glacier Warden | `glacier_warden` |
| 18 | Ancient World-Eater | `ancient_world_eater` |
| 21 | The Void Reaper | `void_reaper` |
| 24 | Eclipse Sovereign | `eclipse_sovereign` |

Each prefix requires **two** files, `<prefix>_normal.png` and `<prefix>_hit.png`, each with a transparent 640×640 canvas. Game logic located in `public/boss-sprites-v039.js` only activates the PNGs when *both* images for the stage load. Otherwise the original SVG boss remains visible.

These source designs use new original character concepts inspired by the user's requested fantasy monster categories (forest beast, knight, dragon, occult oracle, ice serpent, brutal warlord, void sorceress, eclipse angel), without reusing externally watermarked asset files.

**Assets need to be uploaded manually to GitHub**, since the code connector here can commit UTF-8 source files but cannot transfer the locally generated binary image files. Uploading the ZIP itself is insufficient: extract it and upload the PNGs at these paths.
