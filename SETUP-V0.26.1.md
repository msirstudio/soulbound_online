# SOULBOUND Online v0.26.1 — Audio & Loadout Bug Fix

Branch: `v0.26.1-audio-loadout-fix` from `v0.25-outer-frame-gacha`. No changes to `main`, server.js, database schema, save-game schema or battle rules.

## Changes

- Rebuilt `public/audio.js` with original browser-generated Web Audio sounds:
  - Weapon-aware basic attacks: sword slicing, mace/hammer impact, staff magic.
  - Skill, guard, damage impact, health potion healing, mana, buying/menu clicks, boss, victory and defeat.
  - Procedurally synthesized soundtrack with distinct melodies/modes for Cursed Wilds, Fallen Kingdom, Ember Caverns, Frostbound Pass, The Void and Eclipse Citadel.
  - Combat mood changes melody accents. Music/SFX buses are independent for volume, with a shared master. No licensed music, external files or streaming requests.
- Sound selectors: Music Volume and SFX sliders on title screen; quick SFX on/off in the in-game topbar. Existing Music button kept.
- Equipment/Inventory: removed the previous behavior that displayed a fullscreen blurred black overlay. Buttons now highlight and scroll to their *existing in-page panels*. Items and equip handlers remain untouched. Escape clears focus.
- Added `public/v0261.css` last in the CSS chain to explicitly turn off the old backdrop and modal positioning while preserving existing panels.
- Version displayed and `package.json` set to 0.26.1.

## Deployment

In Render service settings, select branch `v0.26.1-audio-loadout-fix`, save and deploy. Then hard refresh with Ctrl+F5. Do not merge to main until manually tested.

## QA checklist

1. Open Equipment and Inventory in the game. No dark blurred overlay should appear. Their current HUD panel should receive a gold border and the page should scroll to it if necessary.
2. In the title menu adjust MUSIC and SFX sliders. In-game SFX ON/OFF toggles sound effects without muting music.
3. Confirm distinctive sword, blunt weapon, mage, guarding and healing SFX. Test with unlocked gear. Audio may start only after clicking due to browser autoplay policies.
4. Enter the six biomes (stages 1, 5, 9, 13, 17, 21), with music enabled. Confirm soundtrack character changes while music continues.
5. Confirm equipment change, merchant purchases, race summon, player save/restore, party chat and two-player battles have not regressed.
6. Try with muted SFX and disabled music, then resume.

## Technical verification and limits

JavaScript syntax and HTML structure were checked, but live Render, actual hardware audio output, multiplayer, and browser click tests are **not yet verified**. The soundtrack and effects are original *synthesized Web Audio*, not professionally recorded audio files; mixing and tuning may be further refined after listening.
