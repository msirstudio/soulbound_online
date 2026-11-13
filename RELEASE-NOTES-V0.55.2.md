# SOULBOUND v0.55.2 — Elemental Type Chart, Water & Lightning

**Base:** `v0.55.1-index-status-boss-ui-fix`  
**Branch:** `v0.55.2-elemental-chart-water-lightning`  
**Release:** v0.55.2

## 1. Universal elemental chart (attack type → defender type)

The game now has **9 elemental types and Physical**, for **10 damage types total**.

| ATTACK | STRONG against (+20% damage) |
|---|---|
| 🔥 Fire | Nature, Ice |
| 💧 Water | Fire, Earth |
| 🌿 Nature | Water, Earth |
| 🪨 Earth | Fire, Lightning |
| ⚡ Lightning | Water, Ice |
| ❄️ Ice | Nature, Water |
| 🔮 Arcane | Earth |
| ✨ Light | Void |
| 🌌 Void | Light, Arcane |
| ⚔️ Physical | No special matchup; always neutral |

### Absolute rules
1. An attacker strong against the defender's element deals **×1.20** damage.
2. If the defender is strong against the attack type, the attack is **resisted (×0.80)**. Same-element attacks are also **×0.80**.
3. An unrelated pair deals **×1.00**; Physical is always **×1.00** against enemy elemental affinity.
4. **Light and Void mutually beat each other**, so Light → Void and Void → Light are **both ×1.20**. This named exception is intentional.
5. Boss-only additional weaknesses/resistances may be added **only when the standard matchup is neutral**. They never reverse an established strong/resisted matchup. The boss's INDEX entry always identifies the exception and its cause.
6. Different classes can use neutral Physical attacks, regardless of elemental coverage. No class is forced to carry all elements.
7. Enemy elemental attacks against heroes use the existing **race/class elemental resistance** rules. Heroes are not assigned a fixed inherent damage element. Thus, the type-chart offensive multiplier is calculated against **enemy affinity**; it is not silently used to create player race weaknesses.

**Examples:** Fire → Nature = 1.20, Fire → Ice = 1.20, Ice → Fire = 0.80, Water → Fire = 1.20, Lightning → Water = 1.20, Earth → Lightning = 1.20, Light ↔ Void = 1.20 either direction, same element = 0.80, Physical = 1.00.

## 2. Special enemy and boss exceptions

- **Dreadforge Champion** (Earth, Stage 10): standard Earth weaknesses to Nature, Water and Arcane, **plus Ice** as a documented boss-only weakness because frost fractures its forged armor. Stage 9's mini-boss does **not** inherit this boss-only weakness.
- **Briarfang Alpha** (Nature, Stage 5): standard Nature resistances, **plus Void resistance**, as its ancient roots ward off shadow magic. This does not negate any standard winning matchup.
- **Rootbound Guardian** (existing Stage 4 mini-boss): now **Water affinity**, with Water-type Monsoon signature attack.
- **Ironbound Executioner** (existing Stage 9 mini-boss): now **Lightning affinity**, with Lightning-type Stormhammer signature attack.
- **Ember Tyrant** (Fire, Stage 15): now consistently weak to Water and Earth and resists Ice, according to the new standard chart. Its prior special Ice weakness is retired because it contradicted the straightforward Fire vs Ice rule.
- **Eclipse Sovereign** remains Light in Phase 1 and Void in Phase 2, with the matching attack and mutual Light/Void interaction.

## 3. New spells and actual combat availability

Mage characters gain two additional spells without replacing the original five:
- **💧 TIDAL SURGE** — Water, Level 7 unlock, 22 MP (20 MP for Elf), ×1.8 attack coefficient, cooldown 3 rounds.
- **⚡ THUNDERBOLT** — Lightning, Level 9 unlock, 26 MP (24 MP for Elf), ×1.95 attack coefficient, cooldown 3 rounds.

Both use existing Socket.IO `action` messages and server-side class, level, mana and cooldown checks. Other classes cannot forge these actions. Each contributes Stagger just like existing damage skills. Basic attacks and other class skills are preserved.

In addition, existing regional main bosses gain documented supplemental attacks:
- **Monsoon Surge** (Water) in the Cursed Wilds.
- **Stormhammer** (Lightning) in Dreadforge Bastion.

Their corresponding mini-bosses use lesser variants. These appear in the real boss move rotation, and their elements and base status chances are shared with the INDEX via the same `combat-v055.js` move definitions.

## 4. Adventure INDEX

A new cache-busted `adventure-index-v0552.js` reads data returned by `/api/index?codex=0.55.2`, directly from the shared `elemental-v0552.js` rules.

- **ELEMENTS:** all ten types, with explicit STRONG AGAINST / WEAK TO / RESISTS ATTACKS FROM lists, actual multipliers and explained exceptions.
- **BOSSES / MONSTERS:** type, full weaknesses/resistances, special boss note, move names and status chances are shown above the artwork. Phase-2 changes remain listed in the detail section.
- **COMBAT RULES:** universal matchup algorithm, the Light/Void exception and complete Mage spell-element mapping.
- All existing inventory, race, status-effect and item entries remain available.

The prior v0.55.1 fix for caching, status icons and plain boss text remains in place.

## 5. Compatibility and testing

- **No database schema change, save reset or new image upload.**
- Existing 8 regions and 40 stages stay in the same order; stage 4/9 mini-bosses use their existing artwork and stage values.
- The Gold penalty, potion consumption, boss rewards/drop rolls, World Map, party/chat/merchant behavior and item inventories are untouched.
- New elemental chart calculations are server-authoritative, sourced from the same module as INDEX.
- CI validates JavaScript syntax, every ordered elemental pair (10 × 10), the special boss exception restriction, both Phase-2 affinities, mage spell/cooldown rules, mini-boss types and real Socket.IO elemental damage.
- Automated tests do not replace manual Render browser, device and full multiplayer balance testing.

## 6. Deploy for playtesting

1. Render → `soulbound_online` → Settings → Branch → select **`v0.55.2-elemental-chart-water-lightning`**.
2. Save Changes and deploy latest commit if automatic deployment does not start.
3. When the service is Live, press **Ctrl + F5** in the game.
4. Open 📖 **INDEX → ELEMENTS**. Its footer should identify INDEX UI v0.55.2 and list **10 elements**.
5. Select Water: Strong against Fire/Earth, weak to Nature/Ice/Lightning. Select Lightning: Strong against Water/Ice, weak to Earth.
6. Open stage 4 and 9 mini-boss entries: confirm Water and Lightning. Open Dreadforge Champion: verify its **extra Ice weakness** is explicitly named.
7. Test Tidal Surge with a Level 7+ Mage against Fire enemies, and Thunderbolt with a Level 9+ Mage against the Water mini-boss. Test both in solo and multiplayer parties.
8. Ensure the Gold-on-defeat penalty, boss rewards and traveling merchant still work.

**Production-readiness note:** Wait for the final passing CI result and a browser/party smoke test before merging into your stable branch.
