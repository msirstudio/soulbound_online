# SOULBOUND v0.55.1 — INDEX, Status Icons & Boss Label Hotfix

Base: `v0.55-hardcore-combat-codex`. This update intentionally keeps game balance, saved data, battle calculations, boss loot, party permissions and progression unchanged.

## Why the old INDEX still appeared
The v0.55 HTML pointed at `adventure-index-v035.js`, a long-lived script URL. The provided screenshot shows an INDEX footer with server catalog v0.55 but only the original nine tabs and no new boss sections. That combination is consistent with an older client-side Index script remaining cached.

- The page now loads a **new file** `adventure-index-v0551.js` rather than reusing the v0.35 URL, preventing clients from getting the old cached Index renderer.
- `game.js?v=0.55.1` and `i18n-v038.js?v=0.55.1` use cache-busted script URLs for the gameplay status icons and Thai labels.
- The Index requests `/api/index?codex=0.55.1` with `cache:"no-store"`, and the API itself sends `Cache-Control: no-store` instead of caching the outdated catalog for 60 seconds.
- The client checks that the API provides real `codex.elements` and `codex.statusEffects`; a clear warning is shown instead of silently rendering an obsolete guide.
- Index footer identifies **INDEX UI v0.55.1**, API version and number of element/status entries.

## Adventure INDEX — visible improvements
- Left sidebar includes **ELEMENTS** (Thai: ธาตุ), **STATUS** (สถานะ), and **COMBAT RULES** (กฎการต่อสู้) in addition to all prior categories.
- Main boss/mini-boss detail starts with a **compact combat summary above the artwork**, showing **ELEMENT, WEAK, RESIST, and all known move names** (including effect and base chance). This information is visible immediately, even without scrolling.
- Scrolling the right-hand detail panel reveals each move's element, target scope, multiplier, Charge warning and base status chance before target resistance, along with phase-two differences, stagger notes, rewards and original equipment drop listings.
- The existing art remains, but with a shorter Index image height for easier reading.

## Battlefield
- MAIN BOSS and MINI BOSS are now **plain gold/purple text above the enemy**, with no large framed badge. Phase 2 is still identified in the label.
- Player effects such as Burn, Poison, Bleed, Freeze, Stun and Weaken display as **compact clickable icons** with a small remaining-turn count. An icon's tooltip shows who is affected.
- Existing party Guard gets a small shield icon; active monster debuffs Chill and Weaken also have icons.
- Clicking a status icon opens **INDEX → STATUS** to read its effect/counterplay. The canonical Codex now documents enemy-only **Chill**, and clarifies how hero vs enemy **Weaken** differs.
- Character names, damage log, existing skill buttons and combat state were not changed.

## Tests
- GitHub Actions validates syntax and runs all existing and new tests.
- Added a **simulated browser DOM test** executing `adventure-index-v0551.js`: confirms all three tabs render, boss quick summary is above art, effect chance appears, each tab can be opened, and the Index fetches the cache-busted API.
- Existing socket/battle/save/merchant and reward regression tests are retained.
- See the branch's latest CI result. Human browser (Render) and multiplayer verification remain outstanding.

## Deploy
1. Open Render → `soulbound_online` → Settings → Branch.
2. Change to `v0.55.1-index-status-boss-ui-fix` → Save Changes → Deploy latest commit if needed.
3. When Render says **Live**, open the game. Use **Ctrl+F5** once to refresh the HTML.
4. Open 📖 INDEX. Its footer should say **INDEX UI v0.55.1**, and its left sidebar should show **ธาตุ / สถานะ / กฎการต่อสู้** in Thai mode (or ELEMENTS / STATUS / COMBAT RULES in English mode).
5. Select The Briarfang Alpha: right column should show Nature, weak to Fire, resists Nature and Briarstorm (Bleed, 55% chance) **before** the boss art.
6. Enter battle: MAIN BOSS should be unframed plain text; effects should be compact icons. Click Bleed / other icons to jump directly to INDEX → STATUS.

No new images or Supabase migrations are necessary.
