# SOULBOUND v0.34 — Boss Loot, 9 Equipment Slots & Multiplayer Fallen-Turn Fix

**Base:** `v0.33-clean-equipment-layout`  
**Release branch:** `v0.34-boss-loot-nine-slot-equipment`  
**Do not merge or deploy automatically; deploy this branch separately when ready to test.**

## Gameplay settings

- **Boss loot only:** bosses at stages **3, 6, 9, 12, 15, 18, 21, 24** provide equipment. Normal enemies never roll equipment.
- **Independent party reward:** each party member (including a player who fell during the fight) receives **one random equipment item per defeated boss** if their bag has space. Players can get different item types and rarity tiers from the same boss.
- **Five rarity tiers** and their current weighting: Common 50%, Uncommon 28%, Rare 16%, Epic 5%, Legendary 1%.
- **Fixed stats:** every combination of boss, equipment slot and rarity has deterministic bonuses (ATK, DEF, maximum HP, maximum MP); it is not independently rolled per item.
- **40 bag slots:** equipped gear does not consume bag capacity. The current cap is enforced on purchased new gear and boss rewards. Older save files with more than 40 loose items are retained rather than silently deleting inventory; new items cannot be acquired until the bag is below 40.
- **Boss reward when full:** no additional gear is granted when there are 40 occupied bag slots; a message appears in the battle log. Unequip also refuses to overflow a full bag; players can discard spare unequipped items after confirmation.
- **Equip/unequip between battles only:** during waiting, merchant, or victory screens. Server rejects attempts during combat.
- **Nine functioning slots:** helmet, chest armor, pants, boots, main weapon, off-hand, necklace, left ring and right ring. The two rings are independently swappable. Items are tracked by unique UID so identical drops do not collide.
- **No gear loss on defeat:** existing inventory remains, even if all party members fall.
- **Turn fix:** when a monster knocks a hero down (0 HP), server skips that hero and advances to the next surviving ally. This also applies when the next turn is reset by another player's disconnect. If every player falls, the party loses normally.
- **Victory revive:** fallen allies recover **30% max HP and 20% max MP** on victory, which uses the existing formula. These allies also receive XP, gold and eligible boss loot.

## Save compatibility

No database schema migration is required. All v0.34 item data (`uid`, `rarity`, `slot`, `equippedSlot`, `bossStage`) is serialized inside the **existing `inventory` JSON field** of the existing save profile. Existing `weapon_item` and `armor_item` fields remain supported, as are prior shop items and starter gear.

**Limitations:** the current game's save import still trusts player-provided profile values during the restore process; production-grade anti-cheat would require an authenticated server-side save API / stat reconstruction. The UI sprites are pre-rendered and do not yet change visually when every new item is equipped. Reload/persistence behavior must be verified in a real Supabase account.

## Files changed

- `loot-v034.js` (NEW) — unique gear instances, canonical items, boss rarity table, fixed stats, nine-slot equip and unequip.
- `server.js` — loot on boss victory, battle-turn fix, equip/unequip/discard actions, shop bag limit, restoration of old and new inventory.
- `public/equipment-inventory-v032.js` — shows rarity labels, 40-slot usage, gear in all slots, draggable items and unequip-to-bag, with discard confirmation.
- `public/game.js` — sends equip, unequip and discard to server.
- `public/v034.css` (NEW) — rarity styling, visible drag feedback.
- `public/index.html` — includes v0.34 styles.
- `package.json` — version 0.34.0; `npm test`.
- `tests/v034.test.js` (NEW) — automated regression tests.

## Testing

In the assistant's isolated JavaScript execution environment, **8 regression cases passed** using the committed source: boss-only rewards; every slot/rarity; equip/unequip bonus reversal; wrong-slot/class prevention; two independent rings; 40-slot limit; preservation of legacy saved items; and skipping fallen turns / reviving allies. All relevant JavaScript files passed syntax parsing.

**Not yet verified:** an actual production multiplayer Render deployment, browser drag/drop on all devices, and real Supabase persistence after a deploy. These must be playtested before promoting to main.

### Manual multiplayer playtest
1. Go to Render settings and choose `v0.34-boss-loot-nine-slot-equipment` branch. Deploy, then Ctrl+F5.
2. Sign in with an existing hero and confirm previous items, stats and level are intact.
3. Create party with two people. Advance to stage 3 (Briarfang boss).
4. Let one hero fall while the other lives. Ensure the other player can still attack until boss victory.
5. On victory, verify the fallen hero has 30% HP / 20% MP, and **both** heroes received their own random item.
6. Outside battle, equip and unequip gear in each matching slot. Verify that ATK/DEF/HP/MP update and revert.
7. Sign out, sign back in, and Continue. Verify equipment rarity, equipped slots, inventory contents and stats persist.
8. Fill bag to 40 loose items (not counting worn gear). Test extra shop purchase and boss reward; both must respect capacity.
9. Check two identical shop item IDs and two separate rings can be equipped independently; discard a loose item to free space.
10. Return to a normal non-boss stage: no random gear should be generated.

### Suggested next version
v0.35 — more meaningful boss-specific loot tables, ability-based boss mechanics and loot notification UI.
