# SOULBOUND Online v0.5 — Boss Art & Save Slots

## What's new
- Eight unique boss sprites in `public/assets/bosses/`.
- New regular enemy sprites in `public/assets/monsters/`.
- Continue loads the current saved hero.
- New Game resets the current account's hero profile to level 1 and starting gear.
- Continue locks the class selector to prevent accidental changes to the saved hero.

## Deploy this version
1. Open your Render dashboard.
2. Select the `soulbound_online` web service.
3. Open **Settings** and find **Build & Deploy** / **Branch**.
4. Change the connected branch to `v0.5-boss-roster-newgame`.
5. Save the setting. Render should deploy the branch automatically.
6. Wait for the deploy to finish, then open your existing game URL.

## How the save buttons work
- **Continue**: restores the saved hero's class, level, XP, gold, stats, equipment and potions.
- **New Game**: asks for confirmation, then replaces the current account's hero save with a fresh level-1 hero. This reset cannot be undone.
- The account itself is not deleted.
- Each player in a co-op party controls their own save and must choose their own mode.
- A newly created party starts at campaign stage 1. Continue preserves hero progression, not a previous room's campaign stage.

## Supabase
The game uses the existing Supabase project and `profiles` table from v0.2/v0.3. No new migration is required by this version. Keep the public anon/publishable key in `public/config.js`; never expose a service-role key in browser code.

## Notes
The eight boss images are original SVG pixel-style artwork generated from vector shapes and palette layers. They are directly usable by the game and do not depend on the image-generation service.
