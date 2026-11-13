# SOULBOUND v0.48.1 — HUD restore, shop close and boss-clear screen

Base branch: `v0.48-city-shops-loot-balance`.

## What changed

1. **Keep the lower HUD:** Restored the hero status panel, attributes, and command area beneath the pixel-art city. Removed the v0.48 CSS that incorrectly hid the main HUD in city/shop states. Existing battle HUD is unchanged.
2. **Shop is still in town:** Removed the city scene's redundant Return to City button. Clicking the merchant panel's X now sends `closeShop` for the party leader, rather than `returnCity`. The server changes shop status back to city **without resetting HP, MP, stage, selected region, inventory, or progress**. A non-leader can hide their merchant window locally. Shop selection remains validated server-side.
3. **Don't auto-display city after a region clear:** The main-boss win leaves the room in `regionClear`. Previously the client treated `regionClear` as a city state, so the battle scene disappeared immediately. Now the battle scene stays visible, with its victory status and normal HUD. Choose **World Map** in the command dock to select another region without resetting the party, or **Return to City** voluntarily.
4. Updated header, package, server health/API version and in-game Update Log to **0.48.1**.

## Important details

- Server-side boss drop tables and probabilities remain unchanged from v0.48.
- No database schema or save migration.
- Party leader still controls shared merchant entry/exit and region travel; other players buy with personal gold.
- Server has never automatically returned to city on boss clear: this patch corrects the client rendering that made it look as though the party had returned.
- CI syntax validation and 63 unit/regression tests passed; actual browser layout on Render remains to be checked.

## Deploy

1. Render → Web Service `soulbound_online` → Settings → Branch.
2. Choose `v0.48.1-hud-shop-clear-fix` and Save Changes.
3. If Auto Deploy is disabled: Manual Deploy → Deploy latest commit.
4. After Live, press Ctrl+F5 in the game.
5. Verify: HUD under city; open/close weapon/armor/supplies stores (no "Return to City" and no reset); beat any region main boss (remain in arena); use World Map to move on, or Return to City when you choose.
