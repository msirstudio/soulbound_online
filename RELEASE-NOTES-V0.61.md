# SOULBOUND Online v0.61 — Elemental Weapon Passives & Bottom Audio Dock

## Scope

This release builds on **v0.60** without changing item IDs, progression gates, the Supabase schema, or the multiplayer protocol. The display version is **0.61** and package semver is **0.61.0**.

## The 15 weapon passives

| Class | Weapon | Element | Passive (activation chance) |
|---|---|---|---|
| Swordsman | Silver Fang | Physical | Silver Precision · 18%, bonus hit (max 32) |
| Swordsman | Flamebrand | Fire | Living Ember · 20%, two enemy-turn Burn ticks (max 40 each) |
| Swordsman | Thunder Edge | Lightning | Chain Spark · 18%, extra/chain hit (max 55) |
| Swordsman | Abyss Blade | Void | Void Leech · 19%, bounded HP restoration |
| Swordsman | Dawnbringer | Light | Dawn's Grace · 16%, radiant bonus + small heal |
| Mage | Moon Staff | Arcane | Lunar Focus · 22%, restore 4 MP |
| Mage | Frost Scepter | Ice | Frostbite · 22%, one enemy-attack Chill |
| Mage | Stormcaller | Lightning | Storm Echo · 21%, chain hit (max 65) |
| Mage | Void Staff | Void | Void Mark · 18%, temporary vulnerability |
| Mage | Celestial Staff | Light | Celestial Mercy · 18%, heal lowest-HP ally |
| Tank | Ironbreaker | Earth | Iron Fracture · 19%, vulnerability + 6 boss Stagger |
| Tank | Earthshaker | Earth | Quake Impact · 25%, +18 boss Stagger |
| Tank | Runic Hammer | Arcane | Runic Suppression · 20%, one enemy-attack Weaken |
| Tank | Titan Crusher | Earth | Titan Finisher · 17%, execution damage (max 90) |
| Tank | Divine Aegis | Light | Sacred Bulwark · 18%, 18% team ward |

Every weapon proc is checked by the server. The instance must be equipped in the main slot, owned in inventory, match the canonical shop ID, belong to the character's class, and meet its level. The browser never specifies proc outcomes or damage.

**Damage rules:** Existing basic/skill formulas and Mage spell elements remain unchanged for other weapons. Weapon elements apply to basic attacks and physical weapon skills; existing Mage spells and Paladin's Light skill keep their native element. Weapon passive effects apply only to damaging basic/skill hits; one proc attempt on the primary target per action. Existing party AoE damage is still computed from the unchanged central formula. Bonuses are bounded to avoid uncapped multi-target scaling.

**Burn:** Burn is held in the current enemy's transient battle state and ticks at the start of that enemy's next two actions. Burn can defeat an enemy, in which case the normal encounter finish path grants rewards once. It does not add any persistent columns.

## UI and audio

The former mid-screen `v0559-audio-row` was removed from the active HTML, and its separate `v060-index-audio-fix.css` file was deleted from this branch. The same one set of AUDIO button/volume controls now sits in `v061-audio-dock` at the bottom-right of the game viewport; on short screens, it remains accessible with a compact sticky layout. New `v061-elemental-ui.css` overrides older generic popover placement where needed.

The Weaponsmith shows the element, passive and chance. Equipment and INDEX surface the same canonical catalog metadata. `weapon-effects-v061.js` only displays server-reported combat FX; it cannot alter HP, gold, inventory or outcomes.

## Verification

- GitHub Actions validates JavaScript syntax and the full test suite.
- Deterministic unit tests verify all 15 passives, no proc for unowned/unequipped gear, capped damage/heals, Burn lifecycle, element chart, and multiplayer-safe effects.
- An actual Socket test purchases and equips Flamebrand, enters a battle, and confirms the elemental multiplier and passive FX.
- Manual after-deploy checks still required: City/Battle/audio popup at 1920×1080 and 1366×768, all classes, account and guest restore, boss phase transitions, party sizes 1–4, and real Render/Supabase session persistence.

## Deploy / Rollback

**Branch:** `v0.61-elemental-weapon-passives` (built from `v0.60-expanded-weapon-shop`). Deploy the new branch on staging first. Refresh the browser with Ctrl+F5; verify `/health` reports `0.61`. Do not point Render at `main` unless it has been intentionally merged.

Rollback to v0.60 is possible at the code level. Players keep the same shop item IDs and saved inventory, but always back up character tables before production deployment.
