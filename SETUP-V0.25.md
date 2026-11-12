# SOULBOUND v0.25 — Outer Frame & Ancestral Awakening

Base: `v0.24-ornate-hud-merchant-layout` (no changes to `main` or database).

## Changes
- Removed the original full-screen SVG ornament pseudo-layer that painted over the room bar and battlefield.
- Added `public/assets/ui/v25-side-vines.svg` and two non-interactive external side rails on the game container. These sit outside the arena and HUD rather than on top of them.
- Improved desktop fit at 100% browser zoom: less arena height, smaller inter-panel spacing and padding, shorter chat/log areas, and more visible Character Attributes controls. On lower resolutions the document may still scroll instead of clipping functional controls.
- Reworked the race summon scene with animated rotating magical rune circles, particles, energy rays, anticipation/convergence phases, and color-coded rarity reveals. This is **visual only**: the `rollRace` server API and loot rates are not modified.
- Added `public/v025.css`, included after the preceding stylesheets, and updated package and displayed version to 0.25.0.

## QA checklist
1. Change Render service branch to `v0.25-outer-frame-gacha`, deploy and hard-refresh (Ctrl+F5).
2. At zoom 100%, confirm gold side decorations stay outside the game interface and do not obscure the stage bar, battle text, or character panels.
3. Confirm Character Attributes and STR/VIT/INT/AGI buttons are visible, clickable and allocate points.
4. Use a Race Point: verify charge/spin/reveal animation and that SKIP only activates after the server returns the roll. Compare race/rarity and character results with the game state. Test the CLAIM & CLOSE button.
5. Open shop, buy and close; confirm shop item scrolling and equipment/inventory access.
6. Test a party, stage changes, new game, continue and account save.

## Verification limitations
JavaScript syntax, HTML structure and ID uniqueness, CSS braces, and presence of the asset were statically checked. The assistant has **not run a live browser screenshot test, Render deploy, multiplayer/save test, or real interactive Gacha purchase**. Do not merge to main until the actual version passes these tests.
