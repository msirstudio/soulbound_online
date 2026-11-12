# SOULBOUND v0.35 — Adventure Index / Wiki

**Branch:** `v0.35-adventure-index-wiki`  
**Base:** `v0.34-boss-loot-nine-slot-equipment`

## Included

A read-only in-game Wiki opened with **📖 ADVENTURE INDEX** inside the game HUD. Features:
- **Bosses**: 8 boss stages, exact stage-scaled HP/ATK/DEF, EXP, gold and loot explanation.
- **Monsters**: 16 regular-stage encounters including their scaled attributes, rewards and zone.
- **Weapons**: shop weapons and boss-drop main/off-hand weapons.
- **Armor**: shop armor, boss-drop head/chest/pants/boots.
- **Accessories**: necklace and two ring slots.
- **Food**: 3 existing foods and buffs.
- **Potions**: existing HP and MP consumables, with prices.
- **World**: the existing six zones with stage ranges and descriptions.
- Search across item names, stages, source bosses and descriptions.
- Rarity filter: Common, Uncommon, Rare, Epic, Legendary.
- Click an entry to view its details; keyboard Escape and outside-click close the popup.
- Mobile-responsive list/detail layout.

## Data correctness

The new **GET `/api/index`** endpoint builds the information directly from the existing `encounter(stage)`, `sceneFor(stage)`, `shopItems` and the v0.34 canonical boss-loot `factory(id,rarity)`. No separately maintained hardcoded enemy stats in the front-end.

On current rules the final boss at stage 24 is **3,915 HP / 188 ATK / 76 DEF**, calculated from stage scaling. All boss items are predictable by template but actual player drops remain independently randomized.

The route is read-only and contains **no private user profiles, save data, room codes, authentication tokens or inventory contents**.

## Files changed
- `server.js` — read-only index API, health route version bump.
- `loot-v034.js` — expose the existing pure item factory (no changes to item generation).
- `public/adventure-index-v035.js` — search, tabs, item details and modal logic.
- `public/v035.css` — responsive fantasy Wiki styling.
- `public/index.html` — includes new JS/CSS and visible version.
- `package.json` — version 0.35.0.
- `tests/v035.test.js` — index consistency checks.

**No changes to save schemas, equip rules, loot probabilities, attack damage or multiplayer turns.** The v0.34 game logic remains in place.

## Deploy and test
1. In Render select branch `v0.35-adventure-index-wiki`, deploy and press Ctrl+F5.
2. Enter any party and click **📖 ADVENTURE INDEX** next to Equipment & Bag.
3. Verify eight Wiki categories, search for `Eclipse`, click the final boss and check HP 3915 / ATK 188 / DEF 76.
4. Test searches for `Iron Sword`, `Dragonpepper Roast`, `Briarfang`. Choose **Legendary** in the weapons tab.
5. Verify the original game still plays, equipment works and saves load.
6. Test the modal on a narrower mobile-sized browser window.

## Verification / limitations
- Source JavaScript parsing passed, the server index endpoint was executed with local dependency stubs and returned **24 stage records, 8 boss records, 24 shop items, 360 boss-loot templates and six world zones**, with the expected scaled stage 24 numbers.
- Real live Render browsing and interaction are **not yet confirmed**.
- The Wiki documents the current implemented game only. Future bosses, new mechanics, extra items and map expansions need to be added to their underlying game definitions, which will then be reflected by this Wiki.
