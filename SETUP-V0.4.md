# SOULBOUND Online v0.4 — Pixel Art & Adventure Audio

## What's new
- Six original pixel-art biome backgrounds (Cursed Wilds, Fallen Kingdom, Ember Caverns, Frostbound Pass, The Void, Eclipse Citadel).
- Original pixel-art hero sprites for Swordsman and Mage.
- Pixel-art monster sprites for wolf, goblin, and large boss/dragon encounters.
- Original synthesized chiptune adventure loop and sound effects for attacks, skills, healing, guarding, boss encounters, victory, defeat, and shop actions.
- Music is OFF by default. Press **♫ MUSIC: OFF** once in the game to enable it. Browsers require a click before audio can start.
- No new Supabase migration is required. Existing v0.3 profiles and database columns remain unchanged.

## Deploy
1. Open Render and select the existing `soulbound_online` service.
2. In Settings, change Branch to `v0.4-pixel-art-audio`.
3. Save changes and wait for the deploy to become Live.
4. Open the game and press Ctrl+Shift+R to refresh cached files.
5. Sign in with the same account as before and test a battle. Turn music on with the music button.

## Notes
- This version adds visual and audio assets only; it does not alter character progression or Supabase data.
- Audio is generated in the browser using Web Audio API; it does not download external music or sound files.
- If a sound is not audible, check browser tab/site volume and click the music toggle once.
