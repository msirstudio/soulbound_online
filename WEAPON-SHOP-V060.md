# SOULBOUND 0.60 — Expanded Weaponsmith

## Goal

Expand an under-stocked 40-stage RPG merchant without introducing elemental damage before the dedicated 0.61 mechanics. This is a **staging branch**, built on `v0.59-multiplayer-stability`, and does not deploy automatically.

## Added 15 progression weapons

| Required level | Boss clear to unlock | Swordsman (+ATK / G) | Mage (+ATK / G) | Tank (+ATK / G) |
| --- | --- | --- | --- | --- |
| 15 | The Briarfang Alpha (region 1) | Silver Fang +42 / 1,800 | Moon Staff +44 / 1,850 | Ironbreaker +43 / 1,800 |
| 25 | Dreadforge Champion (region 2) | Flamebrand +59 / 3,600 | Frost Scepter +62 / 3,800 | Earthshaker +60 / 3,700 |
| 40 | Hollow Oracle (region 4) | Thunder Edge +82 / 8,000 | Stormcaller +86 / 8,300 | Runic Hammer +84 / 8,100 |
| 55 | Glacier Warden (region 5) | Abyss Blade +115 / 17,500 | Void Staff +119 / 18,000 | Titan Crusher +117 / 17,800 |
| 70 | Void Reaper (region 7) | Dawnbringer +152 / 36,000 | Celestial Staff +157 / 37,000 | Divine Aegis +155 / 36,500 |

Three existing starter/intermediate shop weapons per class remain untouched, for **8 shop weapons per class, 24 total**.

*These are additive ATK weapon bonuses, not final hero ATK. Their names/icons have fantasy flavors; no elemental multipliers, DoT, or status triggers apply in 0.60.*

## Correctness and economy safeguards

- **Existing weapons and armor purchase bug fixed:** the original items lacked `category` values despite the purchase handler checking `it.category`. The canonical shop listing now assigns category values once on the server.
- Every weapon is sold only by the city **weapon** merchant. The roadside merchant's potion-only restriction is unchanged.
- Weapon purchase requires **correct class, minimum level, required previous-region boss clear, enough Gold and free bag space**. All checks are authoritative on the server; disabled UI buttons are only presentation.
- The client lists **only your class**, sorted by unlock level, and shows the specific lock reason. Eight options per class keep the merchant manageable.
- Purchased gear uses the existing per-copy `uid` and stable catalog `id`, so equipped duplicates work as distinct items.
- Existing boss loot remains as drops; shop weapons are reliable choices, not substitutes for high-end rare traits.
- No changes to 0.57 Secure Save schema, 0.58 damage calculations or 0.59 reconnect mechanics.

## Staging QA before any production release

1. Leave production Render branch unchanged; test `v0.60-expanded-weapon-shop` on your separate Render staging service.
2. With a new throwaway Swordsman, Mage and Tank, visit the city weaponsmith; confirm exactly **8 items for that class** and no other-class listings.
3. Purchase a legacy Level 1 sword/staff/mace at sufficient Gold; this verifies the merchant-category fix.
4. Try a Level 25 item before defeating region 2's main boss; purchase must fail without deducting Gold.
5. Defeat that boss (with a test save), reach Level 25, then buy and equip the same weapon. Verify the correct ATK bonus and Gold deduction.
6. Buy two copies and equip the *second* instance. Unequip and swap repeatedly; confirm each has its own `uid` and only the selected copy is equipped.
7. Save and reload each of the three account slots; verify acquired and equipped items keep the same IDs, Gold and ATK.
8. Check a 40/40 full bag, a wrong-class purchase request, insufficient funds and a low-level attempt. No Gold may be deducted.
9. Check the adventure index Weapons tab shows shop catalog entries and all existing boss drops.
10. Test mobile shop layout and browser cache refresh (`Ctrl+F5` on desktop).
11. Run `npm test` and `npm run audit:weapons`; do not ship if any job fails.

## Rollback & prerequisites

No SQL change is needed for 0.60. To undo code changes use the prior 0.59 branch; any 0.60 newly purchased gear remains in the authoritative Save. **Do not roll back blindly** after players buy new weapons: old 0.59 code may discard their unknown item IDs on restore, so **back up and reconcile Save Slots first**.

0.57 Secure Save remains a separate production prerequisite. Verify `/health.secureSavesEnabled===true` on staging for signed-in anti-cheat protection.

## Planned 0.61

Elemental weapon damage portions, resistance calculations and rare boss-specific effects, with a separate balance pass and migration-safe item definitions.
