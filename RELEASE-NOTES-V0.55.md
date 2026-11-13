# SOULBOUND v0.55 — Hardcore Combat & Adventure Codex

**Parent branch:** `v0.54-full-combat-expansion`
**Deployment branch:** `v0.55-hardcore-combat-codex`
**Release:** v0.55; package version 0.55.0

## Gameplay changes

1. **Authoritative elemental affinity** for all eight regions (including region normal enemies, mini-bosses and bosses). Server computes x1.20 for a vulnerable enemy, x0.80 for a resistant enemy and x1.00 for neutral. Physical damage stays neutral and is always a viable option. Mage spells receive their actual Arcane / Fire / Ice elements; Paladin Rallying Slash uses Light.
2. **Element/status resistances** calculated on the server from race and class. Control statuses (Stun and Freeze) cannot chain-lock a character: after a control skip, the character gains two of their following turns protected against additional control effects. Burn, Poison and Bleed can coexist but their combined DOT is capped at 10% of Max HP per player's turn. Server rejects invalid skill/consumable actions **before** status tick processing.
3. **Stagger + Interrupt:** every attack/skill builds a transient gauge. BREAK STRIKE costs 15 MP and has a cooldown of 3, with a high Stagger contribution. The gauge persists over the battle. Filling it while a monster is winding up a charged move cancels the charge and causes one staggered enemy turn. A 2-attack interrupt immunity prevents repeated locks. Thresholds vary by boss and party size (solo scaled for achievable planning). Phase changes clear old Stagger buildup.
4. **Perfect Guard:** using Guard while an enemy has already started charging makes the team ward stronger and adds Stagger. Existing +8 MP for Guard and Tank's party Aegis remain. Protection durations are not consumed by charge warnings.
5. **Cleanse:** a new universal action costing 12 MP with a cooldown of 3. Removes all active negative statuses from the most afflicted living ally, prioritizing control effects. A teammate can cleanse an incapacitated ally before that ally's turn.
6. **Adaptive AI:** in addition to all eight existing signature attacks, low-HP bosses may use Frenzied Sweep (AoE) and bosses facing 3+ members may use Crowd Breaker. Signatures are retained and take priority on their normal cycle; boss attack intent stays synchronized through Socket.IO. Only Stage 35 (Void Reaper) and Stage 40 (Eclipse Sovereign) retain Phase 2.
7. **Punishing Hardcore B:** each party member loses **8% of their currently held Gold on defeat**, capped at **2,000 Gold** per hero per defeat. Consumed potions/foods are not refunded. There is **no experience, equipment, race, inventory or stat loss**. Server guards against double-charging when multiple events report defeat. The existing return-to-city/replay flow stays unchanged.
8. **Temporary stats correctly scoped:** Swordsman's Shield Breaker no longer permanently increments base DEF; it grants temporary defense via the existing damage-reduction timer.

## Expanded Adventure INDEX

Click **📖 INDEX** in the gameplay controls. It is accessible within the existing game modal.

- **BOSSES / MONSTERS:** Each entry includes live authoritative elemental affinity, weakness and resistance, actual attack move names, range (single / all heroes), element, power multiplier, base status chance before target resistance, interrupt/charge warnings and Phase 2 details. Existing HP, ATK, DEF, XP, Gold and item drop listings remain.
- **ELEMENTS:** Browse Physical, Nature, Fire, Ice, Arcane, Earth, Void and Light. See which regions each is strong against or resisted by. No invented universal rock-paper-scissors chart; the weakness belongs to each region/enemy.
- **STATUS:** Read Burn, Poison, Bleed, Weaken, Freeze and Stun effects, duration, counters and the damage cap.
- **COMBAT RULES:** Read Weakness/Resistance multipliers, DOT cap, control immunity, Stagger/Break, Perfect Guard, Cleanse, Gold defeat penalty, solo scaling and elemental skill mapping.
- Index records are returned by `/api/index` from the same `combat-v055.js` and `combat-v054.js` constants and algorithms used by live combat, avoiding a hardcoded display-only fake.

### Boss specialties

| Stage | Boss | Element | Weak to | Signature status |
|---:|---|---|---|---|
| 5 | The Briarfang Alpha | Nature | Fire | Bleed |
| 10 | Dreadforge Champion | Earth | Ice | Burn |
| 15 | Ember Tyrant | Fire | Ice | Burn |
| 20 | The Hollow Oracle | Arcane | Void | Weaken |
| 25 | Glacier Warden | Ice | Fire | Freeze |
| 30 | Ancient World-Eater | Earth | Arcane | Stun |
| 35 | The Void Reaper | Void | Light | Poison; Phase 2 stun |
| 40 | Eclipse Sovereign | Light | Void | Burn; Phase 2 Weaken / Void attacks |

**Stage 40 Phase 2:** Affinity switches to Void, weakness to Light. Sovereign Judgment now uses Void damage to match the INDEX. Every other boss and mini-boss remains single-phase (except stage 35).

## Compatibility

- No SQL migration, save schema changes or new assets.
- Existing items, equipped gear, independent boss loot rolls, EXP, skill unlocks, account persistence, region gates and party leader permissions are unchanged.
- New enemy decisions are server-authoritative. Only temporary combat state travels through the Socket.IO state snapshots; no new hero fields are saved in Supabase. Gold loss uses the existing saved `gold` field.
- Existing World Map, shops, equipment UI, party/chat/log, audio and boss reward views are preserved.

## Testing

The project CI runs `node --check` on the updated scripts and `npm test` on the complete old/new regression suite. New tests cover all eight affinities and exact boss move metadata, Mage Fire damage versus Ice weakness on an actual Socket.IO battle, two-player Gold defeat penalty, Stagger/Break during charged attack, team Cleanse, resistant statuses, DOT cap, control immunity, race/class status resistance and exclusive boss phases. Inspect the current branch Actions result before deployment.

**Limitations:** GitHub Actions runs simulated sockets, not actual network latency or manual desktop/mobile browser play. Fine tuning of per-region damage, status probability, Solo/4-person Hardcore difficulty and UI layout needs in-game playtests on Render before declaring release stable.

## Deploy test branch on Render

1. Render Dashboard → `soulbound_online` → Settings → Branch → choose `v0.55-hardcore-combat-codex` → Save Changes.
2. Deploy latest commit if auto-deploy does not run. When **Live**, refresh with Ctrl+F5.
3. Open 📖 INDEX and check the ELEMENTS, STATUS and COMBAT RULES tabs; open boss stages 35 and 40 to inspect Phase 2 move information.
4. Test a Mage's METEOR against Glacier Warden, and examine the Stagger gauge during a charged boss attack.
5. Use GUARD, BREAK STRIKE and CLEANSE in a 1-person and 2–4-person party.
6. Verify a defeat charges Gold exactly once per player, while preserving character levels, equipped items and normal saves.
7. Verify boss rewards, mini-boss traveling merchant at local stage 4, and post-clear return-to-city flow.

This is a branch-isolated candidate until manual playtesting confirms the balance and presentation.
