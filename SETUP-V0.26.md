# SOULBOUND Online v0.26 — Living Legends

**Branch:** `v0.26-sound-heroes-combat` — forked from `v0.25-outer-frame-gacha`.
**No main-branch merge, live Render deploy, or database migration performed.**

## Installed changes

### 1. New original audio engine — `public/audio.js`
- Layered fantasy SFX: different attack profiles for swords, heavy maces/hammers, spell/staff casting, hit reactions, shields, heals/mana, victory/defeat, bosses, merchant purchase, and bloodline summon.
- Procedural original adaptive background soundtracks for all six zones: Wilds, Ruins, Cavern, Frost, Abyss, Castle, with boss and merchant variations.
- Music toggle, master volume and separate in-game SFX volume slider.
- Audio uses browser Web Audio API and starts only after a user interaction (browser autoplay policy). No third-party songs or external files required.
- For older browsers with no Web Audio API, gameplay still runs with sound disabled.

### 2. Inventory and Equipment fix
- Removed the obsolete full-screen backdrop in `game.js`; opening the menus now highlights/scrolls to their **existing in-layout HUD panels**.
- `v026.css` overrides old fixed modal positioning and blurred backdrop from `v022.css`; menus no longer cover the screen with a black blur.
- Buying and equipping continue through the existing server-authoritative endpoints.

### 3. Pixel heroes and gender selection
- New `public/hero-v026.js` composes original 160×240 transparent SVG characters from body, head, hair, armor, shield, cape, weapon and accessory components.
- Three playable classes (**Swordsman, Mage, Tank**), each with male/female visual variants; gender selector and live sprite preview added to the lobby.
- Weapon and armor appearance respond to named equipment. Distinct Iron/Guardian/Dragon/Void/Archmage/Dawnsteel families and Emberbrand, Tidecall, Starweave and Warden weapon decorations.
- Procedural pixel-art gear thumbnails visible in equipment, inventory and the merchant shop.
- Idle animation, alternate two-pose slash/hammer/casting stances, player lunge, and animated blade/impact/spell effects.
- Character gender travels with room creation and restoration in multiplayer. Guest gender saves locally. For signed-in users, gender preference uses Supabase Auth user metadata (`soulbound_gender`), avoiding a new `profiles` column or SQL migration.

### 4. Larger battle area and merchant
- Desktop stage viewport scales up while remaining responsive. A **VIEW +** button lets players expand the battle stage further when desired.
- Added `public/assets/npc/merchant-v026.svg` with an original illustrated traveling merchant portrait.
- The existing six stage environments, account system, and multiplayer logic are preserved.

### 5. Balance pass and new gear
- Moderate late-stage encounter scaling: 0.23 → 0.255 per 3-stage group. Existing saved player stats and item stats are unchanged.
- Three mid-tier Lv5 weapons: **Emberbrand Sabre** (+22 ATK Swordsman, 510 G), **Tidecall Staff** (+23 ATK Mage, 530 G), **Warden Hammer** (+22 ATK Tank, 510 G).
- One Lv9 armor: **Dawnsteel Mail** (+15 DEF, +70 Max HP, 690 G).
- No new item transaction path; these use existing shop/inventory/equip rules.
- This is an initial balance pass, **not a fully playtested rebalancing of all 24 stages**.

## Deploy

1. Open Render → Web Service `soulbound_online` → Settings → Branch.
2. Change to `v0.26-sound-heroes-combat` and Save Changes. Render may deploy automatically.
3. After deployment completes, open `https://soulbound-online.onrender.com` and press Ctrl+F5.
4. Verify the title shows v0.26. Test at browser zoom 100%.

## Manual testing checklist

- [ ] From the lobby choose each of Swordsman, Mage and Tank. Switch Female/Male and verify the live portrait changes.
- [ ] Start a New Game as Guest or a logged-in account. Reload/Continue; verify class, gender, current gear and stats persist.
- [ ] Fight with each class: Idle → attack/cast pose → Idle. Watch the slash, arcane burst and hammer effect.
- [ ] Enable Music, adjust master and SFX sliders; verify distinct sword/hammer/staff/guard/heal sounds and music at stages 1/5/9/13/17/21.
- [ ] Click EQUIPMENT and INVENTORY. Confirm there is **no dark overlay** and the correct panel gains a gold highlight.
- [ ] Click VIEW + and VIEW −. Confirm arena grows and shrinks without affecting controls.
- [ ] Buy/equip the four new items, verify gold and inventory changes, and that the player sprite/gear icons update appropriately.
- [ ] Visit the merchant at stage 4. Verify portrait, tab switching, scroll, buy, close and reopen.
- [ ] Test a 2-player party, monster hits, boss stage, saves, and restart/continue behavior.

## Current limitations

- Static validation was performed; a live browser/Render deployment, full 24-stage balance playtest, Supabase cross-device save test, and multiplayer integration test were not available in this environment.
- The integrated hero art is a higher-detail **procedural pixel-style SVG**, not a full hand-drawn raster/AI sprite atlas at the same visual density as every background.
- Idle and attack/cast animations are **CSS motion plus alternate poses**, not a fully frame-drawn walk/attack/hit spritesheet. To create hand-drawn animation, the quickest workflow is Aseprite or Piskel: use a transparent 160×240 canvas per class/gender, draw idle 4 frames, attack 6 frames, hit 3 frames, export horizontal PNG spritesheets with equal-size frames. The character compositing code in `hero-v026.js` is isolated, so a future patch can swap to sprite atlas rendering without rewriting game logic.
