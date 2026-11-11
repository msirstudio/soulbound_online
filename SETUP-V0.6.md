# SOULBOUND Online v0.6 — Races & Awakening

## Before deploying

1. Open your Supabase project.
2. Open **SQL Editor** from the left menu.
3. Choose **New query**.
4. Open `SUPABASE-V0.6.sql` in this repository, copy all its contents into the SQL Editor, and click **Run**.
5. Wait for the query to finish successfully. This adds two save fields: `race_id` and `race_points`.

Do this before deploying v0.6. The game needs these columns to save a character's race and summon points.

## Deploy

In Render, open the `soulbound_online` service → Settings → Build & Deploy → set Branch to `v0.6-races-awakening` → Save Changes. Wait for the deploy to finish, then open the site and sign in.

## New systems

- Your character now has separate HP and MP bars in the battle HUD.
- Every player receives **1 Race Point for each boss defeated**. Each of the 8 campaign bosses grants one point.
- One summon costs 1 Race Point. The server chooses the result; the animation is only a reveal, and **Skip Animation** reveals the already-decided result immediately.
- A summon changes your currently equipped race. It does not create a separate race collection or duplicate inventory.
- Race and Race Points are saved to the signed-in profile.

## Summon rates

| Rarity | Chance |
|---|---:|
| Common | 60% |
| Rare | 25% |
| Epic | 10% |
| Legend | 4% |
| Mythic | 1% |

The two races within each rarity have equal chances.

## Races and abilities

| Rarity | Race | Buffs | Passive |
|---|---|---|---|
| Common | Human | +5% EXP | Adaptable Spirit |
| Common | Beastkin | +8% Max HP, +4% ATK | 10% chance to recover 3 MP on a basic hit |
| Rare | High Elf | +18% Max MP, +4% ATK | Skills cost 5% less MP |
| Rare | Orc | +12% Max HP, +13% ATK, -8% Max MP, -8% Max MP | Deal 8% extra damage while below 50% HP |
| Epic | Stoneborn | +20% Max HP, +18% DEF | Take 3% less damage |
| Epic | Sylvan | +10% Max HP, +14% Max MP, +4% ATK | Restore 3% Max HP after each victory |
| Legend | Demon | +22% ATK, +8% Max MP, -4% Max HP | Hellfire damage |
| Legend | Dragonkin | +16% Max HP, +16% ATK, +10% DEF | Take 2% less damage |
| Mythic | Celestial | +15% Max HP, +20% Max MP, +12% ATK | Take 8% less damage |
| Mythic | Voidborn | +8% Max HP, +15% Max MP, +25% ATK | Deal 25% extra damage and take 5% less damage |

Rates and balance are initial game values and can be tuned after playtesting.

## Important

- New Game resets the saved hero and Race Points.
- Continue restores the saved hero and race.
- Stage progress is still not saved between separate rooms; the persistent save covers hero progression and equipment.
- The summon result is decided by the game server, not by the visual animation.


## v0.7 — Guest mode, equipment and skills

- **Play as Guest:** no account required. Guests can create a room or join a friend using the room code, just like account players.
- **Guest saving:** the hero profile is stored in the browser localStorage. It survives refreshes and browser restarts on the same browser/device, but does not sync across devices or browsers. Clearing site data removes the guest save. Creating a New Game overwrites the guest save.
- **Equipment:** more weapons and armor are available in the merchant shop. Weapon and armor purchases are restricted by class where applicable and by minimum level (levels 1, 3, 5, 8, 12). The server validates the required level, so the browser cannot bypass it.
- **Skills:** two additional active skills unlock at levels 5 and 8. The server calculates damage; the game UI lists each skill multiplier, MP cost and extra effect.
- Existing account sign-in remains available for cross-device cloud saves.
