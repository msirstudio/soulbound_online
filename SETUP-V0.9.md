# SOULBOUND Online v0.9 setup

## What changed
- Larger, clearer hero figures with weapon and armor appearance based on equipped items.
- Restored all six battle-scene backgrounds.
- Redrawn five regular monsters as larger creature illustrations.
- Party chat shared with everyone in the same room.
- Three stat points per level: STR, VIT, INT, AGI.
- AGI increases speed; faster monsters can take the opening strike.
- Skills now have turn-based cooldowns.
- New Game starts with database-safe HP/MP values.

## Required one-time Supabase update
This version stores the new character attributes in Supabase.

1. Open your Supabase project: https://supabase.com/dashboard/project/wyqzjptsyufcuxvvblml
2. Open **SQL Editor**.
3. Open `supabase-v0.9-upgrade.sql` in this GitHub branch.
4. Copy the entire SQL file into a new SQL query and click **Run**.
5. Do not paste your Supabase secret/service-role key anywhere.

The SQL adds the new stat columns and relaxes the old max HP/MP checks. It does not delete player profiles.

## Deploy
1. Open Render Dashboard: https://dashboard.render.com/
2. Select the `soulbound_online` service.
3. Open **Settings → Build & Deploy**.
4. Change the branch to `v0.9-visual-combat-party-chat`.
5. Save and deploy the latest commit.

## Test
1. Open the game and sign in or choose Guest.
2. Select **New Game**, then create a party.
3. Check that the scene background, hero weapon/armor, and monster illustration appear.
4. Start a battle; test chat with a second browser/device in the same room.
5. Level up and spend stat points. Try AGI to raise initiative.
6. Hover a skill to see its cooldown; use it and confirm the cooldown blocks reuse.

## Notes
- Party chat and battle rooms are live while the Render server process is running. Rooms are still in-memory and are cleared by server restarts/redeploys.
- This is an early prototype. The chat is room-only, not global or persistent.
- The branch is separate; `main` is unchanged.
