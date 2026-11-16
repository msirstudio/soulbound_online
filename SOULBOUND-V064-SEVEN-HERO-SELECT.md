# SOULBOUND v0.64 — Seven Hero Identities and Guild Select
Date: 2026-11-16 · Based on `v0.63-assassin-priest`.

## Confirmed implemented code
- Exactly seven class-independent identities: Corin, Seris, Lyra, Kaiya (Lyra's older sister), Aren, Vera, Noct. Four women and three men.
- Guild scene UI with seven responsive, keyboard-accessible hover/click regions. Hover highlights a hero; portrait bar is an alternative accessible entry point.
- Standalone character preview, biography and a popup offering **all six** classes (Swordsman, Mage, Tank, Archer, Assassin, Priest) to **all** seven identities.
- Reuses existing lobby, Save Slots (3), secure saves, guest saves, server room, party, and combat. No new `game.html`.
- `characterId` is distinct from `classId`, verified against server catalogue. Gender follows identity. Saved in secure JSON saves and guest/local save records. Legacy Supabase profile schema remains unchanged; when the secure-save backend is not configured, Slot 1 account identity fallback is stored in the browser and is **not** device-synced.
- Choosing a different character cancels a previous Continue selection, requiring an explicit New Game confirmation before a save can be overwritten.

## Dependencies still required before visual testing / deployment
The GitHub API text-file workflow was used to commit source code. Binary illustration assets are **not** committed to this branch yet.

Download `SOULBOUND_v064_Character_Select_Assets.zip` from the ChatGPT attachment in the conversation, extract and upload its `public/assets/character-select/` folder into exactly the same path on the `v0.64-seven-hero-character-select` branch:

```
public/assets/character-select/
  guild-hall.webp
  corin-portrait.webp   corin-full.webp
  seris-portrait.webp   seris-full.webp
  lyra-portrait.webp    lyra-full.webp
  kaiya-portrait.webp   kaiya-full.webp
  aren-portrait.webp    aren-full.webp
  vera-portrait.webp    vera-full.webp
  noct-portrait.webp    noct-full.webp
  manifest.json
  guild-hall-original.png  # optional editing master
```

Use GitHub > branch dropdown > `v0.64-seven-hero-character-select` > `public/assets` > Add file > Upload files > drag the extracted `character-select` folder > Commit changes **to this branch**.

## QA
GitHub Actions `v064-seven-hero-select.yml`: **233 / 233** automated tests pass, including existing combat, save, shop, 6-class and 7-identity regressions. Automatic tests do not prove real Render/Supabase compatibility, visual artwork correctness or mouse hotspot alignment. Those must be checked after assets upload on staging.

## Staging acceptance
1. Login and Guest flows still reach the title menu and eventually the Guild screen; no page scroll at 100% zoom.
2. Exactly 7 characters, each hotspot matches the person under cursor; mouse and keyboard/roster selection open the same popup.
3. Every character can pick all six classes. First create a new Save Slot; afterward Continue returns the correct saved identity, stats and class.
4. Character name, gender and portrait remain associated with the correct identity; save-slot switching cannot overwrite another slot.
5. Create/join a 2- to 4-player room; ensure all clients see chosen identities (server `characterId`) and battle actions remain functional.
6. Account mode with secure saves stores identity cross-device; legacy account without secure saves requires separate follow-up database migration for cross-device character identity.
7. No production merge/deploy without manual testing.

## Related future proposal
Armor categories: Heavy (Swordsman/Tank), Medium (Archer/Assassin), Light (Mage/Priest). Equipment enhancement (+1..+10 proposed) remains **design only**, not implemented in v0.64. All stats and costs should be server-authoritative, transaction-safe, and subject to multiplayer/boss balance.
