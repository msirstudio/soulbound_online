# SOULBOUND v0.47 — Interactive Capital

Based on `v0.46-generated-pixel-map`. The game code has been updated, and the new background image must be uploaded by the user.

## File to upload

`public/assets/city/forgotten-capital.webp` (2172×724; about 646 KB)

This is the pixel-art capital created in chat. Download the attached ZIP and upload that exact file using the GitHub website:
https://github.com/msirstudio/soulbound_online/upload/v0.47-interactive-capital/public/assets/city

**Do not upload the ZIP itself.** Expand it, open the folder `public/assets/city`, and select `forgotten-capital.webp` only. Commit changes on the `v0.47-interactive-capital` branch.

## Clickable scene design

- Upper-left weaponsmith building: **WEAPON SHOP**. Opens the existing merchant with the Weapon tab active.
- Left-side equipment stalls: **ARMOR SHOP**. Opens the existing merchant with Armor active.
- Right-side potion display and vendor: **POTIONS & FOOD**. Opens existing merchant with Potions selected; Food tab is adjacent.
- Blue crystal fountain near the center: **ADVENTURE**. Opens the existing interactive World Atlas.
- Existing secondary action buttons, inventory and other controls remain functional.
- Merchant purchasing uses the existing server-side gold and inventory validation. Party leader opens the city shop; everyone can buy for themselves.
- Buttons have mobile-position adjustments and keyboard focus styles.

## Deploy

When the image has been uploaded and GitHub CI is green, in Render select the branch `v0.47-interactive-capital`, Deploy latest commit, and refresh with Ctrl+F5. Verify image and hotspots at the actual screen resolution.

## Notes

The GitHub connector could update JavaScript and CSS but could not upload the new binary WebP image directly. Until the image is uploaded, the illustrated city background will **not** display; it will show the CSS fallback. The game code, merchant catalog, authentication and saves have not been replaced.

Automated tests validate JS syntax and source-level behavior, but manual visual click tests in a real browser remain necessary.
