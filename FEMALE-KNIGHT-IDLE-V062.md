# SOULBOUND v0.62 · Female Knight Idle Animation

## Installed
The existing sprite renderer now supports **Female Swordsman Idle**, driven from one transparent **2048×256 PNG** with eight **256×256** frame cells. The animation runs at **8 FPS** (125 ms per frame), loops continuously and keeps the foot baseline constant.

- Asset: `public/assets/hero-animations/female_swordsman_idle_8f.png`
- Config: `public/assets/hero-animations/manifest.json`
- Renderer: `public/sprite-animation-v0311.js`
- Art-only CSS: `public/v062-female-idle.css`
- Cache revision: `0.62.1` (game release continues to be 0.62)

The transparent, palette-optimized PNG contains eight frame cells, based on the previously approved, **feet-locked** Female Knight Idle sheet. For a seamless breathing loop it uses a symmetric frame sequence `[0,1,2,3,2,1,0,1]` (four distinct upper-body phases; all eight positions exist). **Foot and leg pixels from Y=192 through Y=255 are identical across all frames**, confirmed in GitHub Actions using the real committed PNG.

## When it plays
- **Female Swordsman, Idle:** animated PNG at 8 FPS, both in hero preview and in the battle scene.
- **Female Swordsman, Attack/Hit:** unchanged, original PNG poses.
- **Male Swordsman, Mage, Archer, Tank:** unchanged visuals.
- Missing or invalid animation PNG automatically falls back to the previous hero image.
- **No server combat, save, database, stat or network changes.**

## Replace image later
To change art without touching combat, replace the PNG at exactly the same path. Keep eight 256×256 cells horizontally, 2048×256 total, transparent pixels, body fixed to the same ground point (X=128, Y=232), and the lower 64 rows identical in every frame. Use PNG, not a renamed GIF. Update the asset query version in `public/sprite-animation-v0311.js` if the new image is cached.

Attack, hit and death animations can later get their own independent sprite-sheet entries. The currently installed idle character has a fixed sword and armor appearance; equipment-dependent sprite variants are not yet supported.

## Verify / Deploy
1. Deploy branch `v0.62-female-knight-idle` to a staging or Render service (do not assume it is already live).
2. Hard-refresh with Ctrl+F5, select **Swordsman · Female**, check both character preview and battle.
3. Confirm Idle cycles every 125ms, no foot-slide; attack and hit temporarily replace Idle and return afterward.
4. Check male and mage remain unchanged; check old saved inventory.
5. For rollback, redeploy branch `v0.62-archer-class`. No save migration is required.

CI checks the real PNG header, alpha, eight equal-size cells, per-pixel lower-body alignment, and runtime Idle/Attack/Hit transitions.
