# SOULBOUND v0.54 — Full Combat Expansion

## Base & release convention
Based on `v0.48.5-boss-rewards-character-overview`, which the project owner now calls **v0.53**. This release is **v0.54** (package version `0.54.0`). This is an isolated test branch and does not modify the existing Render deployment until its branch is selected.

## Implemented
### 1. Authoritative boss and mini-boss AI
- `combat-v054.js` is a server-only, stateless rules module; room state is authoritative in Node.
- Main bosses across all eight regions receive distinct special moves:
  - The Briarfang Alpha — Briarstorm (Nature/Bleed, group attack)
  - Dreadforge Champion — Forged Inferno (Fire/Burn, group)
  - Ember Tyrant — Magma Rupture (Fire/Burn, group)
  - The Hollow Oracle — Oracle's Curse (Arcane/Weaken, group)
  - Glacier Warden — Glacial Prison (Ice/Freeze, single)
  - Ancient World-Eater — Titan's Quake (Earth/Stun chance, group)
  - The Void Reaper — Rift Collapse (Void/Poison, group)
  - Eclipse Sovereign — Eclipse Nova (Light/Burn, group)
- Main-boss special moves have a telegraphed charge turn before the attack. Their next intended move is exposed as read-only data in the shared room snapshot. Mini-bosses have lighter signature moves, but no phase transition.
- Taunt still redirects eligible single-target attacks toward a tank. Group attacks damage all living party members.

### 2. Phase 2 — exactly two main bosses
- **Stage 35: The Void Reaper**, `abyssal_rift`, below or at 50% HP, changes to *Oblivion's Grasp*.
- **Stage 40: Eclipse Sovereign**, `eclipse_throne`, below or at 50% HP, changes to *Sovereign Judgment*.
- Each transition happens once. Attack power increases by 12% at the transition. Boss HP does not reset or heal.
- No other boss and no mini-boss enters Phase 2.

### 3. Temporary elemental statuses
- Enemy attacks can apply Burn, Poison, Bleed, Weaken, Freeze and Stun at configured chances.
- Damage-over-time ticks at the affected hero's next turn (Burn 4.5%, Poison 3.2%, Bleed 3.7% Max HP per tick); Weaken lowers outgoing damage by 22% while active; Freeze/Stun skip one turn.
- Status effects have bounded durations, tick no more than once per player turn, and expire automatically. UI receives current effects but cannot forge them.
- Frost Nova briefly **Chills** the enemy (20% weaker attack); Swordsman's Shield Breaker **Weakens** an enemy (12% lower damage for two attacks). Monster debuffs expire only on attacks.

### 4. Team protection
- Existing Guard retains +8 MP recovery and adds a defensive team ward against the next actual enemy attack: 18% reduction, or 28% when a Tank guards. Guarding hero also receives additional self-protection.
- Tank Aegis Pact retains its personal reduction while granting a 25% damage-reduction ward to the party for two actual enemy attacks.
- Boss charging turns do **not** waste Guard/Aegis duration. The ward applies to actual damage from single-target or AoE attacks.

### 5. Lightweight indicators (not a HUD redesign)
- Existing boss tag adds PHASE 2 for stages 35 and 40.
- Small read-only next-move and active party-effect labels; ordinary monsters do not clutter the screen with telegraphs.
- No generated artwork or new UI assets are required.

## Compatibility / safety
- The existing `world-v040.js`, XP/Gold/loot probabilities, inventory, race, class and save migration schemas are unchanged.
- Hero status effects, enemy intentions and ward counters are transient encounter state; the Supabase save payload is unchanged.
- All combat decisions are calculated on the Socket.IO server. Existing per-player inventory rewards and party synchronization are retained.

## Automated verification
- Source, simulated Socket.IO two-player/single-player battle transitions, all 8 boss abilities, exclusive Phase 2, charge/AoE, status durations, group protection, legacy combat, region gating, loot and all existing regressions are checked by GitHub Actions.
- **Browser gameplay on Render, real human multiplayer latency and balance over 40 stages are NOT yet tested**, so this branch is a candidate for in-game playtesting, not a fully verified production release.

## How to deploy to a test/live instance
1. Render → Web Service `soulbound_online` → Settings → Branch → choose `v0.54-full-combat-expansion`.
2. Save Changes; use Auto Deploy or Manual Deploy → Deploy latest commit.
3. Once Live, Ctrl+F5. Existing assets stay in place; **no image files or database migration are needed**.
4. Test stage 5 boss telegraphs and Guard protection; ensure normal enemies have no Phase 2.
5. Test stage 35 and stage 40 bosses, dropping their HP below 50% without killing them in one hit, to see Phase 2. The transition is skipped if the hit kills the boss outright.
6. Join with 2–4 players. Confirm AoE affects only the current party, statuses appear on each character, and a Tank's Guard protects others.
7. Verify boss drops and old character saves are unchanged.

## Follow-up tuning after playtest
Tune boss damage/status probabilities, phase thresholds and Guardian protection from actual playtest feedback. Keep large HUD changes for a separate later release.
