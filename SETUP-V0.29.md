# SOULBOUND v0.29 — Compact HUD + tuned weapon SFX

Branch: `v0.29-compact-hud-combat-audio`, based on `v0.28-recorded-audio-exp-arena`. Neither `main` nor the Render deployment has been changed automatically.

## Implemented
- Keeps the main v0.28 battle illustration large, while compacting its lower HUD: status, EXP, ancestry, attribute buttons, skills, equipment, potions, inventory, party chat and battle log. Slightly shorter arena only for short screens (up to ~20–40px on typical 768px-high desktop).
- Uses more of the desktop screen width (up to 1600px) with less wasted space.
- Optimizes vertical padding, line height, skill/button sizes and panel heights; EXP and all gameplay data remain available.
- Modifies the *recorded* weapon effects, not the server combat mechanics: sword attack plays consistent recorded slice; heavy and staff each play a more appropriate clip; hit uses a light impact and no longer randomly plays strong metallic clangs for every swing. Preloads commonly used CC0 assets on a user interaction, reducing playback latency.
- No change to database/save schema, server.js, accounts, stage progression, equipment APIs or multiplayer logic.

## Test
1. In Render manually select `v0.29-compact-hud-combat-audio`, deploy and reload with Ctrl+F5.
2. At browser zoom 100%, verify Character Attributes buttons, Inventory/Equipment, EXP bar, skill icons and battle log fit in the available viewport. Responsive designs will still scroll on particularly small/short displays rather than hiding controls.
3. Compare v0.28 vs v0.29 battle art at stage 1: the scene should remain approximately the same height except on small-height viewports.
4. Test sword, staff and heavy attack SFX while the music is playing. Confirm game audio remains an external file stream; sound depends on source availability and network playback.
5. Verify class-choice popup, merchant, online party, save/Continue.

Static validation: game and audio JavaScript parse successfully; no duplicate HTML ids or malformed tags; CSS braces balanced. No live Render/browser testing or real audio listening performed. All original v0.28 asset licensing notes remain in `CREDITS-V0.28.md`.
