# SOULBOUND v0.48.4 — Unified Audio, Mini-Boss Merchant, Full-Height Log and Boss Tags

Built on `v0.48.3-camp-merchant-log-ui`.

## Implemented

1. **Single Audio menu:** the top bar displays one **AUDIO** control. Its dropdown now contains Music ON/OFF and SFX ON/OFF, independent Music and SFX volume sliders, and TEST ATTACK. The existing underlying audio handlers and persisted levels remain in use.
2. **Roadside merchant after mini-boss ONLY:** each region contains five stages. The merchant button appears after winning that region's fourth encounter, i.e. global stages **4, 9, 14, 19, 24, 29, 34, 39**. The server also enforces `status === "victory"`, `stage % 5 === 4` and `monster.miniBoss === true`; clearing a regular monster or the fifth-stage main boss cannot open the roadside merchant.
3. **City merchants unchanged:** the capital still has weapon-only, armor-only and potion+food stores. Roadside merchant remains a separate camp over the battlefield and closing it returns to the defeated mini-boss's victory state without resetting progression.
4. **Battle Log fully fills its parent:** the inner dark scrollable log is positioned from under the panel heading down to within 8 px of the bottom border. Existing message history (up to 40 events) stays readable and scrollable; no dark/blur full-screen overlay.
5. **Enemy badges:** a prominent purple **MINI BOSS** badge or red-gold **MAIN BOSS** badge is displayed above the enemy sprite, clearly differentiating encounters. Normal monsters show neither.
6. Updated game title/version, package, API version and Update Log to v0.48.4.

## Test status

The automated regression suite checks all 8 region mini-boss stages, authoritative merchant guards, audio DOM nesting, audio handlers, boss tag position, and log sizing, as well as existing save/loot/combat tests. 77/77 tests passed at GitHub Actions run 43421148387, followed by a CSS stacking-layer adjustment. Manual browser checks on Render and multiplayer tests are not yet completed.

## Deploy & check

1. Open Render → `soulbound_online` → Settings → Branch → `v0.48.4-audio-mini-camp-boss-tags` → Save Changes.
2. Allow Auto Deploy or use Manual Deploy → Deploy latest commit.
3. Once Live, Ctrl+F5 and check Audio dropdown, LOG area and a regular monster.
4. Win stage 3: NO Traveling Merchant. Win **stage 4 mini-boss**: merchant button appears. Close shop and proceed to stage 5 main boss: merchant button must NOT appear after the main boss.
5. Check later mini-boss stages 9, 14, etc., if convenient. Saved characters should persist as before.

No image assets or database schema changes are required.
