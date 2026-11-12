# SOULBOUND Online v0.30 — Character Creation & Pixel Hero Foundation

**Branch:** `v0.30-character-creation-pixel-heroes`, based on `v0.29-compact-hud-combat-audio`.

## Implemented in code
- Three existing playable classes (Swordsman, Mage, Tank) shown as selectable illustrated class cards in the hero-creation panel.
- Male / female choice and a live hero preview for all **six class + gender** combinations.
- Brand-new original layered SVG illustrations in `public/hero-art-v030.js`. The sprite-style hero includes separate hair, face, armor, cloak, leg/boot and weapon details. Appearance changes with selected armor and weapon categories in live battle and multiplayer.
- Basic idle bob / breathing and short attack anticipation-and-follow-through effects. These are CSS transforms of individual hero drawings, **not** hand-drawn or generated multi-frame spritesheets.
- The server validates and retains gender during a multiplayer session, sends it to all clients in the normal game state, and restores from the client-provided appearance value.
- The user's gender choice is persisted in this browser's local storage for the account / guest profile, without changing any existing Supabase columns. Old heroes default to male until they select a different appearance. **Gender is not synchronized to a new browser/device through Supabase** in this release.
- Previous v0.29 HUD, soundtrack, EXP bar, equipment, merchant, class specialization, battle rules and profile save fields are retained.

## About the generated art — important distinction

Two ImageGen *concept artworks* for the character creation page were generated as visual direction. Their image files were **not installed as functional sprite assets** in this GitHub branch, because they are complete UI mockups, not properly aligned individual sprites or layered animation frames. The *actual in-game characters* in this release are original code-generated, crisp-edge vector/pixel-style drawings; their detail is lower than the AI high-resolution screenshot illustrations. A next art production phase should prepare real transparent RGBA PNG/WebP spritesheets with consistent camera angle, canvas size, animation frames, gender and equipment alignment, then replace the SVG renderer.

## How to deploy
1. In Render select `v0.30-character-creation-pixel-heroes` manually and deploy; do not merge into main until testing.
2. Hard-refresh at 100% browser zoom.
3. In the hero menu choose Swordsman/Mage/Tank and Male/Female, verify the preview updates and old hero saves are still available. Continue should keep level/gold/items.
4. Create or join a party; verify other players see correct class/gender, and both idle and attack animations play.
5. Equip different weapons / armor, confirm visible color and silhouette differences.
6. Reopen the page / sign in to verify gender choice persisted in the *same browser*. Test a separate browser and note that gender is not cloud-synced yet.
7. Exercise Equipment/Inventory, class specialization, potion use, merchant and server restore.

## Verification
Static JavaScript syntax, HTML tags and duplicate IDs, CSS braces, and execution of all six new graphics data URIs have been checked. No Render deployment, browser screenshot testing, shared-party test, or external device test was performed. The character-animation implementation is an initial functional foundation, not the finished high-detail sprite animation system requested for the long-term roadmap.
