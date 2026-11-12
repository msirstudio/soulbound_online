# SOULBOUND v0.26.1b — Combat Audio & Level 5 Popup Hotfix

Branch: `v0.26.1b-audio-specialization-hotfix` based on `v0.26.1-audio-loadout-fix`.

## Changed
- Upgraded sword combat into layered blade swipe, metal edge and impact transients; blunt attacks and spells also have stronger differentiated sounds.
- Raised sound effect loudness and the default master volume. Added Web Audio dynamics compressor to reduce overlapping volume spikes. Lowered music mix level relative to SFX.
- Added **⚙ AUDIO** in the game header. It opens a popover with independent Music and SFX volume sliders and a TEST ATTACK button. Existing title-menu controls and SFX on/off remain connected.
- At player Level 5 (if the player still has no class specialization), the specialization panel is now a centered dialog with two choices, **LATER** dismissal and an **✦ CHOOSE SPECIALIZATION** button in Character Status for reopening.
- Character Attributes now remains in its own unchanged panel and is no longer pushed down by specialization choices.
- Actual specialization effects, rates, progression, inventory, player profile, multiplayer, database, and server-side `chooseClassPath` endpoint were NOT modified.

## Deploy safely
1. In Render Settings, select branch `v0.26.1b-audio-specialization-hotfix` and deploy. Leave `main` unchanged.
2. Refresh the game with `Ctrl + F5` and test at 100% zoom.
3. In battle, click ⚙ AUDIO, adjust the SFX/music sliders and press TEST ATTACK. Compare normal sword, mage and tank attacks and the sound of hit effects.
4. Reach Level 5 with a non-specialized character. The dialog should open, allow LATER dismissal, and reopen from Character Status. Choose a specialization and verify it is persisted after reload, using the existing save system.
5. Test Equipment/Inventory and gear switching, an online party, merchants and the next stage to guard against regressions.

## Limitations
This is a static-code-checked hotfix; the assistant has not listened to the actual audio output in the browser, performed UI end-to-end tests, deployed Render, or tested Supabase saves and multiplayer. Sounds are synthesized via Web Audio and will not match professionally recorded sword impacts exactly.
