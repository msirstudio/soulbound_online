# SOULBOUND Online v0.3 setup

## What's new
- 24-stage campaign with 8 bosses on stages 3, 6, 9, 12, 15, 18, 21 and 24
- Regular encounters between bosses
- Six themed battle scenes that change as the party travels
- Merchant camps after stages 4, 8, 12, 16 and 20
- Health and mana potions, class-specific weapons and armor
- Swordsman and Mage classes with different base stats and skills
- Level 3 class skill unlocks: Whirlwind (Swordsman) or Meteor (Mage)
- Existing Supabase account and hero progress retained

## Upgrade steps
1. In GitHub, keep the Render service on the v0.2 branch until the database migration is complete.
2. Open Supabase > SQL Editor > New query.
3. Copy all of `supabase-migration-v0.3.sql` from this branch and run it once. It adds four columns to the existing profiles table; it does not drop tables or delete character records. It also gives legacy level-1 accounts with zero gold 80 starting gold.
4. In Render > your soulbound_online Web Service > Settings > Branch, change the branch to `v0.3-campaign-classes-shop` and save. Auto-Deploy should start.
5. Wait for Live, then hard-refresh the game with Ctrl+Shift+R.
6. Sign in with your existing account. Choose Swordsman or Mage in the lobby. Changing class resets class-specific base gear/stats but keeps level, XP and gold.
7. Create a party and test the first battles. After stage 4, the party leader opens the merchant. Buy items individually; each player spends their own gold.

## Stage flow
- Stages 1-2 regular, stage 3 boss
- Stage 4 regular, then merchant
- Repeat the pattern: bosses every third stage, merchants after every fourth stage (except after the final stage 24)
- Final boss is stage 24, Eclipse Sovereign

## Prototype limitations
- Battle rooms remain in server memory and reset when Render restarts or redeploys.
- Character persistence uses the existing browser Supabase/RLS prototype; it is not a production anti-cheat or secure MMO economy.
- The merchant and equipment are currently simple prototype upgrades; no equipment inventory, trading, or item swapping UI yet.
- Art scenes currently use CSS-generated illustrated gradients and emoji sprites, not custom painted background assets.
