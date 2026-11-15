# SOULBOUND Online v0.62 — Archer, the Fourth Class

## Delivered
- **Archer** joins Swordsman, Mage and Tank as the fourth playable class, selectable in the lobby with male/female green-hooded SVG hero art and visible bow weapon. Existing character/sprite paths remain unchanged.
- Initial **HP 135 / MP 55 / ATK 23 / DEF 9 / Speed 12**, default Oak Shortbow and Ranger Leathers. Archer has bespoke level growth and server-authoritative 12% critical chance (×1.35 damage).
- Seven skills (server-owned costs, cooldowns, levels and multipliers):

| Skill | Lv | MP | CD | Damage | Trait |
|---|---:|---:|---:|---:|---|
| Quick Shot | 1 | 12 | 2 | 1.7× | Fast single shot |
| Arrow Volley | 3 | 25 | 3 | 2.1× | Multi-target physical |
| Pinning Arrow | 5 | 20 | 3 | 1.55× | Nature, weaken next enemy strike |
| Piercing Shot | 8 | 30 | 4 | 2.9× | High-power single hit |
| Hunter's Mark | 5 | 24 | 4 | 1.25× | Nature, target vulnerable for 3 turns |
| Rain of Arrows | 7 | 22 | 3 | 1.65× | Nature AoE |
| Heartseeker | 9 | 26 | 3 | 2.15× | Below 50% enemy HP: capped +12% finisher |

- Archer Weaponsmith inventory: Ashwood Bow (Lv1), Hunter Recurve (Lv3), Falcon Longbow (Lv8), plus **five boss-gated elemental weapons** at Lv15/25/40/55/70. All use the same equip, item UIDs, inventory and saved shop IDs as existing classes.
- Existing v0.61 passive engine extended with 5 Archer procs: Woodsong Echo, Storm Quiver, Frost Quill, Shade Mark and Dawn Flight.
- Client receives canonical Archer skill descriptions from the **server snapshot**, avoiding independent UI multipliers and cooldowns. Skill buttons show proper level, MP and cooldown.
- Guest, legacy Supabase and Secure Save player creation and restore recognize `class_id=archer`. Existing three classes, their inventory and score progression are unchanged.
- Existing v0.61 AUDIO dock stays at bottom-right without an additional row.

## Verification and rollout
- Use `npm test`; GitHub Actions on `v0.62-archer-class` checks syntax and all previous gameplay tests.
- Exercise 1–4 player parties, all Archer abilities, saves, shop gates and backwards-compatible equipment through the test suite.
- Before deploying to production: test on Render staging, a new Archer save slot, an old 0.61 save, reconnect, stage 1/5, Archer bow purchase and equip, and the 1366px/1080px UI.
- Secure JSON save slots require **no schema migration**. Legacy accounts may still depend on pre-existing database constraints; check production schema before migrating actual user save data. Keep a JSON export of any important hero.
- **Planned v0.65:** Sharpshooter and Beastmaster specializations, deliberately not available yet. Do not select a specialization that doesn't exist.

## Branches
Base: `v0.61-elemental-weapon-passives`. Work: `v0.62-archer-class`. No changes to `main` or the live Render deployment until the new branch is tested and explicitly chosen.
