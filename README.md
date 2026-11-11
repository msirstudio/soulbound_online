# SOULBOUND Online v0.5

A browser-based co-op turn-based RPG with a 24-stage campaign, persistent heroes, eight distinct bosses and original pixel-style artwork.

## v0.5 updates
- Eight individually designed boss SVG sprites with separate silhouettes, palettes, armor details and visual effects.
- Additional regular monster sprites for Grave Beetle, Cursed Knight and Wisp Stalker.
- Continue restores the signed-in hero's saved level, XP, gold, class, equipment and supplies.
- New Game resets that account's hero to level 1 with the selected class and starting equipment.
- Continue locks the class selector so saved character stats and gear are not accidentally overwritten.
- Keeps the existing 24-stage co-op campaign and Supabase account system.

## Run locally
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Configure `public/config.js` with the Supabase project URL and public anon/publishable key.
4. Run `npm start`.
5. Open `http://localhost:3000`.

Never put a Supabase service-role key in browser code.

## Deployment
See [SETUP-V0.5.md](SETUP-V0.5.md). The v0.5 work is on branch `v0.5-boss-roster-newgame`; it does not change `main` automatically.
