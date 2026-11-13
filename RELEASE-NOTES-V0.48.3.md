# SOULBOUND v0.48.3 — Roadside Merchant & Readable Battle Log

## Summary
- Remove the floating **BAG** button on the capital scene. **EQUIPMENT & BAG** remains accessible in the lower HUD; bag/inventory functionality has not changed.
- Distinguish **city merchants** (weapon-only, armor-only, supplies-only) from the **roadside traveling merchant**. After winning any regular stage or boss stage, the party leader may open a traveling merchant using the **TRAVELING MERCHANT** button.
- Roadside camp is shown over the **battle scene**, with separate rustic camping/merchant styling. It does *not* use the capital background.
- Roadside merchant sells potions and food. Opening/closing the roadside shop stores and restores the room's pre-shop status (`victory` or `regionClear`), with no HP/MP, stage, equipment, gold, region, or save reset.
- Closing the city shop stays in the city, as before.
- Extend the Battle Log inner scroll area to fill the floating LOG panel, and deliver up to 40 recent log messages instead of 14.
- Update header, title menu, API health, package version and in-game Update Log to **v0.48.3**.

## How to use
1. Defeat any regular monster or boss; the win screen includes **TRAVELING MERCHANT**.
2. Party leader opens the camp; all party members can buy potions/food with their own gold.
3. Close camp to return to that cleared stage. Continue to the next stage (regular victory) or choose the next region (boss cleared).
4. Inside Central City, click the weapon smith, armor shop or supplies stand to use their city-only store categories.
5. The floating BAG icon on top of the capital is gone; use the lower **EQUIPMENT & BAG** button.

## Deploy
Select Render branch `v0.48.3-camp-merchant-log-ui`, Save Changes, deploy latest commit (or allow auto-deploy), wait until Live, then Ctrl+F5. **No image upload required.** Tested with automated JS syntax checks and existing + new regression tests. Actual Render browser interactions still need manual checking.
