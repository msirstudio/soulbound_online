# SOULBOUND v0.41 — UI Foundation

**Branch:** \`v0.41-ui-foundation\`  
**Base:** \`v0.40-a-new-world\`  
**Scope:** visual layout and navigation only; no changes to combat, Supabase schema, items, loot percentages, level gates or Socket.IO game rules.

## New Main Menu

- A dedicated **SOULBOUND** start screen with a clear Play / Continue action, Hero & Party, Account, and functional Settings buttons.
- Original **Normal** boss sprite is used as a backdrop accent; if the asset fails to load, CSS scenery remains legible.
- Play and Hero & Party take an existing logged-in user to character setup; otherwise to the existing account login/guest flow.
- Session recovery leaves players on the Main Menu (does **not** silently enter a battle).
- Account flow still uses the existing Supabase auth and Guest mode; there is no second authentication or save implementation.

## Hero & Party

- Character setup and the existing 3 classes / 2 gender choices remain functional.
- Grouped character details and preview separately from **Continue / New Game** and **Create / Join Party** in a two-column desktop layout.
- The two save buttons preserve their original behavior: Continue restores the existing hero, New Game asks before resetting stats.
- Room code and multiplayer flow are unchanged.

## Central City / World Map

- v0.40 Central City receives a consistent palette, larger action targets, and a clearer city panel.
- The existing clickable World Atlas is preserved (8 locations with map pins, level previews, mini/main bosses, replay/entry).
- All travel restrictions remain checked **server-side** (LV 10 can enter map 2 but not map 3; every party member must meet the region level gate).

## Battle UI

- Existing arena and character art retained; content redistributed for readability.
- The stage track uses the existing **five-stage region** progress strip.
- Hero/attributes, Battle Skills and Potions each occupy a clear HUD column on large screens.
- **Party**, **Chat**, and **Battle Log** are now opened from three toolbar buttons into a single slide-out panel, rather than permanently reducing the battlefield area.
- The Chat input, party state and log remain driven by the original Socket.IO event handlers. Buttons open the existing content; no duplicate chat handler or log source.
- On smaller screens, the HUD stacks rather than clipping controls. Some scrolling on very narrow screens is unavoidable.
- Equipment & Bag continues to be managed by the existing dialog.

## Design architecture

- \`public/v041.css\` is loaded **after** earlier style sheets. It defines shared design tokens and carefully scoped view/layout overrides, plus reduced-motion and keyboard focus styles.
- \`public/ui-foundation-v041.js\` owns only screen navigation, Settings view, and Party/Chat/Log drawer visibility.
- \`public/game.js\` has small optional calls into this presentation layer, following the existing auth, game-entry and render flow.
- \`public/index.html\` organizes menus and layout while **retaining all older element IDs** to preserve game event handlers.
- \`public/i18n-v038.js\` includes translations for the new labels.

**Important:** v0.41 is a *first transition layer*, **not** an aggressive deletion of the old 20+ CSS files. Deleting those now would risk regressions in battle popups and inventory. Consolidation should happen in a dedicated cleanup pass after browser screenshots and device QA.

## How to try

1. Keep \`main\` untouched and use a test deployment of \`v0.41-ui-foundation\` (or temporarily switch Render to this branch when ready to test).
2. If v0.40 cloud progress migration hasn't already been run, use \`supabase-migration-v0.40.sql\` in Supabase SQL Editor. **v0.41 requires no additional SQL.**
3. Hard refresh the page with Ctrl+F5.
4. Check the menu, Account login, Guest mode, Hero & Party, Continue and New Game.
5. Create or join a room. The Central City should appear.
6. Check World Atlas map pins, all eight previews, the LV 10 / map 2 rule, replay and Party level lock.
7. In battle, click **Party**, **Chat**, **Log** independently and close with the toolbar, Close button, backdrop or Escape key.
8. Verify chat messages send, the log updates and battle skills remain clickable.
9. Inspect at desktop 1920×1080 or 1366×768 and smaller browser widths, including the Thai/English toggle.
10. Sign out, reload and sign in to confirm the same world progress, items and hero are restored.

## Checks done

- Source files parse as JavaScript, and an interactive fake-DOM simulation verified Menu → Account → Hero lobby, game entry, Settings and side-panel open/close interactions.
- HTML nesting and script load order verified. Source inspection confirmed save and boss systems are still using the v0.40 model.
- **Not yet verified:** actual browser rendering on Render, device-specific CSS, end-to-end sign-in, Supabase persistence or live multiplayer. No claim is made that deployment is complete.

## Files

- \`public/ui-foundation-v041.js\` — screen navigation, Settings, Party/Chat/Log drawer.
- \`public/v041.css\` — tokens, Main Menu, Account/Hero, City/World, responsive battle and drawer.
- \`public/index.html\` — new sections and toolbar.
- \`public/game.js\` — optional UI hooks on authentication, loaded character, room join and state changes.
- \`public/i18n-v038.js\` — language labels.
- \`tests/v041.test.js\` — navigation, interaction and integration invariants.

## Known limits / future updates

- Full original map paintings, new monster pixel art, combat effects, player movement inside the city and complete CSS bundling are **not** part of v0.41.
- The old CSS files remain intentionally loaded until browser QA confirms the new layout.
- This branch was committed, **not merged into main and not deployed by the assistant**.
