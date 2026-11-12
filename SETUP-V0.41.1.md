# SOULBOUND v0.41.1 — UI Fix Pass + Reward Floats

**Branch:** `v0.41.1-ui-fix-reward-floats`  
**Base:** `v0.41-ui-foundation`  
**Status:** Code committed to GitHub. Not deployed or merged into `main`.

## Fixed from the three provided screenshots

1. **PARTY / CHAT / LOG:** The panel now docks as a **real column next to the main HUD**, never covering/dimming the scene and never using a click-blocking fullscreen backdrop. The selected tab stays visible until closed or another tab is chosen. The game, combat buttons and equipment remain clickable. On narrower screens the panel flows below the HUD rather than overlapping it.
2. **Adventure Index:** Moved the floating Index shortcut from the far left edge into the same game header as the other tabs (`📖 INDEX`). Its existing encyclopedia dialog still opens normally.
3. **Main Menu spoiler:** Removed the final boss image completely from the title screen. The new artwork is a **non-spoiler fantasy landscape**, using the existing `assets/scenes/living-wilds.svg` asset and CSS scenery.
4. **SOULBOUND logo:** Single-line title with fluid font size, smaller letter spacing and responsive layout. The previously oversized duplicate masthead logo on the Account/Hero pages is hidden, rather than letting it spill outside the header.
5. **Hero & Party overflow:** Content panels expand to actual height, grow wider on desktop, wrap long descriptions safely, and make the room-code input/button flex inside their column. Smaller screen layouts switch to one column.
6. **Responsive battle layout:** The Party/Chat/Log dock consumes its own layout width on large screens; on short/narrow screens it appears below the combat UI without obscuring the battle scene.

## New: lightweight reward floats

When a player **actually kills an enemy** and the server announces the transition from `battle` to `victory` or `regionClear`, a small floating stack appears near the monster. On a regional main boss clear (where v0.40 switches to the Central City view), it appears near the city card instead.

- Gold gained: e.g. `🪙 +45 GOLD`
- Actual XP gained: e.g. `✦ +130 EXP` (correct even when a player levels up)
- Newly acquired equipment in the player's own inventory: e.g. `◆ Briarfang Saber`
- Boss victory with no collected new equipment: `No equipment drop this time`
- Fade and float away automatically after approximately 3 seconds, with a reduced-motion fallback.
- No alerts, no dialog, no dark overlay, no interruption of inputs.
- Derived from **two consecutive authoritative server room-state snapshots** and compared by the current player's ID. No random drops or stat increments are performed client-side.
- Does not replay notices on reconnect, when state is re-rendered, on defeat, or on an unchanged victory state.
- A player only sees loot that is actually in their own inventory. Other party members' equipment is not displayed as their loot.

## Changed files

- `public/index.html`: replace spoiler illustration; load stylesheet and reward script; version label.
- `public/ui-foundation-v041.js`: no longer creates a fullscreen drawer scrim.
- `public/v0411.css`: layout fixes, no-blur dock, responsive logo/hero input, scenic title and reward animations.
- `public/adventure-index-v035.js`: anchor the shortcut to the in-game header toolbar.
- `public/reward-float-v0411.js`: reward delta detection and temporary text float.
- `public/game.js`: one optional call after the existing state render to show confirmed rewards.
- `tests/v0411.test.js`: regressions for per-player loot, correct XP, no duplicate notices, no backdrop and non-spoiler title.
- `package.json`: version 0.41.1.

**No changes to:** `server.js`, `world-v040.js`, `loot-v034.js`, Supabase SQL or multiplayer combat rules.

## How to test

1. Deploy the branch to a **test Render service** or temporarily select `v0.41.1-ui-fix-reward-floats` as the branch in Render, then hard refresh with Ctrl+F5.
2. Main Menu: confirm there is no final boss art and the SOULBOUND logo stays one line at desktop / phone widths.
3. Hero & Party: confirm Room Code, Join, and lengthy text stay inside their frames.
4. Create a party, open Party / Chat / Log: each should remain visible while the fight stays **bright and clickable**. The panel must not block ATTACK. Reclick to close.
5. Confirm `📖 INDEX` appears in the header rather than being stranded at the left side of the page.
6. Defeat a regular monster: GOLD and EXP should rise near the monster and fade. No equipment appears unless actually acquired.
7. Defeat a Main Boss: GOLD / EXP / actual equipment (or explicit no-drop) should appear. Check Adventure Index and bag for consistency.
8. Win a battle with another party member: your reward popup must **never claim their item**.
9. Resize to e.g. 1366×768 and 1920×1080, and use Thai UI to check line wrapping.
10. Run `npm test` from a local repo checkout.

## Verification limitations

The commit passed static JavaScript syntax checks, screenshot-relevant source assertions, and a simulated reward-delta walkthrough. Live browser layout, full Node test suite, real Render/Supabase and 2–4 player end-to-end tests **are not yet independently verified**. A direct CLI clone for running the full suite was attempted but unavailable because the execution container could not resolve github.com.

**Do not merge to `main` or replace the live deployment before visually testing the updated UI and running the project test suite.**
