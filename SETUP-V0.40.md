# SOULBOUND v0.40 — A NEW WORLD

**Branch:** `v0.40-a-new-world` (based on `v0.39-boss-two-state-sprites`)

## What's implemented in code

### Central City
- Newly created/joined parties arrive in the Central City instead of starting a linear 24-stage campaign.
- Functional buttons: World Map, Merchant, Equipment & Bag, and Back to City.
- Joining friends with the five-character code and existing player classes works as before.
- The city is a functional UI Hub, **not yet free movement / an explorable overworld**.

### Clickable World Atlas
- A hand-authored vector fantasy continent map with **eight clickable region markers** and themed visual previews.
- Click on any region to inspect: artwork/theme, Thai and English area name, Main Boss, Mini Boss, five-stage range, recommended level, minimum level, defeated-boss count.
- The leader may start a region if every party member passes the **server-side** entry-level rule.
- Level rules (important): map 1 recommended LV 1–10 (entry LV 1), map 2 LV 11–20 (entry LV 10), map 3 LV 21–30 (entry LV 20), etc. Thus **LV 10 may enter map 2 early, but never map 3**. Previously completed maps remain replayable.
- Level is the entry gate in this version. Finishing the previous map is tracked but is **not an additional mandatory entry gate**, to match the specified early-entry rule.

### New 40-stage design
Each of the eight regions has 3 normal encounters, 1 Mini Boss, 1 Main Boss:
| Region | Stages | Mini Boss | Main Boss | Recommended LV / Minimum Entry |
|---|---|---:|---:|---|
| The Cursed Wilds | 1–5 | 4 | 5 | LV 1–10 / LV 1 |
| Dreadforge Bastion | 6–10 | 9 | 10 | LV 11–20 / LV 10 |
| Ember Caverns | 11–15 | 14 | 15 | LV 21–30 / LV 20 |
| Hollow Sanctum | 16–20 | 19 | 20 | LV 31–40 / LV 30 |
| Frostbound Peaks | 21–25 | 24 | 25 | LV 41–50 / LV 40 |
| Titanfall Ruins | 26–30 | 29 | 30 | LV 51–60 / LV 50 |
| Abyssal Rift | 31–35 | 34 | 35 | LV 61–70 / LV 60 |
| Eclipse Throne | 36–40 | 39 | 40 | LV 71–80 / LV 70 |

New enemy and Mini Boss names and gameplay stats exist for all regions. For now Mini Bosses reuse existing normal enemy SVG artwork. These are **not yet custom Mini Boss pixel sprites or special ability systems**. Future updates can replace them without changing IDs.

### Farm and replay
- Main Boss victory ends the region run and marks the region as cleared.
- Every Main Boss win rolls its own curated loot table again, with an independent roll for each party member.
- Return to city, inspect the map, and replay any accessible region as many times as desired.
- Personal defeat count and cleared region IDs are distinct from the current run.
- You may return to the city after a non-boss victory, a region clear, or a defeat; not during an active turn-based battle.
- Shop purchasing works from the city, and equipment can be changed there.
- All server travel and merchant actions validate room state and party-leader role.

### Saves (please read carefully)
- Current character stats, item inventory, and currency remain in the existing `profiles` table.
- New per-character boss-defeat counts and cleared regions save into `profiles.world_progress` (JSONB) **after running** `supabase-migration-v0.40.sql`.
- The SQL is **additive**: it does not delete, reset, or truncate existing user profiles.
- If the SQL has not been run, the game attempts a safe fallback: existing character stats still save to Supabase and world progress is cached in the current browser. **Map clears are not cloud-synced across devices without the SQL migration.**
- Guest games save locally in the same browser only; deleting browser storage deletes guest saves.
- Continue loads old characters if present; New Game manually resets character and world progress.
- Save writes for Main Boss clear are triggered immediately instead of waiting for a 500ms debounce.

## ONE REQUIRED MANUAL STEP for reliable cloud world saves

1. Open Supabase project → SQL Editor → New query.
2. Open `supabase-migration-v0.40.sql` in this branch; paste and **Run** it.
3. Verify the `world_progress` column exists on the `profiles` table.
4. Deploy the test branch on Render after verifying your existing Render config and environment.
5. Hard-refresh the page (Ctrl+F5).

Do not share the Supabase service role secret. No database content was deleted during coding.

## Suggested verification
1. Create / sign in, create room → **Central City** displays, and World Map opens.
2. Click all eight map markers; detail previews change.
3. Fresh LV 1: region 2 must refuse entry. Region 1 can start.
4. A hero at LV 10 can enter region 2 but not region 3; at LV 20 can enter region 3.
5. Start region 1; finish stages 1–5, with Mini Boss at stage 4 and Briarfang at 5.
6. Confirm region clear; return to Central City; replay region 1 and defeat Briarfang again.
7. Verify the boss defeat counter increases from 1 to 2 and loot rolls again.
8. Test level gates with 2+ party members (the lowest-level member blocks illegal entry for the whole party).
9. Restart browser, sign in with the same Supabase account, and verify `world_progress` and equipment load.
10. Verify Stage 5/10/.../40 boss loot / images / Wiki references; invalid map indices and battle-time travel fail safely.

## Notes / not done
- No deployment, merge into `main`, or direct Supabase SQL execution has been performed by the assistant.
- Browser/Render end-to-end test and `npm test` have not yet been run in the connected production environment. Pure JS simulation verified core server logic, eight regions, entry gates, all five encounters, replay and boss progress without failures.
- Version v0.39's 16 custom boss PNGs **still require image upload** in the `public/assets/bosses/v039` directory; missing images fall back to original SVG.
- New Mini Boss sprites, open-world movement, detailed quests, localizations of every new text string and balance beyond basic scaling are later work.

## Main files
- `world-v040.js`: map definitions, stage encounter types, level rules, progress model.
- `server.js`: authoritative room travel, room city state, 40-stage encounters, boss clear, replay, catalog.
- `loot-v034.js`: explicit boss index for old curated drops after moving boss stages.
- `public/world-ui-v040.js`, `public/v040.css`: Central City and interactive atlas previews.
- `public/game.js`, `public/index.html`, `public/equipment-inventory-v032.js`: game and UI integration.
- `supabase-migration-v0.40.sql`: cloud save schema migration.
- `tests/v040.test.js`: stage / map / level gate / progress tests, and updated older tests.

**Do not deploy to production before testing with a noncritical account, checking database migration and confirming available rollback.**
