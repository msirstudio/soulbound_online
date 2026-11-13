# SOULBOUND v0.55 — Hardcore Combat & Advanced Status System

**Base:** `v0.54-full-combat-expansion`  
**Branch:** `v0.55-hardcore-combat-resistance-interrupt`  
**Focus:** system mechanics and multiplayer compatibility, minimal HUD additions.

## Implemented

### A. Elemental weakness & resistance
- Bosses and mini-bosses across all 8 regions have distinct elemental strengths/weaknesses, calculated on the Socket.IO server.
- Weak-element attacks deal **1.20x** damage; resisted-element attacks deal **0.80x**; Physical attacks remain neutral.
- Eclipse Sovereign changes from Light affinity (Void weakness) to Void affinity (Light weakness) at **Phase 2**.
- Existing Mage skills now carry Arcane/Fire/Ice types; Tank attacks can deal Earth; Swordsman remains strong through Physical/Stagger tactics.
- Incoming nonphysical damage is reduced according to existing race and class identity, capped to 30%, without changing saved attributes or gear.

### B. Advanced status & Purify
- Server calculates status resistance by class and race, using the existing character fields.
- Combined Burn + Poison + Bleed damage is **capped at 10% of Max HP per player's turn**.
- After Freeze or Stun consumes a turn, the hero receives a **two-full-turn crowd-control immunity window**, preventing endless stun/freeze loops.
- **PURIFY:** new player action, **18 MP, 3-turn cooldown**, removes the hero's active ailments before DOT or Stun can tick on that turn. It uses the action/turn and has no extra consumable inventory item.
- Invalid skill/potion/item commands are prevalidated before status ticks. A rejected command cannot drain HP or use up a turn.
- Bosses do not accept permanent stun chains: the stagger/interrupt system below is the designed counter.

### C. Stagger, Interrupt & Perfect Guard
- Stagger thresholds: **65** for mini-boss, **90** for most main bosses, **130** for stages 35 and 40.
- Normal attacks and skills accumulate Stagger; Swordsman builds it faster. The Stagger meter appears near the monster HP.
- **INTERRUPT:** costs **8 MP** and a turn. It is only enabled when Stagger is full and a boss has an impending **charged** attack. It cancels the attack and enemy action.
- After a successful Interrupt, the boss gains temporary interrupt immunity for **two actual enemy attacks**; Stagger decays slightly on each real attack.
- **PERFECT GUARD:** use the existing Guard when the charge is already telegraphed and waiting to release. It improves team damage reduction and protects the guarding player, adds Stagger pressure upon a successful block.
- Ward duration still does not expire on an enemy wind-up turn.

### D. Adaptive, legible boss targeting
- The boss can mark a living player at or below 35% HP when selecting a single-target move. The intended target name is shown in the battle warning.
- Active Tank Taunt retains priority on eligible single-target moves.
- When an elite enemy drops below 30% HP, it may select a periodic **Last Stand** move, chosen and announced before execution.
- **Only The Void Reaper (stage 35) and Eclipse Sovereign (stage 40) have Phase 2.** No additional phases were introduced.

### E. Punishing Hardcore defeat penalty (Option B)
- On party defeat, **each member independently loses 8% of their current Gold, capped at 2,000 Gold**.
- Penalty is applied **once per defeat** on the server, never repeatedly when the state is re-emitted or the group returns to the city.
- Potions and foods actually consumed during the failed encounter stay consumed; they are not refunded.
- **No EXP loss; no item destruction; no change to equipped items, class/race, stage unlocks or owned gear.**
- Death penalty and used consumables are included in the normal character-save flow. Client profile writes are serialized so stale pre-defeat saves do not overwrite the penalty.
- No extra database table/column or migration is required.

### F. Battle-local stats safety
- Reworked Swordsman's Shield Breaker DEF +3 to a **temporary battle-only bonus**, rather than mutating permanent `p.def`, so a temporary combat buff cannot become a saved stat.
- Starting a new encounter clears Stagger, status effects, immunity, party ward, and battle-only stat bonuses.
- Maintained original battle loot chances, Gold/EXP rewards on wins, equipment handling, region travel, and city/roadside shops.

## Testing
- GitHub Actions validates Node JavaScript syntax and runs **111/111 automated regressions** including existing game systems.
- Added unit tests for all 8 elemental matchups, Phase 2 affinity swap, status resistances and immunity windows, damage-over-time cap, invalid action guards, Stagger/Interrupt, Perfect Guard, boss target selection, and idempotent penalties.
- Added simulated Socket.IO tests: consumed potions followed by a defeat, solo Purify/Interrupt, two-person state sync, and a **four-person AoE wipe** where each hero receives exactly one Gold penalty.
- **Not yet verified by hands-on play on Render, under internet latency, or against all boss encounters with real users.** Actual damage and economy balance should be tuned after playtesting.

## Test deployment instructions
1. Render → `soulbound_online` → **Settings → Branch**: choose `v0.55-hardcore-combat-resistance-interrupt`.
2. Save Changes, wait for automatic deploy or use Manual Deploy → Deploy latest commit.
3. When Live, hard refresh with Ctrl+F5.
4. Check a boss's elemental weakness: e.g. Mage's Ice Frost Nova against Ember Tyrant vs a Fire Meteor. Damage depends on the full skill multiplier as well as element.
5. Watch a main boss wind up. Guard immediately before release to get Perfect Guard, or fill Stagger and use Interrupt. Interrupt costs 8 MP and only works when the bar is full during a charged move.
6. Apply Poison/Burn/Freeze, then try Purify. Confirm that invalid skills do not tick DOT/status. Test solo and with a party.
7. With 1,000 Gold, deliberately lose a battle; the expected balance is **920 Gold**. If a potion was used, its count should remain reduced. Confirm after a save/reload.
8. Confirm stages 35 and 40 Phase 2 still work, ordinary bosses have none, boss drops continue after victory, and city/roadside merchants work as before.

## Pending for later versions (not claimed complete)
- No large Skill Tree, new item-based Antidote, new equipment Set Bonuses, revised Supabase schema, or redesigned HUD.
- No server-side persistent character database was added; existing guest/local and Supabase client save workflows remain.
