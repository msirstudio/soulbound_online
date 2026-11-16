# SOULBOUND v0.68 — The Ancient Forge

## What's new
- **⚒ BLACKSMITH**, directly on the Central City illustration (no more merchant submenu). Click it to open a responsive forge that lists your real owned gear, the next upgrade, success chance, required stones and Gold.
- Suspense animation ~1.75 seconds with a spinning rune, sparks and colorful glow, plus existing in-game sound effects. Results are calculated **before** animation by the authoritative Node server; animation never alters probability. Honors sound volume and prefers-reduced-motion.
- Weapons/armor/accessories support **+1 through +10**, using immutable catalog stats to derive their enhanced values. Existing stat formulas and item UIDs are preserved; equipped gear updates the owner's totals automatically.
- **Enhancement Stone** (blue/basics, purchased at Blacksmith for 150 Gold or dropped from normal mobs), **Refined Stone** (purple; mini-boss/boss drop), and **Ancient Stone** (gold; rare mid/end-region boss and the second Guardian). Materials have a separate wallet and do **not** occupy the 40-slot equipment bag.
- **✦ ANCIENT PORTAL** in the Central City leads to two optional repeatable bosses. A party leader can open the portal only after **every** party member has beaten Stage 10 (Gorthan) or 20 (Selunara) main boss. Party 1–4 scaling. The original 40-stage campaign is unchanged.
- **GM panel** can grant all three stones to a verified online party member, 1–20 each.
- Secure saves (Supabase) and guest browser saves carry materials and upgrade history. Save data is not reset. No new SQL migration needed beyond existing v0.57 Secure Saves.

## Rates and materials
| Target | Success | Required stone | Count | Gold |
|---|---:|---|---:|---:|
| +1 | 100% | Enhancement | 1 | 70 |
| +2 | 90% | Enhancement | 1 | 140 |
| +3 | 80% | Enhancement | 2 | 250 |
| +4 | 70% | Refined | 1 | 450 |
| +5 | 60% | Refined | 1 | 700 |
| +6 | 45% | Refined | 2 | 1,100 |
| +7 | 35% | Refined | 2 | 1,700 |
| +8 | 25% | Ancient | 1 | 2,600 |
| +9 | 15% | Ancient | 2 | 4,000 |
| +10 | 10% | Ancient | 3 | 6,500 |

**Failures consume stones and Gold, but never break equipment or reduce enhancement level.** Stat bonuses rise from 3% at +1 to 45% at +10, against the item's BASE stats rather than repeatedly compounding.

## Drop table
- Regular encounters: 15% chance of basic Enhancement Stone.
- Mini-boss: 50% chance basic, 30% chance Refined, independent rolls.
- Story bosses: guaranteed basic plus Refined (40% in regions 1–2, guaranteed in regions 3–8). Ancient Stone: none in 1–2, 5% in 3–4, 15% in 5–6, 30% in 7–8.
- Gorthan: guaranteed 1 Refined and 80% basic. Gorthan's stone shell shatters at half health, DEF goes down and ATK rises.
- Selunara: guaranteed 1 Refined plus 10% Ancient; at half health she curses the party, drains MP, and later her mirror echo drains MP repeatedly.
- Boss and mob materials are granted to each participating player on their victory, subject to material wallet cap.

## How to deploy and test
1. In Render Web Service settings change the deploy branch to **`v0.68-ancient-forge`** and run **Manual Deploy → Deploy latest commit**. This branch is separate from live `main` or v0.67; do not merge unless you've reviewed it.
2. Once Render status is **Live**, visit `https://soulbound-online.onrender.com/health` to verify `"version":"0.68"`.
3. Reload the game with **Ctrl+F5**, sign in with your existing owner account and enter your hero slot. Go to the illustrated Central City and click **⚒ BLACKSMITH** (bottom left) or **✦ ANCIENT PORTAL** (bottom right).
4. Equip or buy a cheap registered weapon in the city. In Blacksmith buy a basic stone and select the weapon. Check that the animated +1 result happens, costs one stone and Gold, and **+1** persists across exit/re-enter.
5. Test higher levels using **GM → Enhancement Stones** to give yourself refined and ancient stones. The GM owner UUID and Secure Saves setup stays exactly as in v0.67.
6. Test a failing forge attempt and reconnect, plus party boss unlocks and 1–4 players. The portal cannot start if a member has not cleared the required stage.
7. If the button does not appear, confirm Render branch/version and browser cache. If account cloud saves show an error, **stop using Forge** until Secure Saves is healthy. No reset of save slots is required.

## Security and limitations
- Forge uses server-selected chances, server-owned Gold and materials, and verified item inventory UIDs; rejects forged client success flags, impossible quantities, fake gear and in-battle attempts.
- Unique request IDs prevent duplicate forge rolls and charges, and server-side cloud-persist guards reject further actions during in-flight writes.
- The new Guardians are optional and in this release use existing monster combat systems plus their unique phase mechanics. No offline GM grants, account wipes, or expansion of the main stage count.
- GitHub CI covers game logic and simulated Socket multiplayer; **a real Render browser / Supabase smoke test is still necessary** after deployment.
