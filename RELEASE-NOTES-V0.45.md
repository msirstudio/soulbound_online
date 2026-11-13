# SOULBOUND v0.45 — Independent Rarity Drops and Update Log

## Implemented
- Each listed loot item is rolled **independently** per player after a main-boss or mini-boss kill.
- Each item has a **fixed rarity-dependent drop chance**:
  - Common: 30–40%
  - Uncommon: 20–30%
  - Rare: 10–20%
  - Epic: 6–10%
  - Legendary: 1–5%
- **Multiple distinct items can drop** from a single encounter, even all listed items if lucky. No global one-item limit. Ordinary enemies remain unchanged and drop no randomized equipment.
- Inventory bag cap of 40 unequipped pieces still applies; if a roll succeeds with a full bag, the missing item is logged.
- Item collection history is preserved in existing progress data, and the Index records display their actual per-item chance.
- The victory reward popup supports multi-item rewards.
- Added an **UPDATE LOG** button to the title menu with current and previous update summaries. Future releases should add an entry to the top of `public/update-log-v045.js`.
- Fixed prominent title-page and header version text to **v0.45**.

## Important
- Multi-drop affects encounter loot generation, not the item rarity roll. The rarity is a property of each predefined item in the encounter pool; each item independently checks its own rarity chance.
- Drop chances shown are per individual item, not the sum of the whole pool and not a guarantee for a certain number of victories.
- Other systems (combat, party scaling, Supabase schema, old inventory saves and map artwork) are intentionally unchanged.
- Branch is for review: **v0.45-independent-loot-changelog**, based on v0.44.
- Render must be switched to this branch, or merged/deployed intentionally, for the new client + server rules to take effect.
- CI runs Node syntax verification and the full test suite. Browser usability and live Render have not been validated yet.

## Test scenarios
1. Kill boss on stage 5 with two free slots; verify a lucky multiple drop does not exceed bag capacity.
2. Check Index for boss stage 5: every item has its own percentage.
3. Obtain multiple items, exit and restore a character; confirm all have unique UIDs and remain in bag.
4. Open Update Log in title menu and check v0.45 appears in the header.
5. Play a party of 2–4 and ensure each player's rolls are independent.
