# SOULBOUND Online v0.10 setup

Branch: `v0.10-medieval-fantasy-ui-music`

## Supabase migration

If this project has already run the v0.9 upgrade, run `supabase-v0.10-upgrade.sql` once in Supabase Dashboard → SQL Editor → New query.

This adds the saved class specialization and the six potion inventory fields. It also carries existing v0.9 health/mana potion counts into the small-potion inventory.

If the v0.9 migration has not been run yet, run `supabase-v0.9-upgrade.sql` first, then the v0.10 migration.

## Render deployment

1. Open the Render dashboard and select the `soulbound_online` service.
2. Open Settings → Build & Deploy.
3. Change the deploy branch to `v0.10-medieval-fantasy-ui-music`.
4. Save and deploy.

Do not change the production branch unless you intend to publish this version.

## v0.10 gameplay changes

- Dead party members are skipped in the turn order while living heroes continue fighting.
- After victory, defeated heroes revive at 30% HP and 20% MP.
- Small / Medium / Large HP and MP potions restore 20% / 35% / 50% of the relevant maximum stat.
- Tank is selectable from New Game and has Provoke to attract enemy attacks for 3 enemy turns.
- At level 5, each class chooses one permanent specialization.
- A fifth class skill unlocks at level 5. Swordsman/Mage can apply a 20% monster damage vulnerability for 3 rounds; Tank can reduce damage taken by 20% for 3 enemy turns.

The code has been syntax-checked, but a live browser, multiplayer, Supabase, and Render deployment test is still required.
