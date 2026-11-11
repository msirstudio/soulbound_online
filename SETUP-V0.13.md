# SOULBOUND Online v0.13 setup

Branch: `v0.13-viewport-auth-shop-fix`

## What changed

- The Hero Account panel is hidden after a player enters the game and returns when leaving back to the landing screen.
- Desktop battle UI now uses the full available browser viewport instead of the old 1080px content width.
- Rebuilt the in-game layout into a responsive grid with independent panel sizing; panels are not forced to share the same height.
- Desktop layout is sized against viewport width and height. On smaller screens, it switches to a normal stacked page rather than squeezing the interface.
- The merchant opens on Weapons by default. Weapons, Armor, Potions, and Food are separate tabs; the combined ALL tab was removed.
- Existing v0.12 inventory, equipment swapping, and three food buffs are retained.

## Database

No new Supabase migration is introduced by v0.13. The inventory and food fields still depend on the v0.12 migration if signed-in profile saves use those features. Guest saves remain browser-local.

## Deploy to Render

1. Open Render Dashboard → `soulbound_online`.
2. Settings → Build & Deploy.
3. Change Branch to `v0.13-viewport-auth-shop-fix`.
4. Save and deploy.

Do not change the production branch unless you intend to publish this version.

## Verification

JavaScript syntax and DOM wiring should be checked after commit. A live browser test at the user's actual screen resolution, Render deployment, Supabase save, and multiplayer gameplay test have not been performed by this update.
